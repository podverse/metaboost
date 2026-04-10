'use client';

import type { AuthUser } from '../context/AuthContext';

import { AuthProvider } from '../context/AuthContext';

type AuthWrapperProps = {
  children: React.ReactNode;
  initialUser?: AuthUser | null;
};

export function AuthWrapper({ children, initialUser }: AuthWrapperProps) {
  return <AuthProvider initialUser={initialUser}>{children}</AuthProvider>;
}
