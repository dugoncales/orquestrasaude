import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole, User } from '@/data/types';

interface AuthContextType {
  currentUser: User;
  currentRole: UserRole;
  setRole: (role: UserRole) => void;
}

const users: Record<UserRole, User> = {
  patient: { id: 'u1', name: 'Maria da Silva Santos', role: 'patient', email: 'maria@email.com' },
  professional: { id: 'u2', name: 'Dra. Ana Beatriz', role: 'professional', email: 'ana@clinica.com' },
  manager: { id: 'u3', name: 'Dr. Fernando Gestão', role: 'manager', email: 'fernando@clinica.com' },
  admin: { id: 'u4', name: 'Admin Sistema', role: 'admin', email: 'admin@carejourney.com' },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>('professional');
  const currentUser = users[currentRole];

  return (
    <AuthContext.Provider value={{ currentUser, currentRole, setRole: setCurrentRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
