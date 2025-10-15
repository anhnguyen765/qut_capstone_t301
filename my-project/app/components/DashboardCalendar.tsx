"use client";

import { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

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

export default function DashboardCalendar({ height = 256 }: { height?: number }) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcomingEmails, setUpcomingEmails] = useState<UpcomingEmail[]>([]);
  const [recentEmails, setRecentEmails] = useState<UpcomingEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

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
    let bg = "#2563eb"; // blue
    if (event.status === "sent") bg = "#22c55e"; // green
    else if (event.status === "failed") bg = "#ef4444"; // red
    else if (event.status === "cancelled") bg = "#a3a3a3"; // gray
    else if (event.status === "pending") bg = "#facc15"; // yellow
    
    return {
      style: {
        backgroundColor: bg,
        color: "#fff",
        borderRadius: "4px",
        border: "none",
        fontSize: "12px",
      },
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "bg-green-500";
      case "scheduled": return "bg-blue-500";
      case "pending": return "bg-yellow-500";
      case "failed": return "bg-red-500";
      case "cancelled": return "bg-gray-500";
      default: return "bg-gray-500";
    }
  };

  const formatRecipient = (email: UpcomingEmail) => {
    if (email.recipient_type === "all") return "All";
    if (email.recipient_type === "group") return `Group: ${email.recipient_group}`;
    if (email.recipient_type === "email") return `Email: ${email.recipient_email}`;
    return email.recipient_type;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500">Loading calendar...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="h-64 flex items-center justify-center">
          <div className="text-red-500">{error}</div>
        </div>
        <div className="flex items-center justify-center">
          <Button onClick={() => { setLoading(true); fetchData(); }} variant="ghost">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar */}
  <Card className="min-h-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Calendar View</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(moment(currentDate).subtract(1, 'month').toDate())}
                className="text-xs"
              >
                ←
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
                →
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: height }} className="min-h-0">
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

      {/* Upcoming Emails */}
  <Card className="min-h-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Emails</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEmails.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-auto">
              {upcomingEmails.map((email) => (
                <div key={email.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{email.campaign_title}</div>
                    <div className="text-xs text-gray-500">
                      {moment(email.scheduled_at).format('MMM DD, YYYY HH:mm')}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {formatRecipient(email)}
                    </div>
                  </div>
                  <Badge className={`text-white ${getStatusColor(email.status)}`}>
                    {email.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              No upcoming emails scheduled
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Emails */}
  <Card className="min-h-0 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">Recent Email Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEmails.length > 0 ? (
            <div className="space-y-2 max-h-56 overflow-auto">
              {recentEmails.map((email) => (
                <div key={email.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{email.campaign_title}</div>
                    <div className="text-xs text-gray-500">
                      {moment(email.scheduled_at).format('MMM DD, YYYY HH:mm')}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {formatRecipient(email)}
                    </div>
                  </div>
                  <Badge className={`text-white ${getStatusColor(email.status)}`}>
                    {email.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-4">
              No recent email activity
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
            <button 
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
              onClick={() => setSelectedEvent(null)}
            >
              ×
            </button>
            <h3 className="text-lg font-bold mb-2">{selectedEvent.title}</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Status:</span>
                <Badge className={`ml-2 text-white ${getStatusColor(selectedEvent.status)}`}>
                  {selectedEvent.status}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Scheduled:</span>
                <span className="ml-2">{selectedEvent.start.toLocaleString()}</span>
              </div>
              {selectedEvent.resource?.recipient_type && (
                <div>
                  <span className="font-medium">Recipients:</span>
                  <span className="ml-2">{formatRecipient(selectedEvent.resource)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
