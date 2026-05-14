import { createContext, useContext } from 'react';

export interface User {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'nurse' | 'admin';
  patientToken: string;
  mfaEnabled: boolean;
}

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  setupMFA: () => Promise<any>;
  verifyMFA: (token: string) => Promise<any>;
  verifyPendingMFA: (token: string) => Promise<any>;
  logout: () => Promise<void>;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
