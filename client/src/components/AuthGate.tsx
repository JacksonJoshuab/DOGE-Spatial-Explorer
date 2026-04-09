// DOGE Spatial Explorer — AuthGate
// Protects routes: redirects to /login if unauthenticated, shows 403 if no permission

import { Redirect, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldX, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type AuthGateProps = {
  children: React.ReactNode;
  requiredPermissions?: string[];
};

export default function AuthGate({ children, requiredPermissions }: AuthGateProps) {
  const { isAuthenticated, isLoading, hasPermission, user } = useAuth();

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
        <div className="flex items-center justify-center h-full p-8 bg-background">
          <div className="text-center max-w-md">
            {/* Error code */}
            <p className="text-8xl font-black text-destructive/20 font-mono mb-2 select-none">403</p>

            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <ShieldX className="w-8 h-8 text-destructive" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Your current role (<Badge variant="outline" className="font-mono text-xs mx-1">{user?.role ?? "member"}</Badge>)
              does not have the required permissions to view this page.
            </p>

            <div className="flex flex-col gap-3 items-center">
              <div className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-xs font-mono text-muted-foreground">
                Required: {requiredPermissions.join(", ")}
              </div>
              <p className="text-xs text-muted-foreground">
                Go to Settings to switch your role to <strong>admin</strong> to gain access.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                  Go Back
                </Button>
                <Link href="/app/settings">
                  <Button size="sm" className="gap-2">
                    <Settings className="w-3.5 h-3.5" />
                    Switch Role
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
