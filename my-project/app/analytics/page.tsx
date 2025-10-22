"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { ChartContainer } from "@/app/components/ui/chart"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  Area,
  AreaChart
} from "recharts"
import { 
  Users, 
  Mail, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  UserX, 
  Download,
  Calendar,
  MailOpen,
  Target,
  Clock
} from "lucide-react"

type SeriesPoint = { date: string; subscribers: number }
type CampaignStat = {
  id: number;
  title: string;
  date: string;
  type: string;
  status: string;
  sentCount?: number;
  openRate?: number;
}

export default function Analytics() {
  const [overview, setOverview] = useState<any | null>(null)
  const [series, setSeries] = useState<SeriesPoint[] | null>(null)
  const [campaigns, setCampaigns] = useState<CampaignStat[] | null>(null)
  const [campaignStats, setCampaignStats] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("30")

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    let mounted = true
    setLoading(true)
    setError(null)

    try {
      const [overviewRes, seriesRes, campaignsRes] = await Promise.all([
        fetch('/api/dashboard/overview'),
        fetch(`/api/dashboard/subscribers?days=${timeRange}`),
        fetch('/api/campaigns')
      ])

      const [ov, sv, cp] = await Promise.all([
        overviewRes.json(),
        seriesRes.json(),
        campaignsRes.json()
      ])

      if (!mounted) return

      setOverview(ov.error ? null : ov)
      setSeries(sv?.series || [])
      
      // Process campaigns data to get real stats
      const campaignData = cp?.campaigns || []
      setCampaigns(campaignData)
      
      // Get campaign statistics from real data
      if (campaignData.length > 0) {
        await loadCampaignStats(campaignData.slice(0, 10)) // Get stats for last 10 campaigns
      }

    } catch (e) {
      console.error('Analytics load error', e)
      if (mounted) {
        setError('Failed to load analytics data')
      }
    } finally {
      if (mounted) setLoading(false)
    }
  }

  const loadCampaignStats = async (campaigns: any[]) => {
    try {
      const stats = await Promise.all(
        campaigns.map(async (campaign) => {
          try {
            // Get send count
            const sendRes = await fetch(`/api/campaigns/${campaign.id}/stats`)
            const sendData = sendRes.ok ? await sendRes.json() : null
            
            return {
              id: campaign.id,
              title: campaign.title || `Campaign #${campaign.id}`,
              date: campaign.date,
              type: campaign.type,
              status: campaign.status,
              sentCount: sendData?.sentCount || 0,
              openRate: sendData?.openRate || 0
            }
          } catch {
            return {
              id: campaign.id,
              title: campaign.title || `Campaign #${campaign.id}`,
              date: campaign.date,
              type: campaign.type,
              status: campaign.status,
              sentCount: 0,
              openRate: 0
            }
          }
        })
      )
      setCampaignStats(stats)
    } catch (error) {
      console.error('Failed to load campaign stats:', error)
    }
  }

  const exportCSV = () => {
    if (!series) return
    
    const headers = ['Date', 'New Subscribers']
    const csvData = [
      headers.join(','),
      ...series.map(row => [row.date, row.subscribers].join(','))
    ].join('\n')
    
    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subscriber-analytics-${timeRange}days.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const calculateGrowthRate = () => {
    if (!series || series.length < 2) return 0
    const recent = series.slice(-7).reduce((sum, day) => sum + day.subscribers, 0)
    const previous = series.slice(-14, -7).reduce((sum, day) => sum + day.subscribers, 0)
    if (previous === 0) return recent > 0 ? 100 : 0
    return ((recent - previous) / previous * 100)
  }

  const totalNewSubscribers = series?.reduce((sum, day) => sum + day.subscribers, 0) || 0
  const growthRate = calculateGrowthRate()

  if (loading) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground">Real-time insights from your email marketing campaigns and subscriber data.</p>
          </div>
          <div className="flex gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportCSV} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </header>

        {error && <div className="text-destructive mb-4 p-4 bg-destructive/10 rounded-lg">{error}</div>}

        {/* Real KPI cards from database */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Total Contacts</div>
                  <div className="text-2xl font-bold">{overview?.totalSubscribers?.toLocaleString() || '0'}</div>
                  <div className={`text-xs flex items-center mt-1 ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {growthRate >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {Math.abs(growthRate).toFixed(1)}% this period
                  </div>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Last Campaign Open Rate</div>
                  <div className="text-2xl font-bold">{overview?.lastCampaignOpenRate || 0}%</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {overview?.lastCampaign ? `Campaign: ${overview.lastCampaign.title || `#${overview.lastCampaign.id}`}` : 'No campaigns yet'}
                  </div>
                </div>
                <MailOpen className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Pending Sends</div>
                  <div className="text-2xl font-bold">{overview?.pendingSends?.toLocaleString() || '0'}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Scheduled emails waiting
                  </div>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">New Subscribers</div>
                  <div className="text-2xl font-bold">{totalNewSubscribers.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    In last {timeRange} days
                  </div>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Real subscriber growth chart */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Subscriber Growth ({timeRange} days)</CardTitle>
              </CardHeader>
              <CardContent>
                {series && series.length > 0 ? (
                  <ChartContainer id="subscribers" config={{ 
                    subscribers: { label: 'New subscribers', color: '#06b6d4' }
                  }}>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={series}>
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString()}
                          fontSize={12}
                        />
                        <YAxis fontSize={12} />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                          formatter={(value) => [value, 'New Subscribers']}
                        />
                        <Area dataKey="subscribers" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    No subscriber data available for this period
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Real campaign performance */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns && campaigns.length > 0 ? (
                  <ul className="space-y-3">
                    {campaigns.slice(0, 6).map((campaign) => (
                      <li key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{campaign.title || `Campaign #${campaign.id}`}</div>
                          <div className="text-xs text-muted-foreground">{new Date(campaign.date).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground">
                            Type: {campaign.type}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={campaign.status === 'sent' ? 'default' : campaign.status === 'scheduled' ? 'secondary' : 'outline'}>
                            {campaign.status}
                          </Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    No campaigns found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Campaign performance summary */}
        {campaigns && campaigns.length > 0 && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Status Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['draft', 'scheduled', 'sent', 'archived'].map(status => {
                    const count = campaigns.filter(c => c.status === status).length
                    const percentage = campaigns.length > 0 ? ((count / campaigns.length) * 100).toFixed(1) : '0'
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            status === 'sent' ? 'bg-green-500' : 
                            status === 'scheduled' ? 'bg-blue-500' : 
                            status === 'draft' ? 'bg-yellow-500' : 'bg-gray-500'
                          }`} />
                          <span className="font-medium capitalize">{status}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{count}</div>
                          <div className="text-sm text-muted-foreground">{percentage}%</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Campaign Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from(new Set(campaigns.map(c => c.type))).map(type => {
                    const count = campaigns.filter(c => c.type === type).length
                    const percentage = ((count / campaigns.length) * 100).toFixed(1)
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
                        <div className="text-right">
                          <div className="font-semibold">{count}</div>
                          <div className="text-sm text-muted-foreground">{percentage}%</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Summary insights */}
        <section className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">Total Contacts</span>
                  </div>
                  <p className="text-sm">{overview?.totalSubscribers || 0} contacts in your database</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="font-semibold">Growth Rate</span>
                  </div>
                  <p className="text-sm">{Math.abs(growthRate).toFixed(1)}% {growthRate >= 0 ? 'increase' : 'decrease'} in new subscribers</p>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-5 w-5 text-orange-600" />
                    <span className="font-semibold">Campaigns</span>
                  </div>
                  <p className="text-sm">{campaigns?.length || 0} total campaigns created</p>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold">Scheduled</span>
                  </div>
                  <p className="text-sm">{overview?.pendingSends || 0} emails scheduled to send</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}