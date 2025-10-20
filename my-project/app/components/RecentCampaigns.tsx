"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { 
  Mail, 
  Calendar, 
  Users, 
  Eye, 
  MousePointer,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import Link from "next/link";

type Campaign = { 
  id: number; 
  title?: string | null; 
  sent_at?: string | null;
  status?: string;
  open_rate?: number;
  click_rate?: number;
  recipients?: number;
};

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
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 border-0 bg-gradient-to-r from-card to-card/50">
            <CardContent className="p-0">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) return (
    <Card className="border border-destructive/20 p-4 bg-gradient-to-r from-destructive/5 to-destructive/10">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div className="text-sm text-destructive font-medium">Failed to load campaigns</div>
          <Button onClick={load} variant="ghost" size="sm" className="text-sm">Retry</Button>
        </div>
      </CardContent>
    </Card>
  );

  if (campaigns.length === 0) return (
    <Card className="p-6 border-0 bg-gradient-to-r from-card to-card/50">
      <CardContent className="p-0 text-center">
        <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <div className="text-sm font-medium text-muted-foreground mb-2">No campaigns yet</div>
        <div className="text-xs text-muted-foreground mb-4">Create a campaign to see it here</div>
        <Button asChild size="sm">
          <Link href="/campaigns/builder">
            Create Campaign
          </Link>
        </Button>
      </CardContent>
    </Card>
  );

  const safeCampaigns: Campaign[] = Array.isArray(campaigns)
    ? campaigns
    : Array.isArray((campaigns as any)?.campaigns)
      ? (campaigns as any).campaigns
      : [];

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "sent": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "scheduled": return <Clock className="w-4 h-4 text-blue-500" />;
      case "draft": return <Mail className="w-4 h-4 text-gray-500" />;
      case "failed": return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "sent": return "bg-green-500 text-white";
      case "scheduled": return "bg-blue-500 text-white";
      case "draft": return "bg-gray-500 text-white";
      case "failed": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="space-y-3">
      {safeCampaigns.slice(0, 6).map((c) => (
        <Card key={c.id} className="p-4 min-h-0 overflow-hidden border-0 bg-gradient-to-r from-card to-card/50 hover:shadow-md transition-all duration-300 group">
          <CardContent className="p-0">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 p-2 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors">
                {getStatusIcon(c.status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                  {c.title || `Campaign #${c.id}`}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {c.sent_at ? new Date(c.sent_at).toLocaleDateString() : 'Draft'}
                </div>
                
                {/* Performance metrics */}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {c.recipients && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{c.recipients}</span>
                    </div>
                  )}
                  {c.open_rate && (
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>{c.open_rate}%</span>
                    </div>
                  )}
                  {c.click_rate && (
                    <div className="flex items-center gap-1">
                      <MousePointer className="w-3 h-3" />
                      <span>{c.click_rate}%</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-shrink-0">
                {c.status && (
                  <Badge className={`text-xs ${getStatusColor(c.status)}`}>
                    {c.status}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* View All Button */}
      <div className="pt-2">
        <Button asChild variant="outline" className="w-full">
          <Link href="/campaigns">
            View All Campaigns
          </Link>
        </Button>
      </div>
    </div>
  );
}
