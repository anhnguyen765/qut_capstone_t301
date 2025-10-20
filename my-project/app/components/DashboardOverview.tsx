"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Badge } from "@/app/components/ui/badge";
import { 
  Users, 
  UserCheck, 
  Clock, 
  TrendingUp,
  Mail,
  MailOpen,
  MousePointer,
  Activity
} from "lucide-react";

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-6 w-6 bg-muted/20 rounded-lg" />
              <div className="h-4 w-12 bg-muted/20 rounded" />
            </div>
            <div className="h-6 bg-muted/20 rounded w-1/2 mb-1" />
            <div className="h-3 bg-muted/20 rounded w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (error) return (
    <Card className="border border-destructive/20 p-6 bg-gradient-to-br from-destructive/5 to-destructive/10">
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-destructive font-medium">Failed to load dashboard overview</div>
          <button onClick={load} className="text-sm underline hover:text-destructive/80">Retry</button>
        </div>
      </CardContent>
    </Card>
  );

  const overview = data!;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard 
        label="Total Subscribers" 
        value={String(overview.totalSubscribers)} 
        icon={Users}
        color="text-blue-600"
        bgColor="bg-blue-50 dark:bg-blue-950"
        subtitle="All contacts"
        trend="+12%"
      />
      <StatCard 
        label="Active Subscribers" 
        value={String(overview.activeSubscribers)} 
        icon={UserCheck}
        color="text-green-600"
        bgColor="bg-green-50 dark:bg-green-950"
        subtitle="Engaged recently"
        trend="+8%"
      />
      <StatCard 
        label="Pending Sends" 
        value={String(overview.pendingSends)} 
        icon={Clock}
        color="text-orange-600"
        bgColor="bg-orange-50 dark:bg-orange-950"
        subtitle="Scheduled emails"
        trend="—"
      />
      <StatCard 
        label="Open Rate" 
        value={`${overview.lastCampaignOpenRate}%`} 
        icon={MailOpen}
        color="text-purple-600"
        bgColor="bg-purple-50 dark:bg-purple-950"
        subtitle={overview.lastCampaign ? overview.lastCampaign.title ?? 'Last campaign' : 'No campaigns'}
        trend="+3%"
      />
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color, 
  bgColor, 
  subtitle, 
  trend 
}: { 
  label: string; 
  value: string; 
  icon: any; 
  color: string; 
  bgColor: string; 
  subtitle?: string; 
  trend?: string; 
}) {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 hover:shadow-xl transition-all duration-300 group">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg ${bgColor} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          {trend && trend !== "—" && (
            <Badge variant="secondary" className="text-xs font-medium">
              {trend}
            </Badge>
          )}
        </div>
        
        <div className="space-y-1">
          <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors duration-300">
            {value}
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            {label}
          </div>
          {subtitle && (
            <div className="text-xs text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
