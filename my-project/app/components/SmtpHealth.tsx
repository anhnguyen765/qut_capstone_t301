"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Badge } from "@/app/components/ui/badge";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Server, 
  Mail,
  Activity,
  Clock
} from "lucide-react";

export default function SmtpHealth() {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setError(null);
    setData(null);
    setLoading(true);
    fetch('/api/dashboard/smtp')
      .then(r => r.json())
      .then(json => { 
        if (json.error) setError(json.error); 
        else setData(json); 
      })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-muted-foreground py-4">
        <XCircle className="w-8 h-8 mx-auto mb-2 text-destructive opacity-50" />
        <p className="text-sm text-destructive">Unable to check system health</p>
        <p className="text-xs">Please try again later</p>
        <button onClick={load} className="text-xs underline mt-2 hover:text-destructive/80">
          Retry
        </button>
      </div>
    );
  }

  const { lastError, bounceRate, status, lastCheck } = data || {};

  const getHealthStatus = () => {
    if (bounceRate > 10) return { status: 'critical', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950', icon: XCircle };
    if (bounceRate > 5) return { status: 'warning', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950', icon: AlertTriangle };
    if (lastError) return { status: 'warning', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950', icon: AlertTriangle };
    return { status: 'healthy', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-950', icon: CheckCircle };
  };

  const healthStatus = getHealthStatus();
  const StatusIcon = healthStatus.icon;

  const getStatusMessage = () => {
    if (bounceRate > 10) return "High bounce rate detected. Check your email list quality.";
    if (bounceRate > 5) return "Elevated bounce rate. Monitor your email delivery.";
    if (lastError) return "Recent delivery issues detected. Check SMTP configuration.";
    return "All systems operating normally. Email delivery is healthy.";
  };

  const getBounceRateMessage = () => {
    if (bounceRate > 10) return "Critical";
    if (bounceRate > 5) return "Elevated";
    if (bounceRate > 2) return "Normal";
    return "Excellent";
  };

  return (
    <div className="space-y-3">
      {/* Health Status */}
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${healthStatus.bg}`}>
          <StatusIcon className={`w-5 h-5 ${healthStatus.color}`} />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium">Email Delivery</div>
          <div className="text-xs text-muted-foreground">
            {getStatusMessage()}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Bounce Rate</span>
          </div>
          <Badge 
            variant={bounceRate > 5 ? "destructive" : bounceRate > 2 ? "secondary" : "default"}
            className="text-xs"
          >
            {bounceRate?.toFixed(1) || 0}%
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Status</span>
          </div>
          <span className="text-xs font-medium capitalize">
            {getBounceRateMessage()}
          </span>
        </div>

        {lastCheck && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Last checked: {new Date(lastCheck).toLocaleTimeString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
