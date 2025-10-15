"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";

type Campaign = { id: number; title?: string | null; sent_at?: string | null };

export default function RecentCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    setCampaigns(null);
    fetch('/api/campaigns')
      .then((res) => res.json())
      .then((json) => {
        if (!json) return setCampaigns([]);
        if (Array.isArray(json)) return setCampaigns(json);
        if (json.error) return setError(json.error);
        if (Array.isArray((json as any).campaigns)) return setCampaigns((json as any).campaigns);
        // Fallback: sometimes API may return an object wrapper; try to coerce
        if (typeof json === 'object') {
          const maybeArray = Object.values(json).find((v) => Array.isArray(v));
          if (Array.isArray(maybeArray)) return setCampaigns(maybeArray as any);
        }
        return setCampaigns([]);
      })
      .catch((err) => setError(String(err)));
  };

  useEffect(() => { load(); }, []);

  if (campaigns === null) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-3"><Skeleton className="h-12 w-full" /></Card>
        ))}
      </div>
    );
  }

  if (error) return (
    <Card className="border border-destructive/20 p-3">
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-destructive">Failed to load campaigns</div>
          <button onClick={load} className="text-sm underline">Retry</button>
        </div>
      </CardContent>
    </Card>
  );

  if (campaigns.length === 0) return (
    <Card className="p-3">
      <CardContent>
        <div className="text-sm">No campaigns yet</div>
        <div className="text-xs text-muted-foreground">Create a campaign to see it here</div>
      </CardContent>
    </Card>
  );

  const safeCampaigns: Campaign[] = Array.isArray(campaigns)
    ? campaigns
    : Array.isArray((campaigns as any)?.campaigns)
      ? (campaigns as any).campaigns
      : [];

  return (
    <div className="space-y-2">
      {safeCampaigns.slice(0, 6).map((c) => (
        <Card key={c.id} className="p-3 min-h-0 overflow-hidden">
          <CardContent>
            <div className="font-medium truncate max-w-full">{c.title || `#${c.id}`}</div>
            <div className="text-xs text-muted-foreground">{c.sent_at ? new Date(c.sent_at).toLocaleDateString() : 'Draft'}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
