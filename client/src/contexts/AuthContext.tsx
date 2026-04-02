// DOGE Spatial Explorer — Auth Context
// Manages authentication state, login/logout flows, and permission checks

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User, Session } from "@/lib/types";
import { apiLogin, apiLogout, apiGetMe } from "@/lib/mockData";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = "doge_session";
const USER_KEY = "doge_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const storedSession = localStorage.getItem(SESSION_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedSession && storedUser) {
        const parsedSession: Session = JSON.parse(storedSession);
        const parsedUser: User = JSON.parse(storedUser);
        // Check expiry
        if (new Date(parsedSession.expiresAt) > new Date()) {
          setSession(parsedSession);
          setUser(parsedUser);
        } else {
          localStorage.removeItem(SESSION_KEY);
          localStorage.removeItem(USER_KEY);
        }
      }
    } catch {
      // ignore parse errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: u, session: s } = await apiLogin(email, password);
    setUser(u);
    setSession(s);
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    localStorage.setItem(USER_KEY, JSON.stringify(u));
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const hasPermission = useCallback(
    (permission: string) => {
      return user?.permissions?.includes(permission) ?? false;
    },
    [user]
  );

  const hasRole = useCallback(
    (role: string) => {
      return user?.roles?.includes(role) ?? false;
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user && !!session,
        isLoading,
        login,
        logout,
        hasPermission,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
