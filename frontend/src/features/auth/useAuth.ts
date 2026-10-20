import { createContext, useContext } from "react";
import type { AuthUser, LoginInput } from "@/api/auth";

interface AuthContextValue {
  user: AuthUser | null | undefined;
  isLoading: boolean;
  isError: boolean;
  isLoggingOut: boolean;
  refresh: () => void;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
