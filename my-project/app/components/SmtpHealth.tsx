"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";

export default function SmtpHealth() {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    setData(null);
    fetch('/api/dashboard/smtp')
      .then(r => r.json())
      .then(json => { if (json.error) setError(json.error); else setData(json); })
      .catch(e => setError(String(e)));
  };

  useEffect(() => { load(); }, []);

  if (error) return (
    <Card className="border border-destructive/20">
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-destructive">Failed to load SMTP health</div>
          <button onClick={load} className="text-sm underline">Retry</button>
        </div>
      </CardContent>
    </Card>
  );

  if (!data) return <Card className="p-3"><Skeleton className="h-12" /></Card>;

  const { lastError, bounceRate } = data;

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">SMTP Health</div>
          <div className="text-xs text-muted-foreground">Bounce: {bounceRate}%</div>
        </div>
        {lastError ? (
          <div className="text-xs text-destructive mt-2">Last error: {String(lastError.message)}</div>
        ) : (
          <div className="text-xs text-muted-foreground mt-2">No recent SMTP errors</div>
        )}
      </CardContent>
    </Card>
  );
}
