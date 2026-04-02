// DOGE Spatial Explorer — Settings Page
// Account settings, preferences, and session info
// Design: Spatial Intelligence Command Center

import React, { useState } from "react";
import { toast } from "sonner";
import { User, Shield, Bell, Key, LogOut, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

export default function Settings() {
  const { user, session, logout } = useAuth();
  const [notifications, setNotifications] = useState({ email: true, push: false, digest: true });

  const userInitials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  const handleSaveProfile = () => {
    toast.success("Profile saved", { description: "Your changes have been applied." });
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Profile</CardTitle>
          </div>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14">
              <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-foreground">{user?.name}</p>
              <p className="text-sm text-muted-foreground font-mono">{user?.email}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                {user?.roles?.map((role) => (
                  <Badge key={role} variant="secondary" className="text-xs capitalize">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator className="opacity-50" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="display-name" className="text-sm">Display Name</Label>
              <Input
                id="display-name"
                defaultValue={user?.name ?? ""}
                className="bg-input/50 border-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email-field" className="text-sm">Email</Label>
              <Input
                id="email-field"
                type="email"
                defaultValue={user?.email ?? ""}
                className="bg-input/50 border-border"
                readOnly
              />
            </div>
          </div>

          <Button size="sm" onClick={handleSaveProfile} className="gap-2">
            <Save className="w-3.5 h-3.5" /> Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Permissions</CardTitle>
          </div>
          <CardDescription>Your current access level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {user?.permissions?.map((perm) => (
              <code
                key={perm}
                className="text-xs font-mono bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded"
              >
                {perm}
              </code>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Notifications</CardTitle>
          </div>
          <CardDescription>Control how you receive updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: "email" as const, label: "Email notifications", desc: "Receive updates via email" },
            { key: "push" as const, label: "Push notifications", desc: "Browser push alerts" },
            { key: "digest" as const, label: "Weekly digest", desc: "Summary of activity each week" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <Switch
                checked={notifications[item.key]}
                onCheckedChange={(v) => {
                  setNotifications((prev) => ({ ...prev, [item.key]: v }));
                  toast.success("Preference saved");
                }}
                aria-label={item.label}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Session */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" />
            <CardTitle className="text-base">Session</CardTitle>
          </div>
          <CardDescription>Current authentication session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Token</span>
            <code className="font-mono text-xs bg-muted px-2 py-1 rounded text-muted-foreground">
              {session?.accessToken?.slice(0, 20)}…
            </code>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Expires</span>
            <span className="font-mono text-xs text-foreground">
              {session?.expiresAt
                ? new Date(session.expiresAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </span>
          </div>
          <Separator className="opacity-50" />
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
