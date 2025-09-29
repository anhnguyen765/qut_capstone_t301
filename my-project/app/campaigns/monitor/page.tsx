"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Progress } from "@/app/components/ui/progress";

interface QueueStats {
  pending: number;
  sending: number;
  sent: number;
  failed: number;
  retry: number;
}

interface CampaignLog {
  id: number;
  campaign_id: number;
  contact_name: string;
  contact_email: string;
  action: string;
  smtp_response: string;
  error_message: string;
  created_at: string;
}

export default function CampaignMonitor() {
  const [queueStats, setQueueStats] = useState<QueueStats>({
    pending: 0,
    sending: 0,
    sent: 0,
    failed: 0,
    retry: 0
  });
  const [recentLogs, setRecentLogs] = useState<CampaignLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchQueueStats();
    fetchRecentLogs();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchQueueStats();
      fetchRecentLogs();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchQueueStats = async () => {
    try {
      const response = await fetch("/api/email-queue");
      const data = await response.json();
      setQueueStats(data.stats);
    } catch (error) {
      console.error("Error fetching queue stats:", error);
    }
  };

  const fetchRecentLogs = async () => {
    try {
      const response = await fetch("/api/campaign-logs?limit=20");
      const data = await response.json();
      setRecentLogs(data.logs);
    } catch (error) {
      console.error("Error fetching recent logs:", error);
    }
  };

  const triggerProcessing = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/email-queue", { method: "POST" });
      fetchQueueStats();
    } catch (error) {
      console.error("Error triggering queue processing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalEmails = queueStats.pending + queueStats.sending + queueStats.sent + queueStats.failed + queueStats.retry;
  const successRate = totalEmails > 0 ? (queueStats.sent / totalEmails) * 100 : 0;

  return (
    <div className="py-8 px-[10%]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          Campaign Monitor
        </h1>
        <p className="text-gray-600">Monitor email campaign sending status and queue</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Queue Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              Email Queue Status
              <Button 
                onClick={triggerProcessing} 
                disabled={isLoading}
                size="sm"
              >
                {isLoading ? "Processing..." : "Process Queue"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{queueStats.pending}</div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{queueStats.sending}</div>
                  <div className="text-sm text-gray-600">Sending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{queueStats.sent}</div>
                  <div className="text-sm text-gray-600">Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{queueStats.failed}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
              </div>
              
              {totalEmails > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Success Rate</span>
                    <span>{successRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={successRate} className="h-2" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                onClick={() => window.location.href = '/campaigns/email-builder'}
                className="w-full"
              >
                Create New Email Campaign
              </Button>
              <Button 
                onClick={() => window.location.href = '/campaigns/send'}
                variant="outline"
                className="w-full"
              >
                Send Campaign
              </Button>
              <Button 
                onClick={() => window.location.href = '/campaigns'}
                variant="outline"
                className="w-full"
              >
                View All Campaigns
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Email Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{log.contact_name}</span>
                    <span className="text-gray-500">({log.contact_email})</span>
                    <Badge 
                      variant={
                        log.action === 'sent' ? 'default' : 
                        log.action === 'failed' ? 'destructive' : 
                        'secondary'
                      }
                    >
                      {log.action}
                    </Badge>
                  </div>
                  {log.error_message && (
                    <div className="text-sm text-red-600 mt-1">
                      Error: {log.error_message}
                    </div>
                  )}
                  {log.smtp_response && (
                    <div className="text-sm text-green-600 mt-1">
                      Response: {log.smtp_response}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
            ))}
            
            {recentLogs.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No recent email activity
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}