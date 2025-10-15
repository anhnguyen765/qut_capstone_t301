
"use client";
// Copied and adapted from campaigns page for newsletters
import { useState, useEffect, useRef } from "react";
import { Search, Filter, Plus, ArrowUpDown, Calendar } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import { Edit, X, Eye, Send, Archive, Tag, FileText, Save, CheckCircle } from "lucide-react";
import EmailEditor, { EditorRef } from "react-email-editor";
import { useRouter } from "next/navigation";
import ConfirmationDialog from "@/app/components/ConfirmationDialog";

type Newsletter = {
  id: string;
  title: string;
  date: string;
  status: "draft" | "finalised" | "scheduled" | "sent" | "archived";
  content?: string;
  design?: any;
};

const STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Finalised", value: "finalised" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Sent", value: "sent" },
  { label: "Archived", value: "archived" },
];

export default function Newsletters() {
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"status">("status");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);
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
  const [isNewNewsletter, setIsNewNewsletter] = useState(false);
  const [showNewNewsletterForm, setShowNewNewsletterForm] = useState(false);
  const [newNewsletterData, setNewNewsletterData] = useState<{
    title: string;
    date: string;
    status: string;
  }>({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'draft',
  });
  const emailEditorRef = useRef<EditorRef>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [calendarLink, setCalendarLink] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Fetch newsletters from backend
    fetch("/api/newsletters")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.newsletters)) {
          setNewsletters(
            data.newsletters.map((n: any) => ({
              id: String(n.id),
              title: n.title,
              date: n.date,
              status: n.status,
              content: n.content,
            }))
          );
        }
      });
  }, []);

  const handleStatusChange = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleSort = (field: "status") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const filteredNewsletters = newsletters
    .filter(
      (n) =>
        (selectedStatuses.length === 0 || selectedStatuses.includes(n.status)) &&
        n.title.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      const compareValue = sortOrder === "asc" ? 1 : -1;
      return a.status > b.status ? compareValue : -compareValue;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "finalised":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "sent":
        return "bg-gray-100 text-gray-800";
      case "archived":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMessageColor = () => {
    switch (messageType) {
      case "success":
        return "border-green-200 bg-green-50";
      case "error":
        return "border-red-200 bg-red-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const handleNewsletterClick = (newsletter: Newsletter) => {
    setSelectedNewsletter(newsletter);
    setShowDetailsDialog(true);
  };

  const handleEditClick = () => {
    setShowDetailsDialog(false);
    setIsNewNewsletter(false);
    setShowEditor(true);
  };

  const handleNewNewsletter = () => {
    setShowNewNewsletterForm(true);
    setNewNewsletterData({
      title: '',
      date: new Date().toISOString().slice(0, 10),
      status: 'draft',
    });
  };

  const handleNewNewsletterFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedNewsletter({
      id: '',
      ...newNewsletterData,
      status: newNewsletterData.status as Newsletter["status"],
      content: '',
    });
    setEmailDesign(null);
    setIsNewNewsletter(true);
    setShowEditor(true);
    setShowNewNewsletterForm(false);
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
  };

  const saveEmailDesign = async (status: "draft" | "finalised") => {
    const unlayer = emailEditorRef.current?.editor;
    unlayer?.saveDesign((design: any) => {
      setEmailDesign(design);
      unlayer.exportHtml(async (data: any) => {
        const { html } = data;
        if (selectedNewsletter) {
          try {
            const newsletterData = {
              title: selectedNewsletter.title,
              date: selectedNewsletter.date,
              status: status,
              content: html,
              design: design,
            };
            let res;
            if (isNewNewsletter || !selectedNewsletter.id) {
              res = await fetch('/api/newsletters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newsletterData),
              });
            } else {
              res = await fetch(`/api/newsletters/${selectedNewsletter.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newsletterData),
              });
            }
            if (!res.ok) throw new Error('Failed to save newsletter');
              const result = await res.json();
              // Show inline message instead of alert and include calendar link when schedule created
              setMessage(`${status === "draft" ? "Newsletter saved as draft" : "Newsletter finalised"} successfully!`);
              setMessageType("success");
              setCalendarLink(null);
              if (result?.scheduleId) {
                setCalendarLink(`/calendar?highlight=${result.scheduleId}`);
                setMessage((m) => `${m} Added to calendar.`);
              }
            if (isNewNewsletter && result.id) {
              setSelectedNewsletter(prev => prev ? ({ ...prev, id: result.id, status }) : null);
              setIsNewNewsletter(false);
            } else {
              setSelectedNewsletter(prev => prev ? ({ ...prev, status }) : null);
            }
            setNewsletters(prev => {
              if (isNewNewsletter && result.id) {
                return [...prev, { ...selectedNewsletter, id: result.id, status }];
              } else {
                return prev.map(n => n.id === selectedNewsletter.id ? { ...n, status } : n);
              }
            });
          } catch (err) {
              const msg = 'Error saving newsletter: ' + (err instanceof Error ? err.message : String(err));
              setMessage(msg);
              setMessageType("error");
              console.error(msg);
          }
        }
      });
    });
  };

  const loadEmailDesign = () => {
    const unlayer = emailEditorRef.current?.editor;
    if (emailDesign) {
      unlayer?.loadDesign(emailDesign);
    } else if (selectedNewsletter?.content) {
      unlayer?.loadDesign({
        counters: {},
        body: { id: '', rows: [], headers: [], footers: [], values: {} }
      });
    }
  };

  const onEmailEditorReady = () => {
    setEmailEditorLoaded(true);
    loadEmailDesign();
  };

  const deleteNewsletter = async (newsletterId: string) => {
    try {
      const response = await fetch(`/api/newsletters/${newsletterId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setNewsletters(prev => prev.filter(n => n.id !== newsletterId));
        setShowDetailsDialog(false);
        setSelectedNewsletter(null);
      } else {
        console.error('Failed to delete newsletter');
      }
    } catch (error) {
      console.error('Error deleting newsletter:', error);
    }
  };

  const showDeleteConfirmation = (newsletterId: string, newsletterTitle: string) => {
    setConfirmationData({
      title: "Delete Newsletter",
      message: `Are you sure you want to delete "${newsletterTitle}"? This action cannot be undone.`,
      onConfirm: () => {
        deleteNewsletter(newsletterId);
        setShowConfirmationDialog(false);
        setConfirmationData(null);
      }
    });
    setShowConfirmationDialog(true);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-[var(--background)] border-b border-[var(--border)] pb-4 mb-6">
        <header className="mb-4">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            Newsletters
          </h1>
        </header>

        <div className="space-y-4">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--foreground)]" />
          <input
            type="text"
            placeholder="Search newsletters..."
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
                {STATUS_OPTIONS.map((status) => (
                  <label
                    key={status.value}
                    className="flex items-center space-x-2 p-2 hover:bg-[var(--accent)] rounded-md cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status.value)}
                      onChange={() => handleStatusChange(status.value)}
                      className="accent-[var(--primary)]"
                    />
                    <span className="text-foreground">{status.label}</span>
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
                onClick={() => handleSort("status")}
                className={`${sortBy === "status" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"}`}
              >
                Status {sortBy === "status" && <ArrowUpDown className="ml-1 h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="flex-1 sm:flex-none" onClick={handleNewNewsletter}>
              <Plus className="h-4 w-4 mr-2" />
              New Newsletter
            </Button>
          </div>
        </div>
        </div>
      </div>

        {/* Message area */}
        {message && (
          <div className={`mb-4 p-4 rounded border ${getMessageColor()}`}>
            <div>{message}</div>
            {calendarLink && (
              <div className="mt-2">
                <a href={calendarLink} className="text-sm text-blue-600 underline">View on calendar</a>
              </div>
            )}
          </div>
        )}

        {/* Newsletters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNewsletters.map((newsletter) => (
            <div
              key={newsletter.id}
              className="bg-[var(--background)] rounded-lg shadow-md border border-[var(--border)] hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleNewsletterClick(newsletter)}
            >
              {/* Preview Section */}
              <div className="h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                {newsletter.content ? (
                  <div
                    className="h-full w-full p-4 text-xs overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: newsletter.content }}
                    style={{
                      transform: 'scale(0.3)',
                      transformOrigin: 'top left',
                      width: '333%',
                      height: '333%'
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
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
                  <h3 className="font-semibold text-[var(--foreground)] text-lg truncate flex-1">
                    {newsletter.title}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full ml-2 ${getStatusColor(newsletter.status)}`}>
                    {newsletter.status.charAt(0).toUpperCase() + newsletter.status.slice(1)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {mounted ? new Date(newsletter.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    }) : newsletter.date}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNewsletter(newsletter);
                      setIsNewNewsletter(false);
                      setShowEditor(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Newsletter Details Dialog */}
      {showDetailsDialog && selectedNewsletter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            {/* Header */}
            <div className="flex justify-between items-start p-6 border-b">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center">
                  <span className="text-xl font-semibold text-[var(--accent-foreground)]">
                    {selectedNewsletter.title.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedNewsletter.title}</h2>
                  <span className={`inline-block text-xs px-3 py-1 rounded-full mt-1 ${getStatusColor(selectedNewsletter.status)}`}>
                    {selectedNewsletter.status.charAt(0).toUpperCase() + selectedNewsletter.status.slice(1)}
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
              {/* Email Content Preview */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Email Content Preview</h3>
                <div className="bg-gray-50 rounded-lg p-4 min-h-32">
                  {selectedNewsletter.content ? (
                    <div
                      className="text-sm text-gray-700"
                      dangerouslySetInnerHTML={{ __html: selectedNewsletter.content }}
                    />
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No content available</p>
                      <p className="text-xs">Click "Edit Newsletter" to add content</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center p-6 border-t bg-gray-50">
              <div className="flex gap-2">
                {selectedNewsletter.status === 'draft' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowDetailsDialog(false);
                      setIsNewNewsletter(false);
                      setShowEditor(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Newsletter
                  </Button>
                )}
                {selectedNewsletter.status !== 'archived' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => showDeleteConfirmation(selectedNewsletter.id, selectedNewsletter.title)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                    setIsNewNewsletter(false);
                    setShowEditor(true);
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Newsletter
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

      {/* New Newsletter Form Dialog */}
      {showNewNewsletterForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8 border border-[var(--border)]">
            <h2 className="text-3xl font-bold mb-6 text-center text-[var(--foreground)]">Create New Newsletter</h2>
            <form onSubmit={handleNewNewsletterFormSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--foreground)]">Title</label>
                <input
                  className="w-full border border-[var(--border)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] text-[var(--foreground)]"
                  value={newNewsletterData.title}
                  onChange={e => setNewNewsletterData(d => ({ ...d, title: e.target.value }))}
                  required
                  placeholder="Newsletter Title"
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2 text-[var(--foreground)]">Date</label>
                  <input
                    type="date"
                    className="w-full border border-[var(--border)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] text-[var(--foreground)]"
                    value={newNewsletterData.date}
                    onChange={e => setNewNewsletterData(d => ({ ...d, date: e.target.value }))}
                    required
                    aria-label="Newsletter date"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold mb-2 text-[var(--foreground)]">Status</label>
                  <select
                    className="w-full border border-[var(--border)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] text-[var(--foreground)]"
                    value={newNewsletterData.status}
                    onChange={e => setNewNewsletterData(d => ({ ...d, status: e.target.value as Newsletter["status"] }))}
                    aria-label="Newsletter status"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="px-5 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition" onClick={() => setShowNewNewsletterForm(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Continue</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Editor Dialog */}
      {showEditor && selectedNewsletter && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center p-6 border-b border-[var(--border)] bg-white dark:bg-gray-900 z-10">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                {isNewNewsletter ? 'Create Newsletter' : `Edit Newsletter: ${selectedNewsletter.title}`}
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Design your newsletter using the drag-and-drop editor
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
              style={{ flex: 1, width: '100%', height: '100%' }}
            />
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-between items-center p-6 border-t border-[var(--border)] bg-gray-50 dark:bg-gray-800 z-10 gap-4">
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
                    a.download = `${selectedNewsletter.title}.html`;
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
                onClick={() => saveEmailDesign("draft")}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button
                onClick={() => saveEmailDesign("finalised")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalise Newsletter
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}