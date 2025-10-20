"use client";

import DashboardCalendar from "./components/DashboardCalendar";
import DashboardOverview from "./components/DashboardOverview";
import SmtpHealth from "./components/SmtpHealth";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { useState, useEffect } from "react";
import { 
  Mail, 
  Calendar, 
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-card/20" aria-labelledby="dashboard-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 id="dashboard-heading" className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent dark:from-primary dark:to-secondary mb-2">
                Welcome to Your Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage your email campaigns, track performance, and engage with your audience
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                <Link href="/send-email">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-background/80 hover:bg-background border-border dark:bg-card/50 dark:hover:bg-card dark:border-border">
                <Link href="/campaigns/builder">
                  <Plus className="w-4 h-4 mr-2" />
                  New Campaign
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="mb-6">
          <DashboardOverview />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
          {/* Left Column - Email Schedule */}
          <div className="xl:col-span-2">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-4 h-4 text-primary" />
                  Email Schedule & Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DashboardCalendar height={400} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar Content */}
          <div className="xl:col-span-1 space-y-4">
            {/* Upcoming Emails */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-4 h-4 text-primary" />
                  Upcoming Emails
                </CardTitle>
              </CardHeader>
              <CardContent>
                <UpcomingEmails />
              </CardContent>
            </Card>

            {/* Recent Email Activity */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="w-4 h-4 text-primary" />
                  Recent Email Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecentEmailActivity />
              </CardContent>
            </Card>

            {/* SMTP Health */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SmtpHealth />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

// Recent Email Activity Component
function RecentEmailActivity() {
  const [recentEmails, setRecentEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/schedule")
      .then((res) => res.json())
      .then((data) => {
        if (data.schedules) {
          const now = new Date();
          const recent = data.schedules
            .filter((s: any) => new Date(s.scheduled_at) <= now)
            .sort((a: any, b: any) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
            .slice(0, 3);
          setRecentEmails(recent);
        }
      })
      .catch(() => setRecentEmails([]))
      .finally(() => setLoading(false));
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent": return <CheckCircle className="w-3 h-3 text-green-500" />;
      case "scheduled": return <Clock className="w-3 h-3 text-blue-500" />;
      case "pending": return <Clock className="w-3 h-3 text-amber-500" />;
      case "failed": return <AlertCircle className="w-3 h-3 text-red-500" />;
      default: return <AlertCircle className="w-3 h-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "bg-green-500 text-white";
      case "scheduled": return "bg-blue-500 text-white";
      case "pending": return "bg-amber-500 text-white";
      case "failed": return "bg-red-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 p-2 border rounded animate-pulse">
            <div className="h-3 w-3 bg-muted/20 rounded" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-muted/20 rounded w-3/4" />
              <div className="h-2 bg-muted/20 rounded w-1/2" />
            </div>
            <div className="h-4 w-12 bg-muted/20 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (recentEmails.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No recent email activity</p>
        <p className="text-xs">Send emails to see activity here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {recentEmails.map((email) => (
        <div key={email.id} className="flex items-center gap-2 p-2 border rounded hover:bg-muted/50 transition-colors">
          <div className="flex-shrink-0">
            {getStatusIcon(email.status)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-xs truncate">{email.campaign_title}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(email.scheduled_at).toLocaleDateString()}
            </div>
          </div>
          <Badge className={`text-xs ${getStatusColor(email.status)}`}>
            {email.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}

// Upcoming Emails Component
function UpcomingEmails() {
  const [upcomingEmails, setUpcomingEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/schedule")
      .then((res) => res.json())
      .then((data) => {
        if (data.schedules) {
          const now = new Date();
          const upcoming = data.schedules
            .filter((s: any) => new Date(s.scheduled_at) > now)
            .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
            .slice(0, 3);
          setUpcomingEmails(upcoming);
        }
      })
      .catch(() => setUpcomingEmails([]))
      .finally(() => setLoading(false));
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "scheduled": return <Clock className="w-3 h-3 text-blue-500" />;
      case "pending": return <Clock className="w-3 h-3 text-amber-500" />;
      default: return <Clock className="w-3 h-3 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-500 text-white";
      case "pending": return "bg-amber-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 p-2 border rounded animate-pulse">
            <div className="h-3 w-3 bg-muted/20 rounded" />
            <div className="flex-1 space-y-1">
              <div className="h-3 bg-muted/20 rounded w-3/4" />
              <div className="h-2 bg-muted/20 rounded w-1/2" />
            </div>
            <div className="h-4 w-12 bg-muted/20 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (upcomingEmails.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No upcoming emails</p>
        <p className="text-xs">Schedule emails to see them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {upcomingEmails.map((email) => (
        <div key={email.id} className="flex items-center gap-2 p-2 border rounded hover:bg-muted/50 transition-colors">
          <div className="flex-shrink-0">
            {getStatusIcon(email.status)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-xs truncate">{email.campaign_title}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(email.scheduled_at).toLocaleDateString()}
            </div>
          </div>
          <Badge className={`text-xs ${getStatusColor(email.status)}`}>
            {email.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}