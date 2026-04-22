import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/data/types';
import { DEMO_MODE_ENABLED, ENABLE_ROLE_SWITCHER, ROLE_SWITCHER_ALLOWLIST } from '@/config/app';

const DEV_ROLE_STORAGE_KEY = 'orquestra:dev_role_override';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar: string | null;
  patient_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole | null;
  availableRoles: UserRole[];
  canRoleSwitcherOverride: boolean;
  patientId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;

  // Compat helpers (retained for legacy components that read role/user shape)
  currentRole: UserRole;
  currentUser: { id: string; name: string; email: string; role: UserRole; patientId?: string };
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  // Dev-only override (not persisted)
  const [devRoleOverride, setDevRoleOverride] = useState<UserRole | null>(null);

  const loadProfileAndRole = async (userId: string) => {
    const [{ data: profileRow }, { data: roleRows }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, avatar, patient_id').eq('id', userId).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
    ]);

    setProfile(profileRow as Profile | null);

    // Pick highest privilege role if multiple
    const order: UserRole[] = ['admin', 'manager', 'professional', 'patient'];
    const roles = Array.from(new Set((roleRows || []).map(r => r.role as UserRole)));
    setAvailableRoles(roles);
    const savedRole = localStorage.getItem(DEV_ROLE_STORAGE_KEY) as UserRole | null;
    const selectedRole = savedRole && roles.includes(savedRole)
      ? savedRole
      : order.find(r => roles.includes(r)) || null;

    setRoleState(selectedRole);
  };

  useEffect(() => {
    // 1. Set up listener FIRST (sync only)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // Defer async work to avoid deadlock with auth state
        setTimeout(() => {
          loadProfileAndRole(newSession.user.id);
        }, 0);
      } else {
        setProfile(null);
        setRoleState(null);
        setAvailableRoles([]);
        setDevRoleOverride(null);
      }
    });

    // 2. Then fetch existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        loadProfileAndRole(existingSession.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setDevRoleOverride(null);
    localStorage.removeItem(DEV_ROLE_STORAGE_KEY);
  };

  const userEmail = (profile?.email ?? user?.email ?? '').toLowerCase();
  const canUseDevRoleOverride =
    DEMO_MODE_ENABLED ||
    ENABLE_ROLE_SWITCHER ||
    ROLE_SWITCHER_ALLOWLIST.includes('*') ||
    ROLE_SWITCHER_ALLOWLIST.includes(userEmail);

  useEffect(() => {
    if (!canUseDevRoleOverride) return;

    const savedRole = localStorage.getItem(DEV_ROLE_STORAGE_KEY) as UserRole | null;
    if (savedRole) {
      setDevRoleOverride(savedRole);
    }
  }, [canUseDevRoleOverride]);

  const effectiveRole = (canUseDevRoleOverride && devRoleOverride) || role || 'professional';

  const setRole = (r: UserRole) => {
    if (canUseDevRoleOverride) {
      setDevRoleOverride(r);
      localStorage.setItem(DEV_ROLE_STORAGE_KEY, r);
      return;
    }

    if (availableRoles.includes(r)) {
      setRoleState(r);
      localStorage.setItem(DEV_ROLE_STORAGE_KEY, r);
    }
  };

  const currentUser = {
    id: user?.id ?? 'anonymous',
    name: profile?.full_name ?? user?.email ?? 'Usuário',
    email: profile?.email ?? user?.email ?? '',
    role: effectiveRole,
    patientId: profile?.patient_id ?? undefined,
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role: effectiveRole,
        availableRoles,
        canRoleSwitcherOverride: canUseDevRoleOverride,
        patientId: profile?.patient_id ?? null,
        loading,
        signIn,
        signUp,
        signOut,
        currentRole: effectiveRole,
        currentUser,
        setRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
