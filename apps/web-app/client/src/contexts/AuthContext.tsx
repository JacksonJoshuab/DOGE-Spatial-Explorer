// DOGE Spatial Explorer — Auth Context
// Bridges the tRPC auth.me hook into the existing AuthContext interface
// so all pages/components continue to work without changes

import React, { createContext, useContext, useCallback, useMemo } from "react";
import { useAuth as useTrpcAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

// User shape from the DB (via tRPC auth.me)
type DbUser = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

// Legacy-compatible user shape exposed to the rest of the app
type User = {
  id: string;
  name?: string;
  email?: string;
  roles: string[];
  permissions: string[];
  role: "user" | "admin";
  dbUser: DbUser;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Map DB role → permissions
function roleToPermissions(role: "user" | "admin"): string[] {
  if (role === "admin") {
    return ["items:read", "items:write", "items:delete", "admin:access"];
  }
  return ["items:read", "items:write"];
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: dbUser, loading, logout: trpcLogout, isAuthenticated } = useTrpcAuth();

  const user = useMemo<User | null>(() => {
    if (!dbUser) return null;
    const role = (dbUser as DbUser).role ?? "user";
    const permissions = roleToPermissions(role);
    return {
      id: String((dbUser as DbUser).id ?? (dbUser as DbUser).openId),
      name: (dbUser as DbUser).name ?? undefined,
      email: (dbUser as DbUser).email ?? undefined,
      roles: [role],
      permissions,
      role,
      dbUser: dbUser as DbUser,
    };
  }, [dbUser]);

  const logout = useCallback(async () => {
    await trpcLogout();
    window.location.href = getLoginUrl();
  }, [trpcLogout]);

  const hasPermission = useCallback(
    (permission: string) => user?.permissions?.includes(permission) ?? false,
    [user]
  );

  const hasRole = useCallback(
    (role: string) => user?.roles?.includes(role) ?? false,
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading: loading,
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
