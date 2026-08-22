import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { BellRing, ClipboardList, CloudSun, LayoutDashboard, Menu, Package, PanelLeft, Truck, Wrench } from "lucide-react";
import { CSSProperties, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Operations Dashboard", path: "/dashboard" },
  { icon: ClipboardList, label: "Daily Brief", path: "/daily-brief" },
  { icon: Truck, label: "Fleet & Equipment", path: "/fleet" },
  { icon: Wrench, label: "Operations Manager", path: "/operations" },
  { icon: Package, label: "Materials & Alerts", path: "/operations?tab=materials" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(localStorage.getItem(SIDEBAR_WIDTH_KEY)) || DEFAULT_WIDTH);
  const { user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const activeMenuItem = menuItems.find(item => location === item.path.split("?")[0]);
  const isMobile = useIsMobile();

  return (
    <>
      <div className="relative">
        <Sidebar
          collapsible="icon"
          className="border-r border-slate-800 bg-slate-950 text-slate-100"
        >
          <SidebarHeader className="h-20 justify-center border-b border-slate-800">
            <div className="flex items-center gap-3 px-3 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-orange-300" />
              </button>
              {!isCollapsed ? (
                <div className="min-w-0 leading-tight">
                  <span className="block font-black tracking-tight truncate text-sm text-white">ALL AMERICAN</span>
                  <span className="block font-mono text-[9px] tracking-[0.22em] uppercase text-orange-300">Concrete Ops</span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 pt-4">
            <div className="px-4 pb-2 text-[10px] font-semibold tracking-[0.15em] uppercase text-slate-500 group-data-[collapsible=icon]:hidden">Command Center</div>
            <SidebarMenu className="px-2 py-1 gap-1">
              {menuItems.map(item => {
                const isActive = location === item.path.split("?")[0];
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-11 transition-all font-medium text-slate-300 hover:bg-white/8 hover:text-white data-[active=true]:bg-orange-400 data-[active=true]:text-slate-950 data-[active=true]:font-bold"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-slate-800">
            <div className="flex items-center gap-3 rounded-xl bg-white/5 px-2.5 py-2.5 group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-8 w-8 border border-orange-300/30 shrink-0"><AvatarFallback className="bg-orange-400 text-slate-950 text-xs font-black">{user?.name?.slice(0, 2).toUpperCase() || "AAC"}</AvatarFallback></Avatar>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden"><p className="text-xs font-semibold truncate text-white">{user?.name || "AAC Operations"}</p><p className="text-[10px] text-slate-400">West Liberty, IA</p></div>
            </div>
          </SidebarFooter>
        </Sidebar>
      </div>

      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-3">
            {isMobile && <SidebarTrigger className="h-9 w-9 rounded-lg bg-slate-100" />}
            <div>
              <p className="text-sm font-bold text-slate-950">{activeMenuItem?.label || "AAC Operations"}</p>
              <p className="text-[10px] font-medium tracking-wide text-slate-500">WEST LIBERTY · LIVE CONTROL ROOM</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />System ready</div>
            <button onClick={() => startLogin()} className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"><BellRing className="h-3.5 w-3.5 text-orange-500" />{user ? "Notifications" : "Sign in"}</button>
          </div>
        </header>
        {isMobile && (
          <div className="hidden border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="min-h-[calc(100vh-4rem)] flex-1 bg-slate-50 p-4 sm:p-7">{children}</main>
      </SidebarInset>
    </>
  );
}
