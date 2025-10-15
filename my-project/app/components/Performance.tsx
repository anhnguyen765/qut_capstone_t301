"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { ResponsiveContainer, BarChart, Bar } from "recharts";
import SubscriberTrend from "./SubscriberTrend";

export default function Performance() {
  return (
    <div className="flex-1 flex flex-col w-full max-w-full space-y-4 sm:space-y-6 min-h-0">
      <div className="flex flex-col gap-6 min-h-0">
        <Card size="lg" className="w-full">
          <CardContent className="p-4">
            <SubscribersSection />
          </CardContent>
        </Card>

        <Card size="lg" className="min-h-0 overflow-hidden w-full">
          <CardContent className="p-4">
            <LastCampaignSection />
          </CardContent>
        </Card>

        <Card size="lg" className="min-h-0 overflow-hidden w-full">
          <CardContent className="p-4">
            <UpcomingSection />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SubscribersSection() {
  const [series, setSeries] = useState<any[] | null>(null);
  const [overview, setOverview] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/subscribers?days=7")
      .then((r) => r.json())
      .then((json) => setSeries(json.series || []))
      .catch(() => setSeries([]));

    fetch("/api/dashboard/overview")
      .then((r) => r.json())
      .then((json) => setOverview(json))
      .catch(() => setOverview(null));
  }, []);

  const new7d = series ? String(series.reduce((s, r) => s + (r.subscribers || 0), 0)) : "—";

  return (
    <section className="space-y-2 sm:space-y-3">
      <h3 className="text-sm sm:text-base font-medium">Subscribers</h3>

      <div className="w-full">
        {/* inline bare SubscriberTrend chart */}
        <div className="w-full">
          <SubscriberTrend days={7} bare />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-2">
        <Metric variant="lg" label="Total" value={overview ? String(overview.totalSubscribers) : "—"} />
        <Metric variant="lg" label="New (7d)" value={new7d} />
        <Metric variant="lg" label="Pending" value={overview ? String(overview.pendingSends) : "—"} />
      </div>
    </section>
  );
}

function LastCampaignSection() {
  const [overview, setOverview] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/overview")
      .then((r) => r.json())
      .then((json) => setOverview(json))
      .catch(() => setOverview(null));
  }, []);

  const last = overview?.lastCampaign;

  return (
    <section className="space-y-2 sm:space-y-3">
      <h3 className="text-sm sm:text-base font-medium">Last Campaign</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
        <Metric variant="lg" label="Sent" value={last ? String(last.sent) : "—"} />
        <Metric variant="lg" label="Opened" value={last ? String(last.opened) : "—"} />
        <Metric variant="lg" label="Clicked" value={"—"} />
        <Metric variant="lg" label="Open %" value={overview ? `${overview.lastCampaignOpenRate}%` : "—"} />
      </div>
    </section>
  );
}

function UpcomingSection() {
  const [campaigns, setCampaigns] = useState<any[] | null>(null);

  useEffect(() => {
    fetch('/api/campaigns')
      .then(r => r.json())
      .then(json => setCampaigns(json.campaigns || []))
      .catch(() => setCampaigns([]));
  }, []);

  if (!campaigns) return <div className="p-2">Loading upcoming...</div>;

  return (
    <section className="space-y-2 sm:space-y-3">
      <h3 className="text-sm sm:text-base font-medium">Upcoming</h3>
      <div className="space-y-1 sm:space-y-2 p-2 sm:p-3 bg-[var(--card)] rounded-lg">
        {campaigns.filter((c: any) => c.status === 'scheduled').slice(0,4).map((c: any) => (
          <div key={c.id} className="flex justify-between text-sm sm:text-md text-[var(--foreground)]">
            <h4 className="font-bold truncate pr-2">{c.title || c.name || `#${c.id}`}</h4>
            <p className="whitespace-nowrap">{c.date || c.scheduled_at || 'No date'}</p>
          </div>
        ))}
      </div>
      <Link href="/campaigns/builder"><Button className="w-full mt-2">Create New Email Campaign</Button></Link>
    </section>
  );
}

function ResponsiveBarChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data}>
        <Bar dataKey="subscribers" fill="var(--chart-2)" radius={4} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function Metric({ label, value, variant = "default" }: { label: string; value: string; variant?: "default" | "lg" }) {
  const labelClass = variant === "lg" ? "text-xs font-medium text-muted-foreground" : "text-xs font-medium text-muted-foreground";
  const valueClass = variant === "lg" ? "text-xl font-semibold mt-1" : "text-base font-medium mt-1";
  return (
    <div className="rounded-lg bg-[var(--card)] p-3 shadow-sm border">
      <h4 className={labelClass}>{label}</h4>
      <p className={valueClass}>{value}</p>
    </div>
  );
}
