import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/data/types';
import { ENABLE_ROLE_SWITCHER } from '@/config/app';

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
  roles: UserRole[];
  activeRole: UserRole | null;
  setActiveRole: (role: UserRole) => void;
  role: UserRole | null;
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

const ROLE_PRIORITY: UserRole[] = ['admin', 'manager', 'professional', 'patient'];

const storageKey = (userId: string) => `orquestra:activeRole:${userId}`;

function pickDefaultRole(roles: UserRole[]): UserRole | null {
  return ROLE_PRIORITY.find(r => roles.includes(r)) || null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [activeRole, setActiveRoleState] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Dev-only override (not persisted) — only used when ENABLE_ROLE_SWITCHER is true
  // and the user wants to simulate a role they don't actually have.
  const [devRoleOverride, setDevRoleOverride] = useState<UserRole | null>(null);

  const loadProfileAndRoles = async (userId: string) => {
    const [{ data: profileRow }, { data: roleRows }] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email, avatar, patient_id').eq('id', userId).maybeSingle(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
    ]);

    setProfile(profileRow as Profile | null);

    const userRoles = (roleRows || []).map(r => r.role as UserRole);
    // Sort by priority for stable display order
    const sortedRoles = ROLE_PRIORITY.filter(r => userRoles.includes(r));
    setRoles(sortedRoles);

    // Restore persisted active role if still valid; otherwise default to highest priority
    let initial: UserRole | null = null;
    try {
      const stored = localStorage.getItem(storageKey(userId)) as UserRole | null;
      if (stored && sortedRoles.includes(stored)) initial = stored;
    } catch { /* ignore */ }

    setActiveRoleState(initial || pickDefaultRole(sortedRoles));
  };

  useEffect(() => {
    // 1. Set up listener FIRST (sync only)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        // Defer async work to avoid deadlock with auth state
        setTimeout(() => {
          loadProfileAndRoles(newSession.user.id);
        }, 0);
      } else {
        setProfile(null);
        setRoles([]);
        setActiveRoleState(null);
      }
    });

    // 2. Then fetch existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      if (existingSession?.user) {
        loadProfileAndRoles(existingSession.user.id).finally(() => setLoading(false));
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
  };

  const setActiveRole = useCallback((r: UserRole) => {
    // Only allow switching to a role the user actually owns
    if (!roles.includes(r)) {
      // Dev override path: only when explicitly enabled
      if (ENABLE_ROLE_SWITCHER) setDevRoleOverride(r);
      return;
    }
    setDevRoleOverride(null);
    setActiveRoleState(r);
    if (user?.id) {
      try { localStorage.setItem(storageKey(user.id), r); } catch { /* ignore */ }
    }
  }, [roles, user?.id]);

  const effectiveRole: UserRole =
    (ENABLE_ROLE_SWITCHER && devRoleOverride) || activeRole || 'professional';

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
        roles,
        activeRole: effectiveRole,
        setActiveRole,
        role: effectiveRole,
        patientId: profile?.patient_id ?? null,
        loading,
        signIn,
        signUp,
        signOut,
        currentRole: effectiveRole,
        currentUser,
        setRole: setActiveRole,
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
