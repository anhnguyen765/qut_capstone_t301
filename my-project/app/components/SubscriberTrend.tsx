"use client";

import React, { useEffect, useState } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, Tooltip } from "recharts";
import { Card, CardContent } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";

export default function SubscriberTrend({ days = 30, bare = false }: { days?: number; bare?: boolean }) {
  const [series, setSeries] = useState<{ date: string; subscribers: number }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    setSeries(null);
    fetch(`/api/dashboard/subscribers?days=${days}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setSeries(json.series || []);
      })
      .catch((e) => setError(String(e)));
  };

  useEffect(() => { load(); }, [days]);

  if (error) {
    const node = (
      <div className="border border-destructive/20 rounded-md p-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-destructive">Failed to load trend</div>
          <button onClick={load} className="text-sm underline">Retry</button>
        </div>
      </div>
    );
    return bare ? node : <Card className="border border-destructive/20"><CardContent>{node}</CardContent></Card>;
  }

  if (!series) {
    const node = <div className="p-3"><Skeleton className="h-20" /></div>;
    return bare ? node : <Card className="p-3">{node}</Card>;
  }

  if (series.length === 0) {
    const node = <div className="p-3"><CardContent>No subscribers yet</CardContent></div>;
    return bare ? node : <Card className="p-3">{node}</Card>;
  }

  const content = (
    <div>
      <div className="text-sm font-medium mb-2">Subscribers (last {days} days)</div>
      <div style={{ width: '100%', height: 120 }}>
        <ResponsiveContainer>
          <LineChart data={series}>
            <XAxis dataKey="date" hide />
            <Tooltip />
            <Line type="monotone" dataKey="subscribers" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return bare ? content : (<Card><CardContent>{content}</CardContent></Card>);
}
