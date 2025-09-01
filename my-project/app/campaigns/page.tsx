"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Filter, Plus, ArrowUpDown, Calendar } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import { Edit, X, Eye, Send, Archive, Tag, FileText } from "lucide-react";
import EmailEditor, { EditorRef, EmailEditorProps } from "react-email-editor";

type Campaign = {
  id: string;
  title: string;
  date: string;
  type: "workshop" | "event" | "community" | "special";
  status: "draft" | "scheduled" | "sent" | "archived"; // Add status
  targetGroups?: string[]; // Which contact groups to send to
  content?: string; // Email content/template
};

const CAMPAIGN_TYPES = [
  { label: "Workshop", value: "workshop" },
  { label: "Event", value: "event" },
  { label: "Community", value: "community" },
  { label: "Special", value: "special" },
];

// Fetch campaigns from backend

export default function Campaigns() {
  const [filter, setFilter] = useState("");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"date" | "type">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showEditor, setShowEditor] = useState(false);
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
    targetGroups: string[]; // <-- Fix: use string[] instead of never[]
  }>({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    type: 'event',
    status: 'draft',
    targetGroups: [],
  });
  const editorRef = useRef<EditorRef>(null);
  const emailEditorRef = useRef<EditorRef>(null);


  useEffect(() => {
    setMounted(true);
    // Fetch campaigns from backend
    fetch("/api/campaigns")
      .then((res) => res.json())
      .then((data) => {
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
            }))
          );
        }
      });
  }, []);

  const handleTypeChange = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSort = (field: "date" | "type") => {
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
      const compareValue = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "date") {
        return a.date > b.date ? compareValue : -compareValue;
      }
      return a.type > b.type ? compareValue : -compareValue;
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
      type: 'event',
      status: 'draft',
      targetGroups: [],
    });
  };

  const handleNewCampaignFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedCampaign({
      id: '',
      ...newCampaignData,
      content: '',
    });
    setEmailDesign(null);
    setIsNewCampaign(true);
    setShowEditor(true);
    setShowNewCampaignForm(false);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setSelectedCampaign(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const saveEmailDesign = () => {
    const unlayer = emailEditorRef.current?.editor;

    unlayer?.saveDesign((design: any) => {
      setEmailDesign(design);
      unlayer.exportHtml(async (data: any) => {
        const { html } = data;
        if (selectedCampaign) {
          try {
            let res;
            if (isNewCampaign) {
              // Create new campaign
              res = await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: selectedCampaign.title,
                  date: selectedCampaign.date,
                  type: selectedCampaign.type,
                  status: selectedCampaign.status,
                  targetGroups: selectedCampaign.targetGroups || [],
                  content: html,
                  design: design,
                }),
              });
            } else {
              // Update existing campaign
              res = await fetch(`/api/campaigns/${selectedCampaign.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: selectedCampaign.title,
                  date: selectedCampaign.date,
                  type: selectedCampaign.type,
                  status: selectedCampaign.status,
                  targetGroups: selectedCampaign.targetGroups || [],
                  content: html,
                  design: design,
                }),
              });
            }
            if (!res.ok) {
              throw new Error('Failed to save campaign');
            }
            alert('Campaign saved successfully!');
            setShowEditor(false);
            setSelectedCampaign(null);
            setIsNewCampaign(false);
          } catch (err) {
            alert('Error saving campaign: ' + (err instanceof Error ? err.message : err));
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

  return (
    <div className="min-h-screen w-full p-8 sm:p-20">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-[var(--foreground)]">
          Email Campaigns
        </h1>
      </header>

      <div className="max-w-full mx-auto space-y-4">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--foreground)]" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-10 pr-12 p-4 border border-[var(--border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-[var(--background)] text-[var(--foreground)]"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 bg-background hover:bg-[var(--accent)] rounded-md">
                <Filter className="h-5 w-5 text-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <div className="space-y-2">
                {CAMPAIGN_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center space-x-2 p-2 hover:bg-[var(--accent)] rounded-md cursor-pointer"
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
            <span className="text-sm text-[var(--foreground)]">Sort by:</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("type")}
                className={`${
                  sortBy === "type"
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                }`}
              >
                Type{" "}
                {sortBy === "type" && <ArrowUpDown className="ml-1 h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("date")}
                className={`${
                  sortBy === "date"
                    ? "bg-[var(--accent)] text-[var,--accent-foreground)]"
                    : "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                }`}
              >
                Date{" "}
                {sortBy === "date" && <ArrowUpDown className="ml-1 h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button className="flex-1 sm:flex-none" onClick={handleNewCampaign}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>

        <div className="bg-[var(--background)] rounded-lg shadow overflow-hidden">
          <div className="min-w-full">
            <div className="divide-y divide-[var(--border)]">
              {filteredCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-4 hover:bg-[var(--accent)] transition-colors cursor-pointer"
                  onClick={() => handleCampaignClick(campaign)}
                >
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center mr-4">
                      <span className="text-lg font-semibold text-[var(--accent-foreground)]">
                        {campaign.title.charAt(0)}
                      </span>
                    </div>
                    <div className="flex flex-col flex-1">
                      <h4 className="font-medium text-[var(--foreground)]">
                        {campaign.title}
                      </h4>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="text-sm text-[var(--foreground)] flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {mounted ? new Date(campaign.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }) : campaign.date}
                        </div>
                        <span className="text-sm text-accent-foreground bg-accent rounded-md px-2 py-1">
                          {getTypeLabel(campaign.type)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(campaign.status)}`}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Details Dialog */}
      {showDetailsDialog && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            {/* Header */}
            <div className="flex justify-between items-start p-6 border-b">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center">
                  <span className="text-xl font-semibold text-[var(--accent-foreground)]">
                    {selectedCampaign.title.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedCampaign.title}</h2>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Campaign Date</p>
                      <p className="text-sm text-gray-600">
                        {mounted ? new Date(selectedCampaign.date).toLocaleDateString("en-GB", {
                          weekday: 'long',
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        }) : selectedCampaign.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Campaign Type</p>
                      <p className="text-sm text-gray-600">{getTypeLabel(selectedCampaign.type)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Send className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Target Groups</p>
                      <p className="text-sm text-gray-600">
                        {selectedCampaign.targetGroups?.join(', ') || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Campaign ID</p>
                      <p className="text-sm text-gray-600">#{selectedCampaign.id}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Content Preview */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Email Content Preview</h3>
                <div className="bg-gray-50 rounded-lg p-4 min-h-32">
                  {selectedCampaign.content ? (
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedCampaign.content}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No content available</p>
                      <p className="text-xs">Click "Edit Campaign" to add content</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center p-6 border-t bg-gray-50">
              <div className="flex gap-2">
                {selectedCampaign.status === 'draft' && (
                  <Button variant="outline" size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                )}
                {selectedCampaign.status !== 'archived' && (
                  <Button variant="outline" size="sm">
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
                <Button onClick={handleEditClick} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Campaign
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Campaign Form Dialog */}
      {showNewCampaignForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8 border border-[var(--border)]">
            <h2 className="text-3xl font-bold mb-6 text-center text-[var(--foreground)]">Create New Campaign</h2>
            <form onSubmit={handleNewCampaignFormSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--foreground)]">Title</label>
                <input
                  className="w-full border border-[var(--border)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] text-[var(--foreground)]"
                  value={newCampaignData.title}
                  onChange={e => setNewCampaignData(d => ({ ...d, title: e.target.value }))}
                  required
                  placeholder="Campaign Title"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2 text-[var(--foreground)]">Date</label>
                  <input
                    type="date"
                    className="w-full border border-[var(--border)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] text-[var(--foreground)]"
                    value={newCampaignData.date}
                    onChange={e => setNewCampaignData(d => ({ ...d, date: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2 text-[var(--foreground)]">Type</label>
                  <select
                    className="w-full border border-[var(--border)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] text-[var(--foreground)]"
                    value={newCampaignData.type}
                    onChange={e => setNewCampaignData(d => ({ ...d, type: e.target.value as Campaign["type"] }))}
                  >
                    {CAMPAIGN_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2 text-[var(--foreground)]">Status</label>
                  <select
                    className="w-full border border-[var(--border)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] text-[var(--foreground)]"
                    value={newCampaignData.status}
                    onChange={e => setNewCampaignData(d => ({ ...d, status: e.target.value as Campaign["status"] }))}
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="sent">Sent</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2 text-[var(--foreground)]">Target Groups</label>
                  <input
                    className="w-full border border-[var(--border)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] text-[var(--foreground)]"
                    value={newCampaignData.targetGroups.join(",")}
                    onChange={e => setNewCampaignData(d => ({
                      ...d,
                      targetGroups: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
                    }))}
                    placeholder="e.g. Companies, Groups"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition" onClick={() => setShowNewCampaignForm(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Continue</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Editor Dialog */}
      {showEditor && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center p-6 border-b border-[var(--border)] bg-white dark:bg-gray-900 z-10">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                {isNewCampaign ? 'Create Campaign' : `Edit Campaign: ${selectedCampaign.title}`}
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Design your email campaign using the drag-and-drop editor
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCloseEditor}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Editor - Responsive and centered */}
          <div className="w-full max-w-5xl mx-auto flex-1 flex flex-col min-h-[60vh]" style={{ minHeight: '60vh' }}>
            <EmailEditor
              ref={emailEditorRef}
              onReady={onEmailEditorReady}
              options={{
                appearance: {
                  theme: 'light',
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
              style={{ height: '60vh', width: '100%' }}
            />
          </div>

          {/* Footer */}
          <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center p-6 border-t border-[var(--border)] bg-gray-50 dark:bg-gray-800 z-10 gap-4">
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
              <Button 
                onClick={saveEmailDesign}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                Save Campaign
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
