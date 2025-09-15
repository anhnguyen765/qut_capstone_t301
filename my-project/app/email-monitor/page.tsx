"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";
import { Separator } from "@/app/components/ui/separator";

interface QueueStats {
  pending: number;
  sending: number;
  sent: number;
  failed: number;
  retry: number;
}

interface Campaign {
  id: number;
  title: string;
  subject_line: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  scheduled_at?: string;
  sent_at?: string;
}

interface EmailLog {
  id: number;
  campaign_id: number;
  email: string;
  action: string;
  smtp_response?: string;
  error_message?: string;
  created_at: string;
}

export default function EmailMonitor() {
  const [queueStats, setQueueStats] = useState<QueueStats | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [recentLogs, setRecentLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch queue statistics
      const queueResponse = await fetch("/api/email-queue");
      const queueData = await queueResponse.json();
      setQueueStats(queueData.stats);

      // Fetch campaigns with stats
      const campaignsResponse = await fetch("/api/campaigns");
      const campaignsData = await campaignsResponse.json();
      setCampaigns(campaignsData.campaigns || []);

      // Fetch recent email logs
      const logsResponse = await fetch("/api/campaign-logs?limit=10");
      const logsData = await logsResponse.json();
      setRecentLogs(logsData.logs || []);

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerQueueProcessing = async () => {
    try {
      const response = await fetch("/api/email-queue", {
        method: "POST"
      });
      
      if (response.ok) {
        // Refresh data after triggering
        setTimeout(fetchData, 1000);
      }
    } catch (error) {
      console.error("Error triggering queue processing:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sending':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'sent':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'queued':
        return 'text-blue-600';
      case 'retry':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getSuccessRate = (campaign: Campaign) => {
    if (campaign.total_recipients === 0) return 0;
    return Math.round((campaign.sent_count / campaign.total_recipients) * 100);
  };

  const totalEmails = queueStats ? 
    queueStats.pending + queueStats.sending + queueStats.sent + queueStats.failed + queueStats.retry : 0;

  const successRate = queueStats && totalEmails > 0 ? 
    Math.round((queueStats.sent / totalEmails) * 100) : 0;

  return (
    <div className="py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Email Monitor</h1>
            <p className="text-gray-600">Monitor email queue status and campaign performance</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchData} disabled={isLoading} variant="outline">
              {isLoading ? "Refreshing..." : "Refresh"}
            </Button>
            <Button onClick={triggerQueueProcessing} disabled={isLoading}>
              Process Queue
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </div>

      {/* Queue Statistics */}
      {queueStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{queueStats.pending}</p>
                </div>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                  Pending
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sending</p>
                  <p className="text-2xl font-bold text-blue-600">{queueStats.sending}</p>
                </div>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  Sending
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sent</p>
                  <p className="text-2xl font-bold text-green-600">{queueStats.sent}</p>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  Sent
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{queueStats.failed}</p>
                </div>
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  Failed
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Retry</p>
                  <p className="text-2xl font-bold text-orange-600">{queueStats.retry}</p>
                </div>
                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                  Retry
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overall Success Rate */}
      {queueStats && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Overall Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Success Rate</span>
                  <span>{successRate}%</span>
                </div>
                <Progress value={successRate} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Emails:</span>
                  <span className="ml-2 font-medium">{totalEmails}</span>
                </div>
                <div>
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="ml-2 font-medium">{successRate}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaigns.slice(0, 5).map(campaign => (
                <div key={campaign.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{campaign.title}</h3>
                      <p className="text-sm text-gray-600">{campaign.subject_line}</p>
                    </div>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Recipients: {campaign.total_recipients}</span>
                      <span>Sent: {campaign.sent_count}</span>
                      <span className="text-red-600">Failed: {campaign.failed_count}</span>
                    </div>
                    
                    {campaign.total_recipients > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Success Rate</span>
                          <span>{getSuccessRate(campaign)}%</span>
                        </div>
                        <Progress value={getSuccessRate(campaign)} className="h-1" />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    Created: {new Date(campaign.created_at).toLocaleDateString()}
                    {campaign.scheduled_at && (
                      <span> • Scheduled: {new Date(campaign.scheduled_at).toLocaleString()}</span>
                    )}
                    {campaign.sent_at && (
                      <span> • Sent: {new Date(campaign.sent_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentLogs.map(log => (
                <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    log.action === 'sent' ? 'bg-green-500' :
                    log.action === 'failed' ? 'bg-red-500' :
                    log.action === 'queued' ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                        {log.action.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate">
                      {log.email}
                    </p>
                    
                    {log.smtp_response && (
                      <p className="text-xs text-gray-500 truncate">
                        Response: {log.smtp_response}
                      </p>
                    )}
                    
                    {log.error_message && (
                      <p className="text-xs text-red-500 truncate">
                        Error: {log.error_message}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {recentLogs.length === 0 && (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
