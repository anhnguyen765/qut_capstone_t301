"use client";

import { useEffect, useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "@/app/components/ui/button";
const localizer = momentLocalizer(moment);


export default function CalendarPage() {
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [recipientType, setRecipientType] = useState("all");
  const [email, setEmail] = useState("");
  const [group, setGroup] = useState("");
  // Example groups, replace with real data if available
  const groups = ["Companies", "Private", "Groups", "OSHC", "Schools"];
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string|null>(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Fetch campaigns for the schedule dialog
  useEffect(() => {
    if (showScheduleDialog) {
      fetch("/api/campaigns")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data.campaigns)) setCampaigns(data.campaigns);
        });
    }
  }, [showScheduleDialog]);

  // Handle schedule submit
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduling(true);
    setScheduleError(null);
    try {
      const payload: any = {
        campaign_id: selectedCampaignId,
        scheduled_at: scheduleDate + (scheduleTime ? `T${scheduleTime}` : ""),
        recipientType,
      };
      if (recipientType === "email") payload.email = email;
      if (recipientType === "group") payload.group = group;
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to schedule email");
      setShowScheduleDialog(false);
      setSelectedCampaignId("");
      setEmail("");
      setGroup("");
      setRecipientType("all");
      setScheduleDate("");
      setScheduleTime("");
      window.location.reload();
    } catch (err: any) {
      setScheduleError(err.message || "Unknown error");
    } finally {
      setScheduling(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetch("/api/schedule")
      .then((res) => res.json())
      .then((data) => {
        setEvents(
          data.schedules.map((s: any) => ({
            title: s.campaign_title,
            start: new Date(s.scheduled_at),
            end: new Date(s.scheduled_at),
            allDay: false,
            resource: s,
            status: s.status,
          }))
        );
        setError(null);
      })
      .catch(() => setError("Failed to load scheduled campaigns."))
      .finally(() => setLoading(false));
  }, []);

  // Color code by status
  const eventStyleGetter = (event: any) => {
    let bg = "#2563eb"; // blue
    if (event.status === "sent") bg = "#22c55e"; // green
    else if (event.status === "failed") bg = "#ef4444"; // red
    else if (event.status === "cancelled") bg = "#a3a3a3"; // gray
    else if (event.status === "pending") bg = "#facc15"; // yellow
    return {
      style: {
        backgroundColor: bg,
        color: "#fff",
        borderRadius: "6px",
        border: "none",
        fontWeight: 500,
        fontSize: 14,
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
      },
    };
  };

  // Month navigation
  const [currentDate, setCurrentDate] = useState(new Date());
  const handleNavigate = (date: Date) => setCurrentDate(date);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-8 px-[10%]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#2563eb"/><path d="M7 11h10M7 15h6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
          Scheduled Campaigns Calendar
        </h1>
        <Button onClick={() => setShowScheduleDialog(true)} className="bg-blue-600 text-white hover:bg-blue-700 shadow">
          + Schedule Email
        </Button>
      </div>
      {/* Month navigation */}
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          aria-label="Previous month"
          onClick={() => setCurrentDate(moment(currentDate).subtract(1, 'month').toDate())}
          disabled={loading}
          className="border-blue-200 text-blue-700 hover:bg-blue-100 focus-visible:ring-blue-300"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Button>
        <span className="font-semibold text-lg text-blue-800 mx-2 select-none">{moment(currentDate).format('MMMM YYYY')}</span>
        <Button
          variant="outline"
          size="sm"
          aria-label="Next month"
          onClick={() => setCurrentDate(moment(currentDate).add(1, 'month').toDate())}
          disabled={loading}
          className="border-blue-200 text-blue-700 hover:bg-blue-100 focus-visible:ring-blue-300"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </Button>
      </div>
      {/* Schedule Email Dialog */}
      {showScheduleDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form onSubmit={handleScheduleSubmit} className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative space-y-4">
            <button type="button" className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setShowScheduleDialog(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-2">Schedule Email</h2>
            <div>
              <label className="block text-sm font-semibold mb-1">Campaign</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={selectedCampaignId}
                onChange={e => setSelectedCampaignId(e.target.value)}
                required
              >
                <option value="">Select a campaign</option>
                {campaigns.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Recipients</label>
              <select
                className="w-full border rounded px-3 py-2 mb-2"
                value={recipientType}
                onChange={e => setRecipientType(e.target.value)}
              >
                <option value="all">All</option>
                <option value="group">Specific Group</option>
                <option value="email">Single Email</option>
              </select>
              {recipientType === "group" && (
                <select
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={group}
                  onChange={e => setGroup(e.target.value)}
                  required
                >
                  <option value="">Select group</option>
                  {groups.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              )}
              {recipientType === "email" && (
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2 mt-1"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="recipient@example.com"
                />
              )}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1">Date</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1">Time</label>
                <input
                  type="time"
                  className="w-full border rounded px-3 py-2"
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                  required
                />
              </div>
            </div>
            {scheduleError && <div className="text-red-500 text-sm">{scheduleError}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300" onClick={() => setShowScheduleDialog(false)}>Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700" disabled={scheduling}>{scheduling ? "Scheduling..." : "Schedule"}</button>
            </div>
          </form>
        </div>
      )}
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded bg-blue-600 border border-blue-700" /> Scheduled</span>
        <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded bg-green-500 border border-green-700" /> Sent</span>
        <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded bg-yellow-400 border border-yellow-600" /> Pending</span>
        <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded bg-red-500 border border-red-700" /> Failed</span>
        <span className="flex items-center gap-1"><span className="inline-block w-4 h-4 rounded bg-gray-400 border border-gray-500" /> Cancelled</span>
      </div>
      <div className="w-full bg-white rounded-2xl shadow-lg p-2 sm:p-6 mb-8 border border-blue-100">
        {loading ? (
          <div className="text-center text-gray-500 py-20">Loading calendar...</div>
        ) : error ? (
          <div className="text-center text-red-500 py-20">{error}</div>
        ) : (
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor={(event: any) => event.end}
            date={currentDate}
            onNavigate={handleNavigate}
            style={{ height: 600, background: "#fff", borderRadius: 16, padding: 8, boxShadow: "0 2px 12px rgba(37,99,235,0.06)" }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={setSelectedEvent}
            popup
            tooltipAccessor={(event: { title: any; status: any; start: moment.MomentInput; }) => `${event.title}\nStatus: ${event.status}\n${moment(event.start).format('LLL')}`}
          />
        )}
      </div>
      {/* Event details dialog */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative border border-blue-200 animate-fadeIn">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-blue-700 text-2xl" onClick={() => setSelectedEvent(null)}>&times;</button>
            <h2 className="text-2xl font-bold mb-2 text-blue-700 flex items-center gap-2">
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="#2563eb"/><path d="M7 11h10M7 15h6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
              {selectedEvent.title}
            </h2>
            <div className="mb-2 text-sm text-gray-600 flex items-center gap-2">
              <span className="font-semibold">Status:</span>
              <span className={`inline-block w-3 h-3 rounded-full ${selectedEvent.status === 'sent' ? 'bg-green-500' : selectedEvent.status === 'failed' ? 'bg-red-500' : selectedEvent.status === 'pending' ? 'bg-yellow-400' : selectedEvent.status === 'cancelled' ? 'bg-gray-400' : 'bg-blue-600'}`}></span>
              <span className="capitalize">{selectedEvent.status}</span>
            </div>
            <div className="mb-2 text-sm text-gray-600">Scheduled: <span className="font-semibold">{selectedEvent.start.toLocaleString()}</span></div>
            {selectedEvent.resource?.recipient_type && (
              <div className="mb-2 text-sm text-gray-600">Recipient: <span className="font-semibold">{selectedEvent.resource.recipient_type === 'all' ? 'All' : selectedEvent.resource.recipient_type === 'group' ? `Group: ${selectedEvent.resource.recipient_group}` : `Email: ${selectedEvent.resource.recipient_email}`}</span></div>
            )}
            {selectedEvent.resource?.error_message && (
              <div className="mb-2 text-sm text-red-500">Error: {selectedEvent.resource.error_message}</div>
            )}
            <div className="mb-2 text-sm text-gray-600">Campaign ID: <span className="font-mono">{selectedEvent.resource?.campaign_id}</span></div>
            <div className="mb-2 text-sm text-gray-600">Schedule ID: <span className="font-mono">{selectedEvent.resource?.id}</span></div>
          </div>
        </div>
      )}
  </div>
  );
}
