// Module: Auth — Session Provider | Owner: Frontend Lead
// Client context that owns the signed-in user for the whole app. The session
// lives in an external store (Supabase auth or localStorage, decided in
// src/lib/auth.ts), so it is read via useSyncExternalStore — which also keeps
// multiple tabs in sync.
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { PlatformUser } from "@/types/health";
import {
  getSessionUser,
  isSessionReady,
  login as authLogin,
  logout as authLogout,
  register as authRegister,
  subscribeSession,
  type LoginResult,
  type RegisterResult,
  type RegistrationInput,
} from "@/lib/auth";

/** "loading" during SSR/hydration and while the initial session is restored. */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: PlatformUser | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (input: RegistrationInput) => Promise<RegisterResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useSyncExternalStore(
    subscribeSession,
    getSessionUser,
    () => null,
  );
  const ready = useSyncExternalStore(
    subscribeSession,
    isSessionReady,
    () => false,
  );

  const status: AuthStatus = !ready
    ? "loading"
    : user
      ? "authenticated"
      : "unauthenticated";

  const login = useCallback(
    (email: string, password: string) => authLogin(email, password),
    [],
  );
  const register = useCallback(
    (input: RegistrationInput) => authRegister(input),
    [],
  );
  const logout = useCallback(() => {
    void authLogout();
  }, []);

  const value = useMemo(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
