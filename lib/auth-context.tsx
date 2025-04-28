"use client"

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { User } from 'firebase/auth';

// Define the shape of the auth context
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (email: string, password: string, displayName?: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  signOut: () => Promise<void>;
}

// Create the auth context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export a hook to use the auth context
export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

// Export the auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
} 