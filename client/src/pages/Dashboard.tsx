// DOGE Spatial Explorer — Dashboard Page
// Overview with stats cards, recharts analytics, and recent items
// Design: Spatial Intelligence Command Center

import React, { useState, useEffect } from "react";
import { Link } from "wouter";
import { Database, Activity, TrendingUp, Globe, ArrowRight, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import StatusBadge from "@/components/StatusBadge";
import { apiGetItems } from "@/lib/mockData";
import type { Item } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

// Mock time-series data for charts
const WEEKLY_ACTIVITY = [
  { day: "Mon", created: 2, updated: 5, deleted: 0 },
  { day: "Tue", created: 1, updated: 3, deleted: 1 },
  { day: "Wed", created: 3, updated: 7, deleted: 0 },
  { day: "Thu", created: 0, updated: 4, deleted: 2 },
  { day: "Fri", created: 4, updated: 6, deleted: 0 },
  { day: "Sat", created: 1, updated: 2, deleted: 0 },
  { day: "Sun", created: 0, updated: 1, deleted: 0 },
];

const MONTHLY_RECORDS = [
  { month: "Oct", count: 3 },
  { month: "Nov", count: 5 },
  { month: "Dec", count: 4 },
  { month: "Jan", count: 7 },
  { month: "Feb", count: 6 },
  { month: "Mar", count: 9 },
  { month: "Apr", count: 4 },
];

const STATUS_COLORS = {
  active: "#34d399",
  draft: "#fbbf24",
  archived: "#94a3b8",
};

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(isoDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const CHART_TOOLTIP_STYLE = {
  backgroundColor: "oklch(0.14 0.028 255)",
  border: "1px solid oklch(1 0 0 / 10%)",
  borderRadius: "8px",
  color: "oklch(0.92 0.008 240)",
  fontSize: "12px",
  fontFamily: "'JetBrains Mono', monospace",
};

export default function Dashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, draft: 0, archived: 0 });

  useEffect(() => {
    apiGetItems({ page: 1, pageSize: 100 }).then((res) => {
      setItems(res.data);
      setStats({
        total: res.total,
        active: res.data.filter((i) => i.status === "active").length,
        draft: res.data.filter((i) => i.status === "draft").length,
        archived: res.data.filter((i) => i.status === "archived").length,
      });
      setLoading(false);
    });
  }, []);

  const recentItems = items
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const pieData = [
    { name: "Active", value: stats.active, color: STATUS_COLORS.active },
    { name: "Draft", value: stats.draft, color: STATUS_COLORS.draft },
    { name: "Archived", value: stats.archived, color: STATUS_COLORS.archived },
  ].filter((d) => d.value > 0);

  const STAT_CARDS = [
    {
      label: "Total Records",
      value: stats.total,
      icon: Database,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
      change: "+4 this week",
    },
    {
      label: "Active",
      value: stats.active,
      icon: Activity,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      change: "Operational",
    },
    {
      label: "Draft",
      value: stats.draft,
      icon: TrendingUp,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      change: "Pending review",
    },
    {
      label: "Archived",
      value: stats.archived,
      icon: Globe,
      color: "text-slate-400",
      bg: "bg-slate-500/10 border-slate-500/20",
      change: "Historical",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] ?? "Analyst"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Link href="/app/items/new">
          <Button size="sm" className="hidden sm:flex items-center gap-2">
            <span>New Record</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => (
          <Card key={card.label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${card.bg}`}>
                  <card.icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{card.change}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly activity area chart */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={WEEKLY_ACTIVITY} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.58 0.22 258)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.58 0.22 258)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUpdated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
                <XAxis dataKey="day" tick={{ fill: "oklch(0.60 0.015 255)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "oklch(0.60 0.015 255)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ stroke: "oklch(1 0 0 / 10%)" }} />
                <Area type="monotone" dataKey="created" stroke="oklch(0.58 0.22 258)" strokeWidth={2} fill="url(#colorCreated)" name="Created" />
                <Area type="monotone" dataKey="updated" stroke="#34d399" strokeWidth={2} fill="url(#colorUpdated)" name="Updated" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status breakdown pie */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="h-[180px] flex items-center justify-center">
                <Skeleton className="w-32 h-32 rounded-full" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <ResponsiveContainer width="100%" height={130}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3">
                  {pieData.map((d) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-xs text-muted-foreground">{d.name} ({d.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly records bar chart + recent items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly bar chart */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">Monthly Records</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={MONTHLY_RECORDS} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 6%)" />
                <XAxis dataKey="month" tick={{ fill: "oklch(0.60 0.015 255)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "oklch(0.60 0.015 255)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} cursor={{ fill: "oklch(1 0 0 / 5%)" }} />
                <Bar dataKey="count" fill="oklch(0.58 0.22 258)" radius={[4, 4, 0, 0]} name="Records" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent items */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground">Recent Records</CardTitle>
              <Link href="/app/items">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7">
                  View all <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-4 flex-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {recentItems.map((item) => (
                  <Link key={item.id} href={`/app/items/${item.id}`}>
                    <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/40 transition-colors group">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">{item.id}</p>
                      </div>
                      <StatusBadge status={item.status} />
                      <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
                        {formatRelativeTime(item.updatedAt)}
                      </span>
                    </a>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
