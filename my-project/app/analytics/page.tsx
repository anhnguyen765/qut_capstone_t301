"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { ChartContainer } from "@/app/components/ui/chart"
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts"

type SeriesPoint = { date: string; subscribers: number }

export default function Analytics() {
  const [overview, setOverview] = useState<any | null>(null)
  const [series, setSeries] = useState<SeriesPoint[] | null>(null)
  const [campaigns, setCampaigns] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)

    const pOverview = fetch('/api/dashboard/overview').then(r => r.json())
    const pSeries = fetch('/api/dashboard/subscribers?days=90').then(r => r.json())
    const pCampaigns = fetch('/api/campaigns').then(r => r.json())

    Promise.all([pOverview, pSeries, pCampaigns])
      .then(([ov, sv, cp]) => {
        if (!mounted) return
        setOverview(ov.error ? null : ov)
        setSeries(sv?.series || [])
        setCampaigns(cp?.campaigns || [])
      })
      .catch((e) => {
        console.error('Analytics load error', e)
        if (mounted) setError(String(e))
      })
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [])

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">Gain insights into your business performance with detailed analytics and reports.</p>
        </header>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        {/* KPI cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card size="lg"><CardContent>
            <div className="text-xs text-muted-foreground">Total Subscribers</div>
            <div className="text-2xl font-extrabold">{overview ? overview.totalSubscribers : '—'}</div>
          </CardContent></Card>

          <Card size="lg"><CardContent>
            <div className="text-xs text-muted-foreground">Active Subscribers</div>
            <div className="text-2xl font-extrabold">{overview ? overview.activeSubscribers : '—'}</div>
          </CardContent></Card>

          <Card size="lg"><CardContent>
            <div className="text-xs text-muted-foreground">Pending Sends</div>
            <div className="text-2xl font-extrabold">{overview ? overview.pendingSends : '—'}</div>
          </CardContent></Card>

          <Card size="lg"><CardContent>
            <div className="text-xs text-muted-foreground">Last Open %</div>
            <div className="text-2xl font-extrabold">{overview ? `${overview.lastCampaignOpenRate}%` : '—'}</div>
          </CardContent></Card>
        </section>

        {/* Subscriber trend chart */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card className="min-h-0">
              <CardHeader>
                <CardTitle>Subscriber trend (90 days)</CardTitle>
              </CardHeader>
              <CardContent>
                {series ? (
                  <ChartContainer id="subscribers" config={{ subscribers: { label: 'New subscribers', color: '#06b6d4' } }}>
                    <ResponsiveContainer>
                      <LineChart data={series}>
                        <XAxis dataKey="date" hide />
                        <Tooltip />
                        <Line dataKey="subscribers" stroke="var(--color-subscribers, #06b6d4)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="text-sm text-muted-foreground">Loading chart...</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Campaign performance */}
          <div>
            <Card className="min-h-0">
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns && campaigns.length > 0 ? (
                  <ul className="space-y-3">
                    {campaigns.slice(0, 6).map((c: any) => (
                      <li key={c.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium truncate max-w-xs">{c.title || c.name || `#${c.id}`}</div>
                          <div className="text-xs text-muted-foreground">{c.date}</div>
                        </div>
                        <div className="text-sm">{c.status}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground">No campaigns found</div>
                )}
                <div className="mt-4">
                  <Button variant="outline">View all campaigns</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Mid-row: audience breakdown and quick actions */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Audience Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Geography, device types and engagement (placeholder)</p>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button variant="ghost">Export CSV</Button>
                  <Button variant="ghost">Schedule report</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}