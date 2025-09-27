"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Badge } from "@/app/components/ui/badge";

interface Contact {
  id: number;
  name: string;
  email: string;
  group: string;
}

interface Campaign {
  id: number;
  title: string;
  subjectLine: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: string;
  type: string;
}

export default function CampaignSender() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [subjectLine, setSubjectLine] = useState("");
  const [senderName, setSenderName] = useState("2 Bent Rods");
  const [senderEmail, setSenderEmail] = useState("campaigns@2bentrods.com.au");

  useEffect(() => {
    fetchCampaigns();
    fetchContacts();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch("/api/campaigns");
      const data = await response.json();
      setCampaigns(data.campaigns.map((c: any) => ({
        id: c.id,
        title: c.title,
        subjectLine: c.subject_line || c.title,
        totalRecipients: c.total_recipients || 0,
        sentCount: c.sent_count || 0,
        failedCount: c.failed_count || 0,
        status: c.status,
        type: c.type
      })));
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/contacts");
      const data = await response.json();
      setContacts(data.contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === "all" || contact.group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const handleContactToggle = (contactId: number) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id));
    }
  };

  const sendCampaign = async () => {
    if (!selectedCampaign || selectedContacts.length === 0) {
      setMessage("Please select a campaign and at least one contact.");
      return;
    }

    if (!subjectLine.trim()) {
      setMessage("Please enter a subject line.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/campaigns/send", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: selectedCampaign.id,
          contactIds: selectedContacts,
          subjectLine: subjectLine,
          senderName: senderName,
          senderEmail: senderEmail,
          sendImmediately: true
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Campaign queued successfully! ${data.queuedCount} emails will be sent.`);
        setSelectedContacts([]);
        fetchCampaigns(); // Refresh campaign stats
      } else {
        setMessage("Error sending campaign: " + data.error);
      }
    } catch (error) {
      setMessage("Error sending campaign: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const groups = ["all", "Companies", "Groups", "Private", "OSHC", "Schools"];

  return (
    <div className="py-8 px-[10%]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          Send Email Campaign
        </h1>
        <p className="text-gray-600">Select a campaign and recipients to send emails</p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campaigns.map(campaign => (
                <div
                  key={campaign.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCampaign?.id === campaign.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedCampaign(campaign)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{campaign.title}</h3>
                      <p className="text-sm text-gray-600">{campaign.subjectLine}</p>
                    </div>
                    <Badge variant={campaign.status === 'sent' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    <span>Recipients: {campaign.totalRecipients}</span>
                    {campaign.sentCount > 0 && (
                      <>
                        <span className="mx-2">•</span>
                        <span>Sent: {campaign.sentCount}</span>
                      </>
                    )}
                    {campaign.failedCount > 0 && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="text-red-500">Failed: {campaign.failedCount}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Email Configuration */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold mb-4">Email Configuration</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Subject Line</label>
                  <Input
                    placeholder="Enter email subject line"
                    value={subjectLine}
                    onChange={(e) => setSubjectLine(e.target.value)}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Sender Name</label>
                    <Input
                      placeholder="Sender name"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sender Email</label>
                    <Input
                      type="email"
                      placeholder="sender@example.com"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Recipients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search and Filter */}
              <div className="flex gap-2">
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="border rounded px-3 py-2"
                  aria-label="Filter by contact group"
                >
                  {groups.map(group => (
                    <option key={group} value={group}>
                      {group === "all" ? "All Groups" : group}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select All */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label className="text-sm font-medium">
                  Select All ({filteredContacts.length} contacts)
                </label>
              </div>

              {/* Contact List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredContacts.map(contact => (
                  <div key={contact.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={() => handleContactToggle(contact.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-sm text-gray-500">{contact.email}</div>
                    </div>
                    <Badge variant="outline">{contact.group}</Badge>
                  </div>
                ))}
              </div>

              {/* Send Button */}
              <Button
                onClick={sendCampaign}
                disabled={!selectedCampaign || selectedContacts.length === 0 || isLoading}
                className="w-full"
              >
                {isLoading ? "Sending..." : `Send to ${selectedContacts.length} Recipients`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}