// DOGE Spatial Explorer — AuthGate
// Protects routes: redirects to /login if unauthenticated, shows 403 if no permission

import React from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type AuthGateProps = {
  children: React.ReactNode;
  requiredPermissions?: string[];
};

export default function AuthGate({ children, requiredPermissions }: AuthGateProps) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-mono">Authenticating…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const allGranted = requiredPermissions.every((p) => hasPermission(p));
    if (!allGranted) {
      return (
        <div className="flex items-center justify-center h-full p-8">
          <div className="text-center max-w-sm">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <ShieldX className="w-8 h-8 text-destructive" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-sm text-muted-foreground mb-6">
              You do not have the required permissions to view this page. Contact your administrator
              to request access.
            </p>
            <div className="flex flex-col gap-2 items-center">
              <code className="text-xs font-mono bg-muted px-3 py-1.5 rounded text-muted-foreground">
                Required: {requiredPermissions.join(", ")}
              </code>
              <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
