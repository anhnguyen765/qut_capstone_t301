"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import { Separator } from "@/app/components/ui/separator";
import { Mail, Send, Loader2, Eye, Users } from "lucide-react";

interface Campaign {
  id: number;
  title: string;
  subject_line?: string;
  html_content?: string;
  content?: string;
  sender_name?: string;
  sender_email?: string;
  status: string;
  created_at: string;
  total_recipients?: number;
  sent_count?: number;
  failed_count?: number;
}

interface Contact {
  id: number;
  name: string;
  email: string;
  group: string;
}

export default function SendEmailPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [showPreview, setShowPreview] = useState(false);
  
  // New fields for individual email and scheduling
  const [recipientType, setRecipientType] = useState<"contacts" | "individual" | "group" | "mixed">("contacts");
  const [individualEmail, setIndividualEmail] = useState("");
  const [individualEmails, setIndividualEmails] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [sendImmediately, setSendImmediately] = useState(true);
  const [showScheduleOptions, setShowScheduleOptions] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    fetchContacts();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch("/api/campaigns");
      const data = await response.json();
      // The API returns { campaigns: [...] }
      const campaignsArray = data.campaigns || [];
      // Filter campaigns that have HTML content (check both content and html_content fields)
      const campaignsWithHtml = campaignsArray.filter((c: Campaign) => 
        (c.html_content && c.html_content.trim() !== "") || 
        (c.content && c.content.trim() !== "")
      );
      setCampaigns(campaignsWithHtml);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setMessage("Error loading campaigns");
      setMessageType("error");
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch("/api/contacts");
      const data = await response.json();
      // The API returns the contacts array directly
      setContacts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      setMessage("Error loading contacts");
      setMessageType("error");
      setContacts([]); // Set empty array on error
    }
  };

  const filteredContacts = (contacts || []).filter(contact => {
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
    if (!selectedCampaign) {
      setMessage("Please select a campaign.");
      setMessageType("error");
      return;
    }

    // Validate recipients based on recipient type
    if (recipientType === "contacts" && selectedContacts.length === 0) {
      setMessage("Please select at least one contact.");
      setMessageType("error");
      return;
    }

    if (recipientType === "individual" && !individualEmail.trim()) {
      setMessage("Please enter an email address.");
      setMessageType("error");
      return;
    }

    if (recipientType === "group" && selectedGroups.length === 0) {
      setMessage("Please select at least one group.");
      setMessageType("error");
      return;
    }

    if (recipientType === "mixed" && selectedContacts.length === 0 && individualEmails.length === 0 && selectedGroups.length === 0) {
      setMessage("Please select at least one recipient option.");
      setMessageType("error");
      return;
    }

    // Validate scheduling
    if (!sendImmediately && (!scheduleDate || !scheduleTime)) {
      setMessage("Please select both date and time for scheduling.");
      setMessageType("error");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const requestBody: any = {
        campaignId: selectedCampaign.id,
        sendImmediately: sendImmediately
      };

      // Add recipient information based on type
      if (recipientType === "contacts") {
        requestBody.contactIds = selectedContacts;
      } else if (recipientType === "individual") {
        requestBody.individualEmail = individualEmail.trim();
      } else if (recipientType === "group") {
        requestBody.targetGroups = selectedGroups;
      } else if (recipientType === "mixed") {
        // Mixed mode: combine all recipient types
        if (selectedContacts.length > 0) {
          requestBody.contactIds = selectedContacts;
        }
        if (individualEmails.length > 0) {
          requestBody.individualEmails = individualEmails;
        }
        if (selectedGroups.length > 0) {
          requestBody.targetGroups = selectedGroups;
        }
      }

      // Add scheduling information
      if (!sendImmediately && scheduleDate && scheduleTime) {
        const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
        requestBody.scheduledAt = scheduledAt;
      }

      const response = await fetch("/api/campaigns/send", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        const actionText = sendImmediately ? "sent" : "scheduled";
        setMessage(`Campaign ${actionText} successfully! ${data.queuedCount} emails queued for ${actionText === "sent" ? "sending" : "scheduled delivery"}.`);
        setMessageType("success");
        
        // Reset form
        setSelectedContacts([]);
        setIndividualEmail("");
        setIndividualEmails([]);
        setSelectedGroups([]);
        setScheduleDate("");
        setScheduleTime("");
        setSendImmediately(true);
        setShowScheduleOptions(false);
        
        fetchCampaigns(); // Refresh campaign stats
      } else {
        setMessage("Error sending campaign: " + data.error);
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Error sending campaign: " + error);
      setMessageType("error");
    } finally {
      setIsLoading(false);
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

  const getMessageColor = () => {
    switch (messageType) {
      case "success":
        return "bg-green-100 text-green-700 border-green-200";
      case "error":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const groups = ["all", "Companies", "Groups", "Private", "OSHC", "Schools"];

  return (
    <div className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Mail className="h-8 w-8" />
          Send Email Campaign
        </h1>
        <p className="text-gray-600">Select a stored campaign and recipients to send HTML emails</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-4 rounded border ${getMessageColor()}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Select Campaign
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {campaigns.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No campaigns with HTML content found</p>
              ) : (
                campaigns.map(campaign => (
                  <div
                    key={campaign.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedCampaign?.id === campaign.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedCampaign(campaign)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{campaign.title}</h3>
                        <p className="text-sm text-gray-600">{campaign.subject_line}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          From: {campaign.sender_name} &lt;{campaign.sender_email}&gt;
                        </p>
                      </div>
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      <span>Recipients: {campaign.total_recipients}</span>
                      {campaign.sent_count > 0 && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Sent: {campaign.sent_count}</span>
                        </>
                      )}
                      {campaign.failed_count > 0 && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="text-red-500">Failed: {campaign.failed_count}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-2">
                      Created: {new Date(campaign.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Recipients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Recipient Type Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Recipient Type</Label>
                <div className="flex gap-2">
                  <Button
                    variant={recipientType === "contacts" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRecipientType("contacts")}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Contacts
                  </Button>
                  <Button
                    variant={recipientType === "individual" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRecipientType("individual")}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Individual Email
                  </Button>
                  <Button
                    variant={recipientType === "group" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRecipientType("group")}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Group
                  </Button>
                  <Button
                    variant={recipientType === "mixed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRecipientType("mixed")}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Mixed
                  </Button>
                </div>
              </div>

              {/* Individual Email Input */}
              {recipientType === "individual" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email Address</Label>
                  <Input
                    type="email"
                    placeholder="Enter email address..."
                    value={individualEmail}
                    onChange={(e) => setIndividualEmail(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}

              {/* Group Selection */}
              {recipientType === "group" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Group</Label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                    aria-label="Select contact group"
                  >
                    {groups.filter(g => g !== "all").map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mixed Mode UI */}
              {recipientType === "mixed" && (
                <div className="space-y-4">
                  {/* Multiple Individual Emails */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Individual Emails</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="Enter email address..."
                          value={individualEmail}
                          onChange={(e) => setIndividualEmail(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (individualEmail.trim()) {
                              setIndividualEmails([...individualEmails, individualEmail.trim()]);
                              setIndividualEmail("");
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      {individualEmails.length > 0 && (
                        <div className="space-y-1">
                          {individualEmails.map((email, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <span className="text-sm">{email}</span>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setIndividualEmails(individualEmails.filter((_, i) => i !== index))}
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Multiple Groups */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Select Groups</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {groups.filter(g => g !== "all").map(group => (
                        <label key={group} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedGroups.includes(group)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedGroups([...selectedGroups, group]);
                              } else {
                                setSelectedGroups(selectedGroups.filter(g => g !== group));
                              }
                            }}
                          />
                          <span className="text-sm">{group}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Contact Selection in Mixed Mode */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Additional Contacts</Label>
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
                    
                    {/* Contact List for Mixed Mode */}
                    <div className="max-h-48 overflow-y-auto space-y-2">
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
                  </div>
                </div>
              )}

              {/* Search and Filter (only for contacts) */}
              {recipientType === "contacts" && (
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
              )}

              {/* Select All (only for contacts) */}
              {recipientType === "contacts" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label className="text-sm font-medium">
                    Select All ({filteredContacts.length} contacts)
                  </Label>
                </div>
              )}

              {/* Contact List (only for contacts) */}
              {recipientType === "contacts" && (
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
              )}

              {/* Scheduling Options */}
              <div className="space-y-2">
                <Separator />
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Send Options</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={sendImmediately}
                      onCheckedChange={(checked) => setSendImmediately(checked as boolean)}
                    />
                    <Label className="text-sm">Send immediately</Label>
                  </div>
                  
                  {!sendImmediately && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-sm font-medium">Date</Label>
                        <Input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Time</Label>
                        <Input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Separator />
                
                {/* Preview Button */}
                {selectedCampaign && (
                  <Button
                    onClick={() => setShowPreview(true)}
                    variant="outline"
                    className="w-full"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview Campaign
                  </Button>
                )}

                {/* Send Button */}
                <Button
                  onClick={sendCampaign}
                  disabled={
                    !selectedCampaign || 
                    (recipientType === "contacts" && selectedContacts.length === 0) ||
                    (recipientType === "individual" && !individualEmail.trim()) ||
                    (recipientType === "group" && selectedGroups.length === 0) ||
                    (recipientType === "mixed" && selectedContacts.length === 0 && individualEmails.length === 0 && selectedGroups.length === 0) ||
                    isLoading
                  }
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {sendImmediately ? "Sending..." : "Scheduling..."}
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {sendImmediately ? "Send" : "Schedule"} to {
                        recipientType === "individual" ? "1 Recipient" :
                        recipientType === "group" ? `${selectedGroups.length} Group${selectedGroups.length > 1 ? 's' : ''}` :
                        recipientType === "mixed" ? `${selectedContacts.length + individualEmails.length + selectedGroups.length} Recipients` :
                        `${selectedContacts.length} Recipients`
                      }
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Campaign Preview</CardTitle>
                <p className="text-sm text-gray-600">{selectedCampaign.title}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPreview(false)}
              >
                ×
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Subject:</Label>
                  <p className="text-sm">{selectedCampaign.subject_line}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">From:</Label>
                  <p className="text-sm">{selectedCampaign.sender_name} &lt;{selectedCampaign.sender_email}&gt;</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">HTML Content Preview:</Label>
                  <div 
                    className="border rounded p-4 max-h-96 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: selectedCampaign.html_content || selectedCampaign.content || "" }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
