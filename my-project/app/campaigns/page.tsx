"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Filter, Plus, ArrowUpDown } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import { Edit, X, Eye, Send, Archive, Tag, FileText, Save, CheckCircle, Copy, Loader } from "lucide-react";
import EmailEditor, { EditorRef, EmailEditorProps } from "react-email-editor";
import { useRouter } from "next/navigation";
import ConfirmationDialog from "@/app/components/ConfirmationDialog";

type Campaign = {
  id: string;
  title: string;
  date: string;
  type: "app" | "classes" | "fishing_comps" | "oshc_vacation_care" | "promotion" | "other";
  status: "draft" | "scheduled" | "finalized" | "sent" | "archived";
  targetGroups?: string[]; // Which contact groups to send to
  content?: string; // Email content/template
  design?: any; // Email editor design object
  createdAt?: string;
  updatedAt?: string;
};

const CAMPAIGN_TYPES = [
  { label: "App", value: "app" },
  { label: "Classes", value: "classes" },
  { label: "Fishing Comps", value: "fishing_comps" },
  { label: "OSHC/Vacation Care", value: "oshc_vacation_care" },
  { label: "Promotion", value: "promotion" },
  { label: "Other", value: "other" },
];

// Fetch campaigns from backend

export default function Campaigns() {
  const router = useRouter();
  const { theme } = useTheme();
  const [filter, setFilter] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templatesList, setTemplatesList] = useState<any[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"type" | "updatedAt" | "createdAt">("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [emailEditorLoaded, setEmailEditorLoaded] = useState(false);
  const [emailDesign, setEmailDesign] = useState<any>(null);
  const [isNewCampaign, setIsNewCampaign] = useState(false);
  const [showNewCampaignForm, setShowNewCampaignForm] = useState(false);
  const [newCampaignData, setNewCampaignData] = useState<{
    title: string;
    date: string;
    type: string;
    status: string;
    targetGroups: string[];
    templateId?: string;
  }>({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    type: 'app',
    status: 'draft',
    targetGroups: [],
    templateId: '',
  });
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [recipientType, setRecipientType] = useState("all");
  const [email, setEmail] = useState("");
  const [group, setGroup] = useState("");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const groups = ["Companies", "Private", "Groups", "OSHC", "Schools"];
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string|null>(null);
  const editorRef = useRef<EditorRef>(null);
  const emailEditorRef = useRef<EditorRef>(null);


  useEffect(() => {
    setMounted(true);
    // Fetch campaigns from backend
    fetchCampaigns();

    // Fetch templates from backend
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.templates)) {
          setTemplatesList(data.templates);
        }
      })
      .catch((err) => console.error("Failed to fetch templates:", err));
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      if (Array.isArray(data.campaigns)) {
        setCampaigns(
          data.campaigns.map((c: any) => ({
            id: String(c.id),
            title: c.title,
            date: c.date,
            type: c.type,
            status: c.status,
            targetGroups: c.target_groups ? c.target_groups.split(",") : [],
            content: c.content,
            createdAt: c.created_at || c.createdAt,
            updatedAt: c.updated_at || c.updatedAt,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    }
  };

  const duplicateCampaign = async (campaignId: string, defaultTitle: string) => {
    setIsDuplicating(true);
    try {
      const newTitle = `${defaultTitle} (Copy)`;
      const res = await fetch(`/api/campaigns/${campaignId}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to duplicate campaign");
      }
      await fetchCampaigns();
      setNotification({ message: "Campaign duplicated successfully", type: "success" });
    } catch (e: any) {
      setNotification({ message: e.message || "Failed to duplicate campaign", type: "error" });
    } finally {
      setIsDuplicating(false);
    }
  };

  const saveCampaignAsTemplate = async (campaignId: string, defaultName: string) => {
    try {
      // Fetch full campaign to get design
      const resCampaign = await fetch(`/api/campaigns/${campaignId}`);
      if (!resCampaign.ok) throw new Error("Failed to load campaign");
      const { campaign } = await resCampaign.json();
      const designRaw = campaign?.design;
      const design = typeof designRaw === "string" ? JSON.parse(designRaw) : designRaw;
      if (!design) throw new Error("This campaign has no design to save as a template");

      const name = defaultName;
      const subject = defaultName;

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject, design })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save template");
      }
      setNotification({ message: "Saved as template successfully", type: "success" });
    } catch (e: any) {
      setNotification({ message: e.message || "Failed to save as template", type: "error" });
    }
  };

  const handleTypeChange = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSort = (field: "type" | "createdAt" | "updatedAt") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const filteredCampaigns = campaigns
    .filter(
      (c) =>
        (selectedTypes.length === 0 || selectedTypes.includes(c.type)) &&
        c.title.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      const direction = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "type") {
        return a.type > b.type ? direction : a.type < b.type ? -direction : 0;
      }
      // no generic date sort; use updatedAt instead
      // sortBy === 'updatedAt'
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      if (aTime === bTime) return 0;
      return aTime > bTime ? direction : -direction;
    });

  const getTypeLabel = (type: string) => {
    return CAMPAIGN_TYPES.find((t) => t.value === type)?.label || type;
  };

  const handleCampaignClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowDetailsDialog(true);
  };

  const handleEditClick = () => {
    setShowDetailsDialog(false);
    setIsNewCampaign(false);
    setShowEditor(true);
  };

  const handleNewCampaign = () => {
    setShowNewCampaignForm(true);
    setNewCampaignData({
      title: '',
      date: new Date().toISOString().slice(0, 10),
      type: 'app',
      status: 'draft',
      targetGroups: [],
    });
  };

  const handleNewCampaignFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedCampaign({
      id: '',
      ...newCampaignData,
      type: newCampaignData.type as Campaign["type"],
      status: newCampaignData.status as Campaign["status"],
      content: '',
    });
    setEmailDesign(null);
    setIsNewCampaign(true);
    setShowEditor(true);
    setShowNewCampaignForm(false);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    // Don't reset selectedCampaign to keep the builder state
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "scheduled":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
      case "finalized":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
      case "sent":
        return "bg-muted text-muted-foreground";
      case "archived":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    if (!dateString) return '';
    
    // Database time is already in Sydney timezone
    const dbDate = new Date(dateString);
    
    // Convert current user time to Sydney timezone for accurate comparison
    const now = new Date();
    const sydneyTime = new Date(now.toLocaleString("en-US", { timeZone: "Australia/Sydney" }));
    
    // Calculate difference (Sydney time - Sydney time)
    const diffInMs = sydneyTime.getTime() - dbDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return `${diffInDays} days ago`;
    }
  };

  const saveEmailDesign = async (status: "draft" | "finalized") => {
    const unlayer = emailEditorRef.current?.editor;

    // Validation for finalization
    if (status === "finalized") {
      if (!selectedCampaign?.title?.trim()) {
        setNotification({ message: "Error: Campaign title is required before finalizing", type: "error" });
        return;
      }
    }

    unlayer?.saveDesign((design: any) => {
      setEmailDesign(design);
      unlayer.exportHtml(async (data: any) => {
        const { html } = data;
        
        // Additional validation for finalization
        if (status === "finalized" && (!html?.trim() || html === '<div></div>' || !design)) {
          setNotification({ message: "Error: Campaign must have content before finalizing. Please create content using the editor first.", type: "error" });
          return;
        }
        
        if (selectedCampaign) {
          try {
            const campaignData = {
              title: selectedCampaign.title,
              date: selectedCampaign.date,
              type: selectedCampaign.type,
              status: status,
              targetGroups: selectedCampaign.targetGroups || [],
              content: html,
              design: design,
            };

            let res;
            if (isNewCampaign || !selectedCampaign.id) {
              // Create new campaign
              res = await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(campaignData),
              });
              const result = await res.json();
              // Update local state with new ID, content, and design
              setSelectedCampaign(prev => prev ? ({ ...prev, id: result.id || '', content: html, design }) : null);
            } else {
              // Update existing campaign
              res = await fetch(`/api/campaigns/${selectedCampaign.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(campaignData),
              });
            }
            
            if (!res.ok) {
              throw new Error('Failed to save campaign');
            }
            
            const result = await res.json();
            const action = status === "draft" ? "saved as draft" : "finalized";
            setNotification({ message: `Campaign ${action} successfully!`, type: "success" });
            
            // Update the selected campaign with the new ID if it was created
            if (isNewCampaign && result.id) {
              setSelectedCampaign(prev => prev ? ({ ...prev, id: result.id, status, content: html, design }) : null);
              setIsNewCampaign(false);
            } else {
              setSelectedCampaign(prev => prev ? ({ ...prev, status, content: html, design }) : null);
            }
            
            // Refresh campaigns list from backend to ensure consistency
            await fetchCampaigns();
            
            // Close editor after successful finalization
            if (status === "finalized") {
              setShowEditor(false);
            }
          } catch (err) {
            setNotification({ message: 'Error saving campaign: ' + (err instanceof Error ? err.message : err), type: "error" });
          }
        }
      });
    });
  };

  const loadEmailDesign = () => {
    const unlayer = emailEditorRef.current?.editor;

    if (emailDesign) {
      unlayer?.loadDesign(emailDesign);
    } else if (selectedCampaign?.content) {
      // If you have existing HTML content, you can load it
      // For now, we'll start with a blank template
      // Use a valid empty design object for Unlayer
      unlayer?.loadDesign({
        counters: {},
        body: {
          id: '',
          rows: [],
          headers: [],
          footers: [],
          values: {}
        }
      });
    }
  };

  const onEmailEditorReady = () => {
    setEmailEditorLoaded(true);
    loadEmailDesign();
  };

  const deleteCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove campaign from the list
        setCampaigns(prev => prev.filter(c => c.id !== campaignId));
        setShowDetailsDialog(false);
        setSelectedCampaign(null);
        // Refresh the campaigns list to update status
        fetchCampaigns();
      } else {
        console.error('Failed to delete campaign');
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const showDeleteConfirmation = (campaignId: string, campaignTitle: string) => {
    setConfirmationData({
      title: "Delete Campaign",
      message: `Are you sure you want to delete "${campaignTitle}"? This action cannot be undone.`,
      onConfirm: () => {
        deleteCampaign(campaignId);
        setShowConfirmationDialog(false);
        setConfirmationData(null);
      }
    });
    setShowConfirmationDialog(true);
  };

  async function handleScheduleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setScheduleError(null);

    if (!selectedCampaignId) {
      setScheduleError("Please select a campaign.");
      return;
    }
    if (!scheduleDate) {
      setScheduleError("Please select a date.");
      return;
    }
    
    // Validate the scheduled time is in the future
    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime || '09:00'}:00`);
    const now = new Date();
    const minScheduleTime = new Date(now.getTime() + 60 * 1000); // 1 minute buffer
    
    if (isNaN(scheduledDateTime.getTime())) {
      setScheduleError("Invalid date or time format.");
      return;
    }
    
    if (scheduledDateTime <= minScheduleTime) {
      setScheduleError("Scheduled time must be at least 1 minute in the future.");
      return;
    }
    if (recipientType === "email" && !email) {
      setScheduleError("Please enter a recipient email.");
      return;
    }
    if (recipientType === "group" && !group) {
      setScheduleError("Please select a group.");
      return;
    }

    setScheduling(true);

    try {
      // First, ensure the campaign exists and is saved
      const campaign = campaigns.find(c => c.id === selectedCampaignId);
      if (!campaign) {
        throw new Error("Campaign not found");
      }

      // Update campaign status to draft (scheduling is separate)
      const campaignResponse = await fetch(`/api/campaigns/${selectedCampaignId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...campaign,
          status: "draft" // Keep as draft, scheduling is separate
        }),
      });

      if (!campaignResponse.ok) {
        throw new Error("Failed to update campaign");
      }

      // Create scheduled datetime with proper timezone handling
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime || '09:00'}:00`).toISOString();
      
      // Debug logging
      console.log('Scheduling details:', {
        scheduleDate,
        scheduleTime,
        scheduledAt,
        now: new Date().toISOString(),
        localTime: new Date(`${scheduleDate}T${scheduleTime || '09:00'}:00`).toString()
      });
      
      // Create the schedule entry
      const scheduleResponse = await fetch(`/api/email-schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: selectedCampaignId,
          scheduledAt,
          recipientType,
          recipientEmail: recipientType === "email" ? email : null,
          recipientGroup: recipientType === "group" ? group : null,
        }),
      });

      if (!scheduleResponse.ok) {
        const data = await scheduleResponse.json().catch(() => ({}));
        console.error('Schedule API error:', {
          status: scheduleResponse.status,
          error: data.error,
          scheduledAt,
          requestBody: {
            campaignId: selectedCampaignId,
            scheduledAt,
            recipientType,
            recipientEmail: recipientType === "email" ? email : null,
            recipientGroup: recipientType === "group" ? group : null,
          }
        });
        throw new Error(data.error || `Failed to schedule campaign (${scheduleResponse.status})`);
      }

      // Update campaign status in UI to show it's scheduled
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === selectedCampaignId
            ? { ...c, status: "scheduled" }
            : c
        )
      );

      setShowScheduleDialog(false);
      setScheduleDate("");
      setScheduleTime("");
      setRecipientType("all");
      setEmail("");
      setGroup("");
      setSelectedCampaignId("");
      setScheduling(false);
      setNotification({ message: "Campaign scheduled successfully!", type: "success" });
    } catch (err: any) {
      setScheduleError(err.message || "Failed to schedule campaign");
      setScheduling(false);
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border pb-4 mb-6">
        <header className="mb-4">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-foreground">
            Email Campaigns
          </h1>
        </header>

        {notification && (
          <div
            className={`mb-4 rounded-md p-3 text-sm ${
              notification.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-100 dark:border-green-800'
                : notification.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/20 dark:text-red-100 dark:border-red-800'
                : 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-100 dark:border-blue-800'
            }`}
            role="status"
            aria-live="polite"
          >
            {notification.message}
          </div>
        )}

        <div className="space-y-4">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-foreground" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-10 pr-12 p-4 border border-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 bg-card hover:bg-accent rounded-md">
                <Filter className="h-5 w-5 text-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <div className="space-y-2">
                {CAMPAIGN_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type.value)}
                      onChange={() => handleTypeChange(type.value)}
                      className="accent-[var(--primary)]"
                    />
                    <span className="text-foreground">{type.label}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">Sort by:</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("type")}
                className={`${
                  sortBy === "type"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                Type{" "}
                {sortBy === "type" && <ArrowUpDown className="ml-1 h-4 w-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("updatedAt")}
                className={`${
                  sortBy === "updatedAt"
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
                title="Sort by updated date"
                aria-label="Sort by updated date"
              >
                Last Updated {sortBy === "updatedAt" && <ArrowUpDown className="ml-1 h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1 sm:flex-none" 
              onClick={() => router.push('/campaigns/builder')}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>
        </div>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-background rounded-lg shadow-md border border-border hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleCampaignClick(campaign)}
            >
              {/* Preview Section */}
              <div className="h-48 bg-muted rounded-t-lg overflow-hidden">
                {campaign.content ? (
                  <div 
                    className="h-full w-full p-4 text-xs overflow-hidden email-preview-wrapper"
                    dangerouslySetInnerHTML={{ __html: campaign.content }}
                    style={{ 
                      transform: 'scale(0.3)', 
                      transformOrigin: 'top left',
                      width: '333%',
                      height: '333%',
                      backgroundColor: 'var(--background)',
                      color: 'var(--foreground)'
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No preview available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-foreground text-lg truncate flex-1">
                    {campaign.title}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ml-2 ${getStatusColor(campaign.status || 'draft')}`}>
                    {(campaign.status || 'draft').charAt(0).toUpperCase() + (campaign.status || 'draft').slice(1)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-accent-foreground bg-accent rounded-md px-2 py-1">
                    {getTypeLabel(campaign.type)}
                  </span>
                </div>

                {campaign.updatedAt && (
                  <div className="text-xs text-muted-foreground mb-3">
                    <span>
                      Updated: {formatTimeAgo(campaign.updatedAt)}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRedirecting(true);
                      router.push(`/campaigns/builder?id=${campaign.id}`);
                    }}
                    disabled={campaign.status === 'sent' || campaign.status === 'archived' || isRedirecting}
                    title={campaign.status === 'finalized' ? 'View campaign (read-only)' : campaign.status === 'sent' || campaign.status === 'archived' ? 'Cannot edit sent or archived campaigns' : 'Edit campaign'}
                  >
                    {isRedirecting ? (
                      <Loader className="h-4 w-4 mr-1 animate-spin" />
                    ) : campaign.status === 'finalized' ? (
                      <Eye className="h-4 w-4 mr-1" />
                    ) : (
                      <Edit className="h-4 w-4 mr-1" />
                    )}
                    {campaign.status === 'finalized' ? 'View' : 'Edit'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      duplicateCampaign(campaign.id, campaign.title);
                    }}
                    title="Duplicate campaign"
                    disabled={isDuplicating}
                  >
                    {isDuplicating ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      saveCampaignAsTemplate(campaign.id, campaign.title);
                    }}
                    title="Save as template"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/send-email?campaignId=${campaign.id}`);
                      }}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Campaign Details Dialog */}
      {showDetailsDialog && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            {/* Header */}
            <div className="flex justify-between items-start p-6 border-b">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                  <span className="text-xl font-semibold text-accent-foreground">
                    {selectedCampaign.title.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{selectedCampaign.title}</h2>
                  <span className={`inline-block text-xs px-3 py-1 rounded-full mt-1 ${getStatusColor(selectedCampaign.status)}`}>
                    {selectedCampaign.status.charAt(0).toUpperCase() + selectedCampaign.status.slice(1)}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetailsDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Campaign Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">Campaign Type</p>
                    <p className="text-sm text-muted-foreground">{getTypeLabel(selectedCampaign.type)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Send className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">Target Groups</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCampaign.targetGroups?.join(', ') || 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Email Content Preview */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Email Content Preview</h3>
                <div className="bg-muted rounded-lg p-4 min-h-32">
                  {selectedCampaign.content ? (
                    <div 
                      className="text-sm email-preview-wrapper"
                      dangerouslySetInnerHTML={{ __html: selectedCampaign.content }}
                      style={{
                        backgroundColor: 'var(--background)',
                        color: 'var(--foreground)',
                        padding: '1rem',
                        borderRadius: '0.375rem'
                      }}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No content available</p>
                      <p className="text-xs">Click "View Campaign" to see content</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center p-6 border-t bg-muted">
              <div className="flex gap-2">
                {(selectedCampaign.status === 'draft' || selectedCampaign.status === 'scheduled') && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      router.push(`/send-email?campaignId=${selectedCampaign.id}`);
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Schedule Email
                  </Button>
                )}
                 {selectedCampaign.status !== 'archived' && (
                   <Button 
                     variant="outline" 
                     size="sm"
                     onClick={() => showDeleteConfirmation(selectedCampaign.id, selectedCampaign.title)}
                     className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                   >
                     <X className="h-4 w-4 mr-2" />
                     Delete
                   </Button>
                 )}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    setShowDetailsDialog(false);
                    setIsRedirecting(true);
                    router.push(`/campaigns/builder?id=${selectedCampaign.id}`);
                  }} 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={selectedCampaign.status === 'sent' || selectedCampaign.status === 'archived' || isRedirecting}
                  title={selectedCampaign.status === 'finalized' ? 'View campaign (read-only)' : selectedCampaign.status === 'sent' || selectedCampaign.status === 'archived' ? 'Cannot edit sent or archived campaigns' : 'Edit campaign'}
                >
                  {isRedirecting ? (
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                  ) : selectedCampaign.status === 'finalized' ? (
                    <Eye className="h-4 w-4 mr-2" />
                  ) : (
                    <Edit className="h-4 w-4 mr-2" />
                  )}
                  {selectedCampaign.status === 'finalized' ? 'View Campaign' : 'Edit Campaign'}
                </Button>
              </div>
            </div>
          </div>
         </div>
       )}

      {/* Confirmation Dialog */}
      {showConfirmationDialog && confirmationData && (
        <ConfirmationDialog
          isOpen={showConfirmationDialog}
          title={confirmationData.title}
          message={confirmationData.message}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmationData.onConfirm}
          onCancel={() => {
            setShowConfirmationDialog(false);
            setConfirmationData(null);
          }}
          variant="danger"
        />
      )}

      {/* Schedule Email Dialog (always rendered at root) */}
      {showScheduleDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form onSubmit={handleScheduleSubmit} className="bg-card rounded-lg shadow-lg max-w-md w-full p-6 relative space-y-4 border border-border">
            <button type="button" className="absolute top-2 right-2 text-muted-foreground hover:text-foreground" onClick={() => setShowScheduleDialog(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-2 text-foreground">Schedule Email</h2>
            <div>
              <label className="block text-sm font-semibold mb-1">Campaign</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={selectedCampaignId}
                onChange={e => setSelectedCampaignId(e.target.value)}
                required
                aria-label="Select campaign"
              >
                <option value="">Select a campaign</option>
                {campaigns.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Recipient</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={recipientType}
                onChange={e => setRecipientType(e.target.value)}
                aria-label="Select recipient type"
              >
                <option value="all">All</option>
                <option value="group">Group</option>
                <option value="email">Email</option>
              </select>
              {recipientType === "email" && (
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2 mt-2"
                  placeholder="Recipient email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  aria-label="Recipient email address"
                />
              )}
              {recipientType === "group" && (
                <select
                  className="w-full border rounded px-3 py-2 mt-2"
                  value={group}
                  onChange={e => setGroup(e.target.value)}
                  required
                  aria-label="Select group"
                >
                  <option value="">Select group</option>
                  {groups.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
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
                  aria-label="Schedule date"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1">Time</label>
                <input
                  type="time"
                  className="w-full border rounded px-3 py-2"
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                  aria-label="Schedule time"
                />
              </div>
            </div>
            {scheduleError && <div className="text-destructive text-sm">{scheduleError}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="px-4 py-2 rounded bg-muted text-foreground font-semibold hover:bg-muted/80" onClick={() => setShowScheduleDialog(false)}>Cancel</button>
              <button type="submit" className="px-4 py-2 rounded bg-primary text-primary-foreground font-semibold hover:bg-primary/90" disabled={scheduling}>
                {scheduling ? "Scheduling..." : "Schedule"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* New Campaign Form Dialog */}
      {showNewCampaignForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8 border border-border">
            <h2 className="text-3xl font-bold mb-6 text-center text-card-foreground">Create New Campaign</h2>
            <form onSubmit={handleNewCampaignFormSubmit} className="space-y-6">
              {/* Optional template selection */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-card-foreground">Template (optional)</label>
                <select
                  className="w-full border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-card text-card-foreground"
                  value={newCampaignData.templateId || ''}
                  onChange={async e => {
                    const templateId = e.target.value;
                    if (!templateId) {
                      setNewCampaignData(d => ({ ...d, templateId: '', title: '', }));
                      setEmailDesign(null);
                      return;
                    }
                    const template = templatesList.find((t: any) => String(t.id) === String(templateId));
                    if (template) {
                      setNewCampaignData(d => ({
                        ...d,
                        templateId,
                        title: template.name || '',
                      }));
                      setEmailDesign(template.design ? JSON.parse(template.design) : null);
                    }
                  }}
                  title="Template (optional)"
                  aria-label="Template (optional)"
                >
                  <option value="">No template</option>
                  {templatesList.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              {/* ...existing code for title, date, type, status, target groups... */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-foreground">Title</label>
                <input
                  className="w-full border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  value={newCampaignData.title}
                  onChange={e => setNewCampaignData(d => ({ ...d, title: e.target.value }))}
                  required
                  placeholder="Campaign Title"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2 text-foreground">Date</label>
                  <input
                    type="date"
                    className="w-full border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    value={newCampaignData.date}
                    onChange={e => setNewCampaignData(d => ({ ...d, date: e.target.value }))}
                    required
                    aria-label="Campaign date"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2 text-foreground">Type</label>
                  <select
                    className="w-full border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    value={newCampaignData.type}
                    onChange={e => setNewCampaignData(d => ({ ...d, type: e.target.value as Campaign["type"] }))}
                    aria-label="Campaign type"
                    title="Campaign type"
                  >
                    {CAMPAIGN_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2 text-foreground">Status</label>
                  <select
                    className="w-full border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    value={newCampaignData.status}
                    onChange={e => setNewCampaignData(d => ({ ...d, status: e.target.value as Campaign["status"] }))}
                    aria-label="Campaign status"
                    title="Campaign status"
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="finalized">Finalized</option>
                    <option value="sent">Sent</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2 text-foreground">Target Groups</label>
                  <input
                    className="w-full border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                    value={newCampaignData.targetGroups.join(",")}
                    onChange={e => setNewCampaignData(d => ({
                      ...d,
                      targetGroups: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
                    }))}
                    placeholder="e.g. Companies, Groups"
                    aria-label="Target groups"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="px-5 py-2 rounded-lg bg-muted text-foreground font-semibold hover:bg-muted/80 transition" onClick={() => setShowNewCampaignForm(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition">Continue</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Editor Dialog */}
      {showEditor && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center p-6 border-b border-border bg-background z-10">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                {isNewCampaign ? 'Create Campaign' : selectedCampaign.status === 'finalized' ? `View Campaign: ${selectedCampaign.title}` : `Edit Campaign: ${selectedCampaign.title}`}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedCampaign.status === 'finalized' ? 'View your email campaign design (read-only)' : 'Design your email campaign using the drag-and-drop editor'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCloseEditor}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Editor - Fullscreen */}
          <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
            <EmailEditor
              ref={emailEditorRef}
              onReady={onEmailEditorReady}
              options={{
                appearance: {
                  theme: theme === 'dark' ? 'dark' : 'light',
                  panels: {
                    tools: {
                      dock: 'left'
                    }
                  }
                },
                projectId: 1234,
                locale: 'en-US',
                features: {
                  preview: true,
                  stockImages: true
                }
              }}
              style={{ flex: 1, width: '100%', height: '100%' }}
            />
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center p-6 border-t border-border bg-muted z-10 gap-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  const unlayer = emailEditorRef.current?.editor;
                  unlayer?.showPreview({ device: 'desktop' });
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  const unlayer = emailEditorRef.current?.editor;
                  unlayer?.exportHtml((data: any) => {
                    const { html } = data;
                    const blob = new Blob([html], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${selectedCampaign.title}.html`;
                    a.click();
                  });
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export HTML
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCloseEditor}>
                Cancel
              </Button>
              {selectedCampaign.status !== "finalized" && (
                <Button 
                  onClick={() => saveEmailDesign("draft")}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
              )}
              {selectedCampaign.status !== "finalized" && (
                <Button 
                  onClick={() => saveEmailDesign("finalized")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  title="Finalize campaign"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Finalize Campaign
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global Loading Overlay for Redirects */}
      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-lg shadow-lg p-6 flex items-center gap-3">
            <Loader className="h-6 w-6 animate-spin text-primary" />
            <span className="text-lg font-medium text-card-foreground">Redirecting...</span>
          </div>
        </div>
      )}
    </div>
  );
}