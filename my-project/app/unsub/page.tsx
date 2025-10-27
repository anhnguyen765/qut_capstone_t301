"use client";

import { useState } from "react";

export default function Unsub() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<null | string>(null);
  // prefs: true = subscribed, false = unsubscribed
  const [prefs, setPrefs] = useState({
    opt1: true,
    opt2: true,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/unsub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, opt1: prefs.opt1, opt2: prefs.opt2 }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("Your preferences have been updated.");
      } else {
        setStatus(data.error || "An error occurred.");
      }
    } catch (err) {
      setStatus("An error occurred. Please try again later.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-4 text-foreground">Unsubscribe or Update Preferences</h1>
      <p className="mb-6 text-muted-foreground">Enter your email and update your email preferences below. You do not need to log in.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email Address</label>
          <input
            type="email"
            required
            className="w-full border rounded p-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </div>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={prefs.opt1}
              onChange={e => setPrefs(p => ({ ...p, opt1: e.target.checked }))}
            />
            Subscribe to Campaigns
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={prefs.opt2}
              onChange={e => setPrefs(p => ({ ...p, opt2: e.target.checked }))}
            />
            Subscribe to Event Invitations
          </label>
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 rounded mt-4"
          disabled={loading}
        >
          {loading ? "Saving..." : "Update Preferences"}
        </button>
        {status && <div className="mt-4 text-center text-sm text-green-700">{status}</div>}
      </form>
    </div>
  );
}
