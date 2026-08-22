// DOGE Spatial Explorer — Admin Panel
// Admin-only page: user management overview, system stats, RBAC enforcement demo

import { ShieldCheck, Users, Database, Activity, AlertTriangle, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminPanel() {
  const { user } = useAuth();
  const { data: stats } = trpc.items.stats.useQuery();

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin Panel</h1>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs" variant="outline">
              ADMIN ONLY
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            System administration and access control management
          </p>
        </div>
      </div>

      {/* Admin identity card */}
      <Card className="bg-amber-500/5 border-amber-500/20">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Authenticated as <span className="text-amber-400">{user?.name}</span>
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              Role: <span className="text-amber-400">admin</span> · Permissions:{" "}
              {user?.permissions?.join(", ")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* System stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Records", value: stats?.total ?? "—", icon: Database, color: "text-primary" },
          { label: "Active", value: stats?.active ?? "—", icon: Activity, color: "text-emerald-400" },
          { label: "Draft", value: stats?.draft ?? "—", icon: AlertTriangle, color: "text-amber-400" },
          { label: "Archived", value: stats?.archived ?? "—", icon: Database, color: "text-slate-400" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-3 flex items-center gap-3">
              <stat.icon className={`w-5 h-5 ${stat.color} flex-shrink-0`} />
              <div>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin capabilities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm">Access Control</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Manage user roles and permissions. Switch roles in Settings to demo RBAC enforcement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/app/settings">
              <Button variant="outline" size="sm" className="gap-2 w-full">
                <Settings className="w-3.5 h-3.5" />
                Manage Roles in Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm">Record Management</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Admins can create, edit, and delete all records. Members can only create and edit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/app/items">
              <Button variant="outline" size="sm" className="gap-2 w-full">
                <Database className="w-3.5 h-3.5" />
                View All Records
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* RBAC explanation */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm">Role-Based Access Control (RBAC)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Permission</th>
                  <th className="text-center py-2 px-4 text-muted-foreground font-medium">Member</th>
                  <th className="text-center py-2 px-4 text-muted-foreground font-medium">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { perm: "items:read", member: true, admin: true },
                  { perm: "items:write", member: true, admin: true },
                  { perm: "items:delete", member: false, admin: true },
                  { perm: "admin:access", member: false, admin: true },
                ].map((row) => (
                  <tr key={row.perm}>
                    <td className="py-2 pr-4 font-mono text-foreground">{row.perm}</td>
                    <td className="py-2 px-4 text-center">
                      {row.member ? (
                        <span className="text-emerald-400">✓</span>
                      ) : (
                        <span className="text-destructive/60">✗</span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-center">
                      {row.admin ? (
                        <span className="text-emerald-400">✓</span>
                      ) : (
                        <span className="text-destructive/60">✗</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
