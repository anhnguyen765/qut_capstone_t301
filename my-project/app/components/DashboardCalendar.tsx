"use client";

import { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Mail, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Eye,
  CheckCircle,
  AlertCircle,
  XCircle,
  Timer,
  Activity
} from "lucide-react";

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: any;
  status: string;
}

interface UpcomingEmail {
  id: number;
  campaign_title: string;
  scheduled_at: string;
  status: string;
  recipient_type: string;
  recipient_group?: string;
  recipient_email?: string;
}

export default function DashboardCalendar({ height = 400 }: { height?: number }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcomingEmails, setUpcomingEmails] = useState<UpcomingEmail[]>([]);
  const [recentEmails, setRecentEmails] = useState<UpcomingEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'timeline'>('calendar');

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/schedule");
      let data: any = null;
      try {
        data = await response.json();
      } catch (e) {
        throw new Error(`Invalid JSON from /api/schedule: ${String(e)}`);
      }

      if (!response.ok) {
        const msg = data?.error || `Server returned ${response.status}`;
        throw new Error(msg);
      }

      if (data.schedules) {
        const calendarEvents = data.schedules.map((s: any) => ({
          title: s.campaign_title,
          start: new Date(s.scheduled_at),
          end: new Date(s.scheduled_at),
          allDay: false,
          resource: s,
          status: s.status,
        }));
        
        setEvents(calendarEvents);
        
        // Separate upcoming and recent emails
        const now = new Date();
        const upcoming = data.schedules
          .filter((s: any) => new Date(s.scheduled_at) > now)
          .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
          .slice(0, 5);
        
        const recent = data.schedules
          .filter((s: any) => new Date(s.scheduled_at) <= now)
          .sort((a: any, b: any) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
          .slice(0, 5);
        
        setUpcomingEmails(upcoming);
        setRecentEmails(recent);
      } else {
        // No schedules key, treat as empty
        setEvents([]);
        setUpcomingEmails([]);
        setRecentEmails([]);
      }
      setError(null);
    } catch (err) {
      console.error("Calendar fetch error:", err);
      setError(err instanceof Error ? err.message : String(err) || "Failed to load calendar events");
    } finally {
      setLoading(false);
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let bg = "#4F71B6"; // primary blue
    if (event.status === "sent") bg = "#22c55e"; // green
    else if (event.status === "failed") bg = "#ef4444"; // red
    else if (event.status === "cancelled") bg = "#a3a3a3"; // gray
    else if (event.status === "pending") bg = "#f59e0b"; // amber
    
    return {
      style: {
        backgroundColor: bg,
        color: "#fff",
        borderRadius: "8px",
        border: "none",
        fontSize: "12px",
        fontWeight: "500",
        padding: "4px 8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      },
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "scheduled": return <Clock className="w-4 h-4 text-blue-500" />;
      case "pending": return <Timer className="w-4 h-4 text-amber-500" />;
      case "failed": return <XCircle className="w-4 h-4 text-red-500" />;
      case "cancelled": return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "bg-green-500 text-white";
      case "scheduled": return "bg-blue-500 text-white";
      case "pending": return "bg-amber-500 text-white";
      case "failed": return "bg-red-500 text-white";
      case "cancelled": return "bg-gray-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const formatRecipient = (email: UpcomingEmail) => {
    if (email.recipient_type === "all") return "All Subscribers";
    if (email.recipient_type === "group") return `Group: ${email.recipient_group}`;
    if (email.recipient_type === "email") return `Email: ${email.recipient_email}`;
    return email.recipient_type;
  };

  const TimelineView = () => {
    const allEmails = [...upcomingEmails, ...recentEmails].sort((a, b) => 
      new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Email Timeline</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(moment(currentDate).subtract(1, 'month').toDate())}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-3 py-1 bg-muted rounded-md">
              {moment(currentDate).format('MMMM YYYY')}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(moment(currentDate).add(1, 'month').toDate())}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {allEmails.length > 0 ? (
            allEmails.map((email) => (
              <div key={email.id} className="flex items-center gap-4 p-4 bg-card rounded-lg border hover:shadow-md transition-shadow">
                <div className="flex-shrink-0">
                  {getStatusIcon(email.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{email.campaign_title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {moment(email.scheduled_at).format('MMM DD, YYYY • HH:mm')}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {formatRecipient(email)}
                  </div>
                </div>
                <Badge className={`${getStatusColor(email.status)}`}>
                  {email.status}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No scheduled emails</p>
              <p className="text-sm">Create a campaign to see it here</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-64 flex items-center justify-center">
          <div className="text-muted-foreground">Loading calendar...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="h-64 flex items-center justify-center">
          <div className="text-destructive">{error}</div>
        </div>
        <div className="flex items-center justify-center">
          <Button onClick={() => { setLoading(true); fetchData(); }} variant="ghost">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={view === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('calendar')}
            className="flex items-center gap-2"
          >
            <CalendarIcon className="w-4 h-4" />
            Calendar
          </Button>
          <Button
            variant={view === 'timeline' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('timeline')}
            className="flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Timeline
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      {view === 'calendar' && (
        <Card className="min-h-0 overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Calendar View</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(moment(currentDate).subtract(1, 'month').toDate())}
                  className="text-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium px-2">
                  {moment(currentDate).format('MMM YYYY')}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(moment(currentDate).add(1, 'month').toDate())}
                  className="text-xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="min-h-0" style={{ height: height + 'px' }}>
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                date={currentDate}
                onNavigate={setCurrentDate}
                style={{ height: "100%" }}
                eventPropGetter={eventStyleGetter}
                views={['month']}
                defaultView="month"
                toolbar={false}
                onSelectEvent={setSelectedEvent}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline View */}
      {view === 'timeline' && (
        <Card className="min-h-0 overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-6">
            <TimelineView />
          </CardContent>
        </Card>
      )}


      {/* Enhanced Event Details Dialog */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-lg w-full p-6 relative border">
            <button 
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-xl w-6 h-6 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedEvent(null)}
            >
              ×
            </button>
            
            {/* Header */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-2">
                {getStatusIcon(selectedEvent.status)}
                <h3 className="text-xl font-bold">{selectedEvent.title}</h3>
              </div>
              <div className="text-sm text-muted-foreground">
                Campaign Details
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Status</span>
                </div>
                <Badge className={`text-white ${getStatusColor(selectedEvent.status)}`}>
                  {selectedEvent.status}
                </Badge>
              </div>

              {/* Schedule Time */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Scheduled Time</span>
                </div>
                <div className="text-sm text-right">
                  <div>{selectedEvent.start.toLocaleDateString()}</div>
                  <div className="text-muted-foreground">{selectedEvent.start.toLocaleTimeString()}</div>
                </div>
              </div>

              {/* Recipients */}
              {selectedEvent.resource?.recipient_type && (
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Recipients</span>
                  </div>
                  <div className="text-sm text-right">
                    {formatRecipient(selectedEvent.resource)}
                  </div>
                </div>
              )}

              {/* Campaign ID */}
              {selectedEvent.resource?.id && (
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Campaign ID</span>
                  </div>
                  <div className="text-sm font-mono">
                    #{selectedEvent.resource.id}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              {selectedEvent.resource?.campaign_title && selectedEvent.resource.campaign_title !== selectedEvent.title && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="text-sm font-medium text-primary mb-1">Campaign Name</div>
                  <div className="text-sm">{selectedEvent.resource.campaign_title}</div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex gap-2 mt-6">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </Button>
              {selectedEvent.resource?.id && (
                <Button 
                  className="flex-1"
                  onClick={() => {
                    // Navigate to campaign details or edit
                    window.open(`/campaigns/${selectedEvent.resource.id}`, '_blank');
                  }}
                >
                  View Campaign
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
