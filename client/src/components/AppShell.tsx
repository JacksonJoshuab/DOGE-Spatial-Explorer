// DOGE Spatial Explorer — AppShell
// Responsive layout shell: fixed sidebar (desktop) + topbar + main content
// Design: Spatial Intelligence Command Center

import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Database,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  Activity,
  Globe,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  badge?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/app", icon: LayoutDashboard },
  { label: "Items", href: "/app/items", icon: Database, permission: "items:read" },
  { label: "Geospatial", href: "/app/geospatial", icon: Globe },
  { label: "Activity", href: "/app/activity", icon: Activity },
  { label: "Admin Panel", href: "/app/admin", icon: ShieldCheck, permission: "admin:access" },
  { label: "Settings", href: "/app/settings", icon: Settings },
];

type AppShellProps = {
  children: React.ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const { user, logout, hasPermission } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  const userInitials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  const isActive = (href: string) => {
    if (href === "/app") return location === "/app" || location === "/app/";
    return location.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0",
          "border-r border-border",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "linear-gradient(180deg, oklch(0.12 0.028 255) 0%, oklch(0.10 0.025 255) 100%)",
        }}
        aria-label="Main navigation"
      >
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/20 border border-primary/30">
            <Shield className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-foreground">DOGE</div>
            <div className="text-xs text-muted-foreground font-mono">Spatial Explorer</div>
          </div>
          <button
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" role="navigation">
          {visibleNav.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                    "hover:bg-accent hover:text-accent-foreground",
                    active
                      ? "bg-primary/15 text-primary border-l-2 border-primary pl-[10px]"
                      : "text-muted-foreground border-l-2 border-transparent"
                  )}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      {item.badge}
                    </Badge>
                  )}
                  {active && <ChevronRight className="w-3 h-3 opacity-60" />}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-foreground truncate">{user?.name}</span>
                {user?.role === "admin" && (
                  <Badge className="text-[10px] px-1 py-0 h-4 bg-amber-500/20 text-amber-400 border-amber-500/30" variant="outline">ADMIN</Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate font-mono">{user?.email}</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-muted-foreground hover:text-destructive"
              onClick={logout}
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-4 lg:px-6 h-14 border-b border-border bg-background/80 backdrop-blur-sm flex-shrink-0">
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            aria-expanded={sidebarOpen}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <div className="flex-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            {visibleNav.map((item) => {
              const active = isActive(item.href);
              if (!active) return null;
              return (
                <span key={item.href} className="font-medium text-foreground">{item.label}</span>
              );
            })}
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden sm:inline font-mono">LIVE</span>
          </div>

          {/* Quick action */}
          <Link href="/app/items/new">
            <Button size="sm" variant="ghost" className="hidden sm:flex items-center gap-1.5 text-xs h-8 px-2.5 text-muted-foreground hover:text-foreground">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">New Record</span>
            </Button>
          </Link>

          {/* User avatar in topbar (desktop) */}
          <div className="hidden lg:flex items-center gap-2">
            {user?.role === "admin" && (
              <Badge className="text-[10px] px-1.5 py-0 h-5 bg-amber-500/20 text-amber-400 border-amber-500/30" variant="outline">ADMIN</Badge>
            )}
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <Avatar className="w-7 h-7">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
