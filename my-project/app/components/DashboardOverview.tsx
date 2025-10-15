"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";

type Overview = {
  totalSubscribers: number;
  activeSubscribers: number;
  pendingSends: number;
  lastCampaignOpenRate: number;
  lastCampaignCTR: number;
  lastCampaign?: { id: number; title: string | null; sent: number; opened: number } | null;
};

export default function DashboardOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch('/api/dashboard/overview')
      .then((res) => res.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setData(json as Overview);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} size="lg" className="animate-pulse">
          <CardContent className="p-4">
            <div className="h-8 w-32 bg-[var(--muted)]/20 rounded" />
            <div className="mt-4 h-8 bg-[var(--muted)]/20 rounded w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (error) return (
    <Card className="border border-destructive/20 p-3">
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-destructive">Failed to load dashboard overview</div>
          <button onClick={load} className="text-sm underline">Retry</button>
        </div>
      </CardContent>
    </Card>
  );

  const overview = data!;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-h-0">
      <StatCard label="Total Subscribers" value={String(overview.totalSubscribers)} size="lg" subtitle="All contacts" />
      <StatCard label="Active Subscribers" value={String(overview.activeSubscribers)} size="lg" subtitle="Engaged recently" />
      <StatCard label="Pending Sends" value={String(overview.pendingSends)} size="lg" subtitle="Scheduled emails" />
      {/* Last open moved below on the second row for a denser 3-column layout */}
      <div className="lg:col-span-3">
        <StatCard label="Last Open %" value={`${overview.lastCampaignOpenRate}%`} size="lg" subtitle={overview.lastCampaign ? overview.lastCampaign.title ?? 'Last campaign' : 'No campaigns'} />
      </div>
    </div>
  );
}

function StatCard({ label, value, size, subtitle }: { label: string; value: string; size?: "default" | "lg"; subtitle?: string }) {
  return (
    <Card size={size} className="flex flex-col justify-between min-h-0 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground truncate">{label}</div>
            <div className="mt-2 flex items-baseline gap-3">
              <div className="text-3xl sm:text-4xl font-extrabold leading-tight truncate">{value}</div>
              <div className="text-sm text-muted-foreground">{/* delta placeholder */}—</div>
            </div>
            {subtitle && <div className="text-xs text-muted-foreground mt-2 truncate">{subtitle}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
