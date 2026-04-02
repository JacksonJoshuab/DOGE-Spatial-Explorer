// DOGE Spatial Explorer — Geospatial Page (Placeholder)
// Future: Real-time ship/flight tracking, AIS vessel data, shipping lane visualization

import React from "react";
import { Globe, Satellite, Ship, Plane, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const FEATURE_CARDS = [
  {
    icon: Ship,
    title: "AIS Vessel Tracking",
    desc: "Real-time ship positions from Coast Guard AIS data feeds",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
  {
    icon: Plane,
    title: "Flight Route Monitor",
    desc: "Live aircraft positions and route aggregation",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: MapPin,
    title: "Shipping Lane Analysis",
    desc: "Corps of Engineers data with Mississippi River visualization",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: Satellite,
    title: "Satellite Geodata",
    desc: "NOAA and USDA geospatial data integration",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
];

export default function Geospatial() {
  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Geospatial Monitor</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Real-time global movement tracking and geodata analysis
        </p>
      </div>

      {/* Map placeholder */}
      <div
        className="relative rounded-xl border border-border overflow-hidden"
        style={{ height: "320px" }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage:
              "url(https://d2xsxph8kpxj0f.cloudfront.net/116029439/69mnn7kDrambwunF6LqmC3/hero-login-bg-ViXMPsJa9bkiBj9vYaauTv.webp)",
          }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Globe className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-foreground">Interactive Map Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Live vessel tracking, flight routes, and geopolitical data overlay
            </p>
          </div>
          <Button size="sm" onClick={() => toast.info("Feature coming soon")}>
            Enable Preview
          </Button>
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FEATURE_CARDS.map((card) => (
          <Card
            key={card.title}
            className="bg-card border-border cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => toast.info("Feature coming soon", { description: card.desc })}
          >
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${card.bg}`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{card.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{card.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
