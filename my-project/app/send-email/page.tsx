"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
import { Separator } from "@/app/components/ui/separator";
import { Mail, Send, Loader2, Eye, Users, ChevronDown, ChevronRight, CheckCircle, Circle } from "lucide-react";
import { useContactGroupNames } from "@/hooks/useContactGroups";

interface Campaign {
  id: number;
  title: string;
  type: string;
  content?: string;
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const newsletterId = searchParams.get('newsletterId');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [newsletters, setNewsletters] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [calendarLink, setCalendarLink] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedType, setSelectedType] = useState<"campaigns" | "newsletters">("campaigns");

  // New fields for individual email and scheduling
  const [recipientType, setRecipientType] = useState<"mixed">("mixed");

  // Fields for editing campaign details
  const [editMode, setEditMode] = useState(false);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedSenderName, setEditedSenderName] = useState("");

  // UI state for collapsible sections
  const [campaignSectionOpen, setCampaignSectionOpen] = useState(false);
  const [editSectionOpen, setEditSectionOpen] = useState(false);
  const [recipientsSectionOpen, setRecipientsSectionOpen] = useState(false);
  const [reviewSectionOpen, setReviewSectionOpen] = useState(false);
  const [individualEmail, setIndividualEmail] = useState("");
  const [individualEmails, setIndividualEmails] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [sendImmediately, setSendImmediately] = useState(false);
  const [showScheduleOptions, setShowScheduleOptions] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    fetchNewsletters();
    fetchContacts();
  }, []);

  // Auto-select campaign if campaignId is provided in URL
  useEffect(() => {
    if (campaignId && campaigns.length > 0) {
      const campaign = campaigns.find(c => c.id === parseInt(campaignId));
      if (campaign) {
        setSelectedCampaign(campaign);
        setSelectedType("campaigns");
        setCampaignSectionOpen(false);
        setEditSectionOpen(true);
      }
    }
  }, [campaignId, campaigns]);

  // Auto-select newsletter if newsletterId is provided in URL
  useEffect(() => {
    if (newsletterId && newsletters.length > 0) {
      const newsletter = newsletters.find(n => n.id === parseInt(newsletterId));
      if (newsletter) {
        setSelectedCampaign(newsletter);
        setSelectedType("newsletters");
        setCampaignSectionOpen(false);
        setEditSectionOpen(true);
      }
    }
  }, [newsletterId, newsletters]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch("/api/campaigns");
      const data = await response.json();
      // The API returns { campaigns: [...] }
      const campaignsArray = data.campaigns || [];
      // Filter campaigns that have content
      const campaignsWithHtml = campaignsArray.filter((c: Campaign) =>
        (c.content && c.content.trim() !== "")
      );
      setCampaigns(campaignsWithHtml);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setMessage("Error loading campaigns");
      setMessageType("error");
    }
  };

  const fetchNewsletters = async () => {
    try {
      const response = await fetch("/api/newsletters");
      const data = await response.json();
      // The API returns { newsletters: [...] }
      const newslettersArray = data.newsletters || [];
      // Filter newsletters that have content
      const newslettersWithHtml = newslettersArray.filter((c: Campaign) =>
        (c.content && c.content.trim() !== "")
      );
      setNewsletters(newslettersWithHtml);
    } catch (error) {
      console.error("Error fetching newsletters:", error);
      setMessage("Error loading newsletters");
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

  const handleCampaignSelect = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setEditedSubject("");
    setEditedSenderName("");
    setEditMode(false);

    // Animate: collapse current step and expand next step
    setCampaignSectionOpen(false);

    // Always jump to edit section since subject and sender are required for sending
    setTimeout(() => {
      setEditSectionOpen(true);
      setEditMode(true);
      setRecipientsSectionOpen(false);
    }, 200); // Small delay for smooth animation
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
    setEditSectionOpen(!editMode);
  };

  const handleEditComplete = () => {
    // Animate: collapse current step and expand next step
    setEditSectionOpen(false);

    setTimeout(() => {
      setRecipientsSectionOpen(true);
    }, 200); // Small delay for smooth animation
  };

  const handleRecipientsComplete = () => {
    // When recipients are selected, move to review section
    setRecipientsSectionOpen(false);
    setReviewSectionOpen(true);
  };

  const handleRemoveContact = (contactId: number) => {
    setSelectedContacts(prev => prev.filter(id => id !== contactId));
  };

  const handleRemoveIndividualEmail = (email: string) => {
    setIndividualEmails(prev => prev.filter(e => e !== email));
  };

  const handleRemoveGroup = (group: string) => {
    setSelectedGroups(prev => prev.filter(g => g !== group));
  };

  const handleClearIndividualEmail = () => {
    setIndividualEmail("");
  };

  const sendCampaign = async () => {
    if (!selectedCampaign) {
      setMessage("Please select a campaign.");
      setMessageType("error");
      return;
    }

    // Use edited values for subject and sender
    const subjectLine = editedSubject;
    const senderName = editedSenderName;
    const senderEmail = 'campaigns@2bentrods.com.au'; // Always use fixed sender email

    // Validate campaign has required fields
    if (!subjectLine || subjectLine.trim() === "") {
      setMessage("Subject line is required. Please enter a subject line.");
      setMessageType("error");
      return;
    }

    if (!senderName || senderName.trim() === "") {
      setMessage("Sender name is required. Please enter a sender name.");
      setMessageType("error");
      return;
    }

    if (!selectedCampaign.content) {
      setMessage("Selected campaign has no content. Please select a campaign with content.");
      setMessageType("error");
      return;
    }

    // Validate recipients
    if (!sendToAll && selectedContacts.length === 0 && individualEmails.length === 0 && selectedGroups.length === 0) {
      setMessage("Please select at least one recipient option or enable 'Send to All'.");
      setMessageType("error");
      return;
    }

    // Validate scheduling
    if (!sendImmediately && (!scheduleDate || !scheduleTime)) {
      setMessage("Please select both date and time for scheduling.");
      setMessageType("error");
      return;
    }
    
    // Validate the scheduled time is in the future
    if (!sendImmediately && scheduleDate && scheduleTime) {
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      const now = new Date();
      const minScheduleTime = new Date(now.getTime() + 60 * 1000); // 1 minute buffer
      
      if (isNaN(scheduledDateTime.getTime())) {
        setMessage("Invalid date or time format.");
        setMessageType("error");
        return;
      }
      
      if (scheduledDateTime <= minScheduleTime) {
        setMessage("Scheduled time must be at least 1 minute in the future.");
        setMessageType("error");
        return;
      }
    }

    setIsLoading(true);
    setMessage("");

    try {
      const requestBody: any = {
        campaignId: selectedCampaign.id,
        sendImmediately: sendImmediately,
        subjectLine: subjectLine,
        senderName: senderName,
        senderEmail: senderEmail,
        sendToAll: sendToAll
      };

      // Add recipient information (only if not sending to all)
      if (!sendToAll) {
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
        // Create date in local timezone first
        const localDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
        console.log("Frontend scheduling debug:");
        console.log("- Input date:", scheduleDate);
        console.log("- Input time:", scheduleTime);
        console.log("- Local datetime object:", localDateTime);
        console.log("- Local toString():", localDateTime.toString());
        console.log("- UTC ISO string:", localDateTime.toISOString());
        console.log("- Browser timezone:", Intl.DateTimeFormat().resolvedOptions().timeZone);
        
        const scheduledAt = localDateTime.toISOString();
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
        let msg = `Campaign ${actionText} successfully! ${data.queuedCount} emails queued for ${actionText === "sent" ? "sending" : "scheduled delivery"}.`;
        setCalendarLink(null);
        if (data.scheduleId) {
          const link = `/calendar?highlight=${data.scheduleId}`;
          setCalendarLink(link);
          msg += ` Added to calendar.`;
        }
        setMessage(msg);
        setMessageType("success");

        // Reset all steps and form data
        resetAllSteps();

        fetchCampaigns(); // Refresh campaign stats
        fetchNewsletters(); // Refresh newsletter stats

        // Redirect to campaigns page after a short delay
        setTimeout(() => {
          // If there is a calendar link, navigate to campaigns after a short delay but keep link available
          router.push('/campaigns');
        }, 2000);
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

  const resetAllSteps = () => {
    // Reset form data
    setSelectedCampaign(null);
    setSelectedContacts([]);
    setIndividualEmail("");
    setIndividualEmails([]);
    setSelectedGroups([]);
    setSendToAll(false);
    setEditMode(false);
    setEditedSubject("");
    setEditedSenderName("");
    setSendImmediately(true);
    setScheduleDate("");
    setScheduleTime("");
    setShowScheduleOptions(false);

    // Reset step states to collapsed view
    setCampaignSectionOpen(false);
    setEditSectionOpen(false);
    setRecipientsSectionOpen(false);
    setReviewSectionOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'sending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100';
    }
  };

  const getMessageColor = () => {
    switch (messageType) {
      case "success":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800";
      case "error":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-100 dark:border-red-800";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800";
    }
  };

  // Use dynamic groups
  const groupNames = useContactGroupNames();
  const groups = ["all", ...groupNames];

  // Lightweight entries used for rendering lists to avoid TS inference issues
  const campaignEntries = campaigns.map((c) => ({ id: c.id, title: c.title, status: c.status, full: c }));
  const newsletterEntries = newsletters.map((n) => ({ id: n.id, title: n.title, status: n.status, full: n }));

  return (
    <div className="py-8 px-[10%]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-foreground">
          <Mail className="h-8 w-8" />
          Send Email
        </h1>
        <p className="text-muted-foreground">Select a stored campaign or newsletter and recipients to send HTML emails</p>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-4 rounded border ${getMessageColor()}`}>
          <div>{message}</div>
          {calendarLink && (
            <div className="mt-2">
              <a href={calendarLink} className="text-sm text-primary underline">View on calendar</a>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Steps */}
        <div className="space-y-4">
          {/* Step 1: Campaign Selection */}
          <Card className="transition-all duration-300 ease-in-out">
            <CardHeader
              className="cursor-pointer hover:bg-accent transition-colors duration-200"
              onClick={() => setCampaignSectionOpen(!campaignSectionOpen)}
            >
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedCampaign ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <Mail className="h-5 w-5" />
                  <span>1. Select Campaign/Newsletter</span>
                  {selectedCampaign && (
                    <Badge variant="outline" className="ml-2">
                      {selectedCampaign.title}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {campaignSectionOpen ? (
                    <ChevronDown className="h-5 w-5 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="h-5 w-5 transition-transform duration-200" />
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            {campaignSectionOpen && (
              <CardContent>
                <div className="space-y-4">
                  {/* Type Selection Tabs */}
                  <div className="flex space-x-1 bg-muted p-1 rounded-lg">
                    <button
                      onClick={() => setSelectedType("campaigns")}
                      className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${selectedType === "campaigns"
                          ? "bg-background text-foreground shadow-sm dark:bg-card dark:text-white dark:border dark:border-border"
                          : "text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white"
                        }`}
                    >
                      Campaigns ({campaigns.length})
                    </button>
                    <button
                      onClick={() => setSelectedType("newsletters")}
                      className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${selectedType === "newsletters"
                          ? "bg-background text-foreground shadow-sm dark:bg-card dark:text-white dark:border dark:border-border"
                          : "text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white"
                        }`}
                    >
                      Newsletters ({newsletters.length})
                    </button>
                  </div>

                  {selectedCampaign && (
                    <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-green-900 dark:text-green-100">Selected: {selectedCampaign.title}</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCampaign(null);
                            setCampaignSectionOpen(true);
                            setEditSectionOpen(false);
                            setRecipientsSectionOpen(false);
                            setReviewSectionOpen(false);
                          }}
                          className="text-primary hover:text-primary/80 hover:bg-primary/10"
                        >
                          Change Selection
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm">
                          <span className="font-medium">Type:</span> {selectedCampaign.type}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Status:</span> <Badge className={getStatusColor(selectedCampaign.status)}>{selectedCampaign.status}</Badge>
                        </p>
                      </div>
                    </div>
                  )}

                  {!selectedCampaign && (
                    <div className="space-y-3">
                      {selectedType === "campaigns" && campaigns.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No campaigns with HTML content found</p>
                      ) : selectedType === "newsletters" && newsletters.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No newsletters with HTML content found</p>
                      ) : (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {selectedType === "campaigns"
                            ? campaigns.map((item: Campaign) => {
                              const isSelected = selectedCampaign === item;
                              return (
                                <div
                                  key={item.id}
                                  className={`border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md'
                                    : 'border-border hover:border-border/80'
                                  }`}
                                  onClick={() => handleCampaignSelect(item)}
                                >
                                  <div className="flex">
                                    {/* Preview Image Section */}
                                    <div className="w-24 h-24 bg-muted rounded-l-lg overflow-hidden flex-shrink-0">
                                      {item.content ? (
                                        <div
                                          className="h-full w-full p-2 text-xs overflow-hidden email-preview-wrapper"
                                          dangerouslySetInnerHTML={{ __html: item.content }}
                                          style={{
                                            transform: 'scale(0.25)',
                                            transformOrigin: 'top left',
                                            width: '400%',
                                            height: '400%',
                                            backgroundColor: 'var(--background)',
                                            color: 'var(--foreground)'
                                          }}
                                        />
                                      ) : (
                                        <div className="h-full flex items-center justify-center text-muted-foreground">
                                          <Mail className="h-8 w-8 opacity-50" />
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Content Section */}
                                    <div className="flex-1 p-4">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-semibold text-lg truncate">{item.title}</h4>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            <span className="font-medium">Type:</span> {item.type}
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            <span className="font-medium">Target:</span> All Groups
                                          </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 ml-4">
                                          <Badge className={getStatusColor(item.status)}>
                                            {item.status}
                                          </Badge>
                                          <div className="text-xs text-muted-foreground text-right">
                                            {item.created_at && new Date(item.created_at).toLocaleDateString()}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                            : newsletters.map((item: Campaign) => {
                              const isSelected = selectedCampaign === item;
                              return (
                                <div
                                  key={item.id}
                                  className={`border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-md'
                                    : 'border-border hover:border-border/80'
                                  }`}
                                  onClick={() => handleCampaignSelect(item)}
                                >
                                  <div className="flex">
                                    {/* Preview Image Section */}
                                    <div className="w-24 h-24 bg-muted rounded-l-lg overflow-hidden flex-shrink-0">
                                      {item.content ? (
                                        <div
                                          className="h-full w-full p-2 text-xs overflow-hidden email-preview-wrapper"
                                          dangerouslySetInnerHTML={{ __html: item.content }}
                                          style={{
                                            transform: 'scale(0.25)',
                                            transformOrigin: 'top left',
                                            width: '400%',
                                            height: '400%',
                                            backgroundColor: 'var(--background)',
                                            color: 'var(--foreground)'
                                          }}
                                        />
                                      ) : (
                                        <div className="h-full flex items-center justify-center text-muted-foreground">
                                          <Mail className="h-8 w-8 opacity-50" />
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Content Section */}
                                    <div className="flex-1 p-4">
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-semibold text-lg truncate">{item.title}</h4>
                                          <p className="text-sm text-muted-foreground mt-1">
                                            <span className="font-medium">Type:</span> Newsletter
                                          </p>
                                          <p className="text-sm text-muted-foreground">
                                            <span className="font-medium">Target:</span> All Groups
                                          </p>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Subject & Sender will be entered when sending
                                          </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 ml-4">
                                          <Badge className={getStatusColor(item.status)}>
                                            {item.status}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          }
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Step 2: Edit Email Details (Optional) */}
          {selectedCampaign && (
            <Card className="transition-all duration-300 ease-in-out">
              <CardHeader
                className="cursor-pointer hover:bg-accent transition-colors duration-200"
                onClick={() => setEditSectionOpen(!editSectionOpen)}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {editMode && editedSubject.trim() && editedSenderName.trim() ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-amber-500" />
                    )}
                    <Mail className="h-5 w-5" />
                    <span>2. Edit Email Details (Required)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {editSectionOpen ? (
                      <ChevronDown className="h-5 w-5 transition-transform duration-200" />
                    ) : (
                      <ChevronRight className="h-5 w-5 transition-transform duration-200" />
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              {editSectionOpen && (
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Subject Line</Label>
                      <Input
                        value={editedSubject}
                        onChange={(e) => setEditedSubject(e.target.value)}
                        placeholder="Enter subject line..."
                        className="mt-1 border-2 border-border focus:border-primary"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Sender Name</Label>
                      <Input
                        value={editedSenderName}
                        onChange={(e) => setEditedSenderName(e.target.value)}
                        placeholder="Enter sender name..."
                        className="mt-1 border-2 border-border focus:border-primary"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Sender Email</Label>
                      <Input
                        type="email"
                        value="campaigns@2bentrods.com.au"
                        disabled
                        className="mt-1 bg-muted"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Sender email is fixed for all campaigns</p>
                    </div>

                    {/* Complete Edit Button */}
                    <div className="pt-2">
                      <Button
                        onClick={handleEditComplete}
                        disabled={!editedSubject.trim() || !editedSenderName.trim()}
                        className="w-full"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Complete Edit & Continue
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Step 3: Select Recipients */}
          {selectedCampaign && (
            <Card className="transition-all duration-300 ease-in-out">
              <CardHeader
                className="cursor-pointer hover:bg-accent transition-colors duration-200"
                onClick={() => setRecipientsSectionOpen(!recipientsSectionOpen)}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(sendToAll || selectedContacts.length > 0 || selectedGroups.length > 0 || individualEmails.length > 0) ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <Users className="h-5 w-5" />
                    <span>3. Select Recipients</span>
                    {(sendToAll || selectedContacts.length > 0 || selectedGroups.length > 0 || individualEmails.length > 0) && (
                      <Badge variant="outline" className="ml-2">
                        {sendToAll ? 'All Contacts' : `${selectedContacts.length + individualEmails.length + selectedGroups.length} selected`}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {recipientsSectionOpen ? (
                      <ChevronDown className="h-5 w-5 transition-transform duration-200" />
                    ) : (
                      <ChevronRight className="h-5 w-5 transition-transform duration-200" />
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              {recipientsSectionOpen && (
                <CardContent>
                  <div className="space-y-4">

                    {/* Send to All Option */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <Checkbox
                          checked={sendToAll}
                          onCheckedChange={(checked) => {
                            setSendToAll(checked as boolean);
                            if (checked) {
                              // Clear other selections when "Send to All" is checked
                              setSelectedContacts([]);
                              setIndividualEmails([]);
                              setSelectedGroups([]);
                            }
                          }}
                          className="border-2 border-blue-400 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                        />
                        <div className="flex-1">
                          <Label className="text-sm font-medium text-blue-800 dark:text-blue-100">Send to All Contacts</Label>
                        </div>
                      </div>
                    </div>

                    {!sendToAll && (
                    <div className="space-y-4">
                      {/* Individual Emails - Moved to top */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Individual Emails</Label>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              type="email"
                              placeholder="Enter email address..."
                              value={individualEmail}
                              onChange={(e) => setIndividualEmail(e.target.value)}
                              className="flex-1 border-2 border-border focus:border-primary"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                if (individualEmail.trim() && !individualEmails.includes(individualEmail.trim())) {
                                  setIndividualEmails([...individualEmails, individualEmail.trim()]);
                                  setIndividualEmail("");
                                }
                              }}
                              disabled={!individualEmail.trim() || individualEmails.includes(individualEmail.trim())}
                            >
                              Add
                            </Button>
                          </div>
                          {individualEmails.length > 0 && (
                            <div className="max-h-24 overflow-y-auto space-y-1 border rounded p-2">
                              {individualEmails.map((email, index) => (
                                <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                                  <span className="text-sm truncate">{email}</span>
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
                                className="w-4 h-4 border-2 border-gray-400 rounded focus:ring-blue-500 focus:ring-2"
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
                            className="flex-1 border-2 border-border focus:border-primary"
                          />
                          <select
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                            className="border-2 border-border rounded px-3 py-2 focus:border-primary font-medium"
                            aria-label="Filter by contact group"
                          >
                            {groups.map(group => (
                              <option key={group} value={group} className="font-medium">
                                {group === "all" ? "All Groups" : group}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Contact List for Mixed Mode */}
                        <div className="max-h-32 overflow-y-auto space-y-1 border rounded p-2">
                          {filteredContacts.map(contact => (
                            <div key={contact.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                              <Checkbox
                                checked={selectedContacts.includes(contact.id)}
                                onCheckedChange={() => handleContactToggle(contact.id)}
                                className="border-2 border-gray-400 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{contact.name}</div>
                                <div className="text-xs text-muted-foreground truncate">{contact.email}</div>
                              </div>
                              <Badge variant="outline" className="text-xs">{contact.group}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    )}

                    {/* Scheduling Options */}
                    <div className="space-y-2">
                      <Separator />
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Send Options</Label>

                        {!sendImmediately && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-sm font-medium">Date</Label>
                              <Input
                                type="date"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="border-2 border-border focus:border-primary"
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Time</Label>
                              <Input
                                type="time"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                className="border-2 border-border focus:border-primary"
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={sendImmediately}
                            onCheckedChange={(checked) => setSendImmediately(checked as boolean)}
                            className="border-2 border-gray-400 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                          />
                          <Label className="text-sm">Send immediately</Label>
                        </div>

                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

        </div>

        {/* Right Column - Review Panel */}
        <div className="space-y-4">
          {/* Email Review */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Selected Campaign/Newsletter</Label>
                  <p className="text-sm font-medium">{selectedCampaign ? selectedCampaign.title : "No campaign/newsletter selected"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Subject Line</Label>
                  <p className="text-sm">
                    {editMode ? editedSubject : <span className="text-muted-foreground italic">Enter subject line below</span>}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">From</Label>
                  <p className="text-sm">
                    {editMode ? editedSenderName : <span className="text-muted-foreground italic">Enter sender name below</span>} &lt;campaigns@2bentrods.com.au&gt;
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  {selectedCampaign ? (
                    <Badge className={getStatusColor(selectedCampaign.status)}>
                      {selectedCampaign.status}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">No status</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recipients Review */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recipients Review
                <Badge variant="outline" className="ml-2">
                  {sendToAll ? 'All Contacts' : `${selectedContacts.length + individualEmails.length + selectedGroups.length} total`}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-1 border rounded p-2">
                {/* Send to All indicator */}
                {sendToAll && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-blue-800 dark:text-blue-100">Send to All Contacts</div>
                      <div className="text-xs text-blue-600 dark:text-blue-200">All subscribed Contacts will receive this email</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSendToAll(false)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                )}

                {/* Selected Contacts */}
                {!sendToAll && selectedContacts.map(contactId => {
                  const contact = contacts.find(c => c.id === contactId);
                  return contact ? (
                    <div key={contactId} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{contact.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{contact.email}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{contact.group}</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveContact(contactId)}
                          className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : null;
                })}


                {/* Individual Emails (Mixed Mode) */}
                {!sendToAll && individualEmails.map((email, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{email}</div>
                      <div className="text-xs text-muted-foreground">Individual Email</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveIndividualEmail(email)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                ))}

                {/* Selected Groups */}
                {!sendToAll && selectedGroups.map(group => (
                  <div key={group} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{group}</div>
                      <div className="text-xs text-muted-foreground">Group</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveGroup(group)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                ))}

                {/* Empty State */}
                {!sendToAll && selectedContacts.length === 0 && individualEmails.length === 0 && selectedGroups.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No recipients selected</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Send Options Review */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Send Type</Label>
                  <p className="text-sm">{sendImmediately ? "Send Immediately" : "Scheduled"}</p>
                </div>
                {!sendImmediately && scheduleDate && scheduleTime ? (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Scheduled For</Label>
                    <p className="text-sm">{new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}</p>
                  </div>
                ) : !sendImmediately ? (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Scheduled For</Label>
                    <p className="text-sm text-muted-foreground">No date/time selected</p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Send Button */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Preview Button */}
                <Button
                  onClick={() => setShowPreview(true)}
                  variant="outline"
                  className="w-full"
                  disabled={!selectedCampaign}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Email
                </Button>

                {/* Send Button */}
                <Button
                  onClick={sendCampaign}
                  disabled={
                    !selectedCampaign ||
                    !editedSubject.trim() ||
                    !editedSenderName.trim() ||
                    !selectedCampaign.content ||
                    (!sendToAll && selectedContacts.length === 0 && selectedGroups.length === 0 && individualEmails.length === 0) ||
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
                        sendToAll ? "All Contacts" : `${selectedContacts.length + individualEmails.length + selectedGroups.length} Recipient${(selectedContacts.length + individualEmails.length + selectedGroups.length) > 1 ? 's' : ''}`
                      }
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Email Preview</CardTitle>
                <p className="text-sm text-muted-foreground">{selectedCampaign.title}</p>
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
                  <p className="text-sm">{editedSubject}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">From:</Label>
                  <p className="text-sm">{editedSenderName} &lt;campaigns@2bentrods.com.au&gt;</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">HTML Content Preview:</Label>
                  <div
                    className="border rounded p-4 max-h-96 overflow-y-auto email-preview-wrapper"
                    dangerouslySetInnerHTML={{ __html: selectedCampaign.content || "" }}
                    style={{
                      backgroundColor: 'var(--background)',
                      color: 'var(--foreground)'
                    }}
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
