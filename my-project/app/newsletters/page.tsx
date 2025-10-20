"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Filter, Plus, ArrowUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import { Edit, X, Eye, Send, Archive, Tag, FileText, Save, CheckCircle, Copy, Loader } from "lucide-react";
import EmailEditor, { EditorRef, EmailEditorProps } from "react-email-editor";
import { useRouter, useSearchParams } from "next/navigation";
import ConfirmationDialog from "@/app/components/ConfirmationDialog";

type Newsletter = {
  id: string;
  title: string;
  status: "draft" | "finalised";
  content?: string;
  design?: any;
  createdAt?: string;
  updatedAt?: string;
  finalisedAt?: string;
};

const NEWSLETTER_STATUSES = [
  { label: "Draft", value: "draft" },
  { label: "Finalised", value: "finalised" },
];

export default function Newsletters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState("");
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [templatesList, setTemplatesList] = useState<any[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"status" | "updatedAt">("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
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
    templateId?: string;
  }>({
    title: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'draft',
  });
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const emailEditorRef = useRef<EditorRef>(null);

  useEffect(() => {
    setMounted(true);
    // Fetch newsletters from backend
    fetchNewsletters();

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

  const fetchNewsletters = async () => {
    try {
      const res = await fetch("/api/newsletters");
      const data = await res.json();
        if (Array.isArray(data.newsletters)) {
          setNewsletters(
            data.newsletters.map((n: any) => ({
              id: String(n.id),
              title: n.title,
              status: n.status,
              content: n.content,
              design: n.design,
              createdAt: n.created_at || n.createdAt,
              updatedAt: n.updated_at || n.updatedAt,
              finalisedAt: n.finalised_at || n.finalisedAt,
            }))
          );
        }
    } catch (err) {
      console.error("Failed to fetch newsletters:", err);
    }
  };

  const duplicateNewsletter = async (newsletterId: string, defaultTitle: string) => {
    setIsDuplicating(true);
    try {
      const newTitle = `${defaultTitle} (Copy)`;
      const res = await fetch(`/api/newsletters/${newsletterId}/duplicate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to duplicate newsletter");
      }
      await fetchNewsletters();
      setNotification({ message: "Newsletter duplicated successfully", type: "success" });
    } catch (e: any) {
      setNotification({ message: e.message || "Failed to duplicate newsletter", type: "error" });
      } finally {
      setIsDuplicating(false);
    }
  };

  const saveNewsletterAsTemplate = async (newsletterId: string, defaultName: string) => {
    try {
      // Fetch full newsletter to get design
      const resNewsletter = await fetch(`/api/newsletters/${newsletterId}`);
      if (!resNewsletter.ok) throw new Error("Failed to fetch newsletter");
      const newsletterData = await resNewsletter.json();
      const newsletter = newsletterData.newsletter;

      const templateData = {
        name: `${defaultName} Template`,
        subject: newsletter.title,
        type: 'newsletter',
        design: newsletter.design,
        content: newsletter.content,
      };

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save as template");
      }

      setNotification({ message: "Newsletter saved as template successfully", type: "success" });
    } catch (e: any) {
      setNotification({ message: e.message || "Failed to save as template", type: "error" });
    }
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
    setSelectedNewsletter(null);
    setIsNewNewsletter(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
      case "finalised":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
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

  const formatDateAndTime = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    // Format as "Tuesday 2:30 PM"
    const dayName = date.toLocaleDateString('en-US', { 
      weekday: 'long',
      timeZone: 'Australia/Sydney'
    });
    const time = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true,
      timeZone: 'Australia/Sydney'
    });
    
    return `${dayName} ${time}`;
  };

  const saveEmailDesign = async (status: "draft" | "finalised") => {
    const unlayer = emailEditorRef.current?.editor;

    unlayer?.saveDesign((design: any) => {
      setEmailDesign(design);
      unlayer.exportHtml(async (data: any) => {
        const html = data.html;
        try {
          if (isNewNewsletter) {
            // Create new newsletter
            const response = await fetch('/api/newsletters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: selectedNewsletter?.title || 'New Newsletter',
                date: selectedNewsletter?.date || new Date().toISOString().slice(0, 10),
              status: status,
              content: html,
                design: JSON.stringify(design),
              }),
            });

            if (response.ok) {
              setNotification({ message: `Newsletter ${status} successfully!`, type: "success" });
              await fetchNewsletters();
              setShowEditor(false);
            } else {
              setNotification({ message: "Failed to create newsletter", type: "error" });
            }
          } else {
            // Update existing newsletter
            const response = await fetch(`/api/newsletters/${selectedNewsletter?.id}`, {
                method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                title: selectedNewsletter?.title,
                date: selectedNewsletter?.date,
                status: status,
                    content: html,
                design: JSON.stringify(design),
              }),
            });

            if (response.ok) {
              setNotification({ message: `Newsletter ${status} successfully!`, type: "success" });
              await fetchNewsletters();
              setShowEditor(false);
            } else {
              setNotification({ message: "Failed to save newsletter", type: "error" });
            }
          }
        } catch (error) {
          console.error("Save error:", error);
          setNotification({ message: "Error saving newsletter", type: "error" });
        }
      });
    });
  };

  const handleSort = (field: "status" | "updatedAt") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleStatusChange = (status: string) => {
    if (selectedStatuses.includes(status)) {
      setSelectedStatuses(selectedStatuses.filter(s => s !== status));
    } else {
      setSelectedStatuses([...selectedStatuses, status]);
    }
  };

  const handleNewsletterClick = (newsletter: Newsletter) => {
    setSelectedNewsletter(newsletter);
    setShowDetailsDialog(true);
  };

  const getStatusLabel = (status: string) => {
    return NEWSLETTER_STATUSES.find((s) => s.value === status)?.label || status;
  };

  const showDeleteConfirmation = (id: string, title: string) => {
    setConfirmationData({
      title: "Delete Newsletter",
      message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      onConfirm: () => deleteNewsletter(id),
    });
    setShowConfirmationDialog(true);
  };

  const deleteNewsletter = async (id: string) => {
    try {
      const response = await fetch(`/api/newsletters/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotification({ message: "Newsletter deleted successfully", type: "success" });
        await fetchNewsletters();
        setShowDetailsDialog(false);
      } else {
        setNotification({ message: "Failed to delete newsletter", type: "error" });
      }
    } catch (error) {
      console.error("Delete error:", error);
      setNotification({ message: "Error deleting newsletter", type: "error" });
    }
  };

  const onEmailEditorReady = () => {
    setEmailEditorLoaded(true);
    const unlayer = emailEditorRef.current?.editor;
    if (selectedNewsletter?.design) {
      try {
        unlayer?.loadDesign(selectedNewsletter.design);
      } catch (e) {
        console.error('Failed to load design:', e);
      }
    }
  };

  const handleNewNewsletterFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newsletter: Newsletter = {
      id: '',
      title: newNewsletterData.title,
      date: newNewsletterData.date,
      type: 'newsletter',
      status: newNewsletterData.status as Newsletter['status'],
      content: '',
      design: emailDesign,
    };
    setSelectedNewsletter(newsletter);
    setIsNewNewsletter(true);
    setShowNewNewsletterForm(false);
    setShowEditor(true);
  };

  // Load template into new newsletter when navigated with useTemplate flag
  useEffect(() => {
    const useTemplate = searchParams.get('useTemplate');
    if (useTemplate) {
      try {
        const designStr = sessionStorage.getItem('templateDesign');
        const contentStr = sessionStorage.getItem('templateContent');
        const name = sessionStorage.getItem('templateName') || '';
        if (designStr) {
          const design = JSON.parse(designStr);
          const today = new Date().toISOString().slice(0, 10);
          const draft: Newsletter = { 
            id: '', 
            title: name || 'New Newsletter', 
            date: today, 
            type: 'newsletter',
            status: 'draft', 
            content: contentStr || '', 
            design 
          };
          setSelectedNewsletter(draft);
          setIsNewNewsletter(true);
          setShowEditor(true);
        }
      } catch (e) {
        console.error('Failed to load template for newsletter:', e);
      } finally {
        sessionStorage.removeItem('templateDesign');
        sessionStorage.removeItem('templateContent');
        sessionStorage.removeItem('templateName');
        sessionStorage.removeItem('templateSubject');
      }
    }
  }, [searchParams]);

  const filteredNewsletters = newsletters.filter(
    (n) =>
      (selectedStatuses.length === 0 || selectedStatuses.includes(n.status)) &&
      n.title.toLowerCase().includes(filter.toLowerCase())
  );

  const sortedNewsletters = [...filteredNewsletters]
    .sort((a, b) => {
      const direction = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "status") {
        return a.status > b.status ? direction : a.status < b.status ? -direction : 0;
      }
      // no generic date sort; use updatedAt instead
      // sortBy === 'updatedAt'
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      if (aTime === bTime) return 0;
      return aTime > bTime ? direction : -direction;
    });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-[var(--background)] border-b border-[var(--border)] pb-4 mb-6">
        <header className="mb-4">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-foreground">
            Newsletters
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
          {/* Search Bar */}
          <div>
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
                {NEWSLETTER_STATUSES.map((status) => (
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
        </div>

      {/* Sort and New Newsletter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--foreground)]">Sort by:</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("status")}
              className={`${
                sortBy === "status"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
              }`}
            >
              Status{" "}
              {sortBy === "status" && <ArrowUpDown className="ml-1 h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort("updatedAt")}
              className={`${
                sortBy === "updatedAt"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
              }`}
              title="Sort by updated date"
              aria-label="Sort by updated date"
            >
              Updated {sortBy === "updatedAt" && <ArrowUpDown className="ml-1 h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
          <Button className="flex-1 sm:flex-none" 
            onClick={() => setShowNewNewsletterForm(true)}
          >
              <Plus className="h-4 w-4 mr-2" />
              New Newsletter
            </Button>
          </div>
        </div>
        </div>
      </div>

      {/* Newsletter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedNewsletters.map((newsletter, idx) => (
            <div
            key={newsletter.id ?? idx}
              className="bg-[var(--background)] rounded-lg shadow-md border border-[var(--border)] hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleNewsletterClick(newsletter)}
            >
              {/* Preview Section */}
              <div className="h-48 bg-muted rounded-t-lg overflow-hidden">
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
                    {newsletter?.title || 'Untitled Newsletter'}
                  </h3>
                <span className={`text-xs px-2 py-1 rounded-full ml-2 ${getStatusColor(newsletter.status || 'draft')}`}>
                  {(newsletter.status || 'draft').charAt(0).toUpperCase() + (newsletter.status || 'draft').slice(1)}
                  </span>
                </div>


              {(newsletter.finalisedAt || newsletter.updatedAt) && (
                <div className="text-xs text-gray-500 mb-3">
                  <span>
                    {newsletter.finalisedAt 
                      ? `Finalised: ${formatDateAndTime(newsletter.finalisedAt)}`
                      : `Updated: ${formatDateAndTime(newsletter.updatedAt)}`
                    }
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
                    router.push(`/newsletters/builder?id=${newsletter.id}`);
                    }}
                  disabled={newsletter.status === 'finalised'}
                  title={newsletter.status === 'finalised' ? 'Cannot edit finalised newsletters' : 'Edit newsletter'}
                  >
                  {isRedirecting ? (
                    <Loader className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Edit className="h-4 w-4 mr-1" />
                  )}
                    Edit
                  </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateNewsletter(newsletter.id, newsletter?.title || 'Untitled Newsletter');
                  }}
                  title="Duplicate newsletter"
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
                    saveNewsletterAsTemplate(newsletter.id, newsletter?.title || 'Untitled Newsletter');
                  }}
                  title="Save as template"
                >
                  <Save className="h-4 w-4" />
                </Button>
                {(newsletter.status === 'draft' || newsletter.status === 'finalised') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/send-email?newsletterId=${newsletter.id}`);
                    }}
                    title="Send newsletter"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* New Newsletter Form Dialog */}
      {showNewNewsletterForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-8 border border-[var(--border)]">
            <h2 className="text-3xl font-bold mb-6 text-center text-[var(--foreground)]">Create New Newsletter</h2>
            <form onSubmit={handleNewNewsletterFormSubmit} className="space-y-6">
              {/* Optional template selection */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-[var(--foreground)]">Template (optional)</label>
                <select
                  className="w-full border border-[var(--border)] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--background)] text-[var(--foreground)]"
                  value={newNewsletterData.templateId || ''}
                  onChange={async e => {
                    const templateId = e.target.value;
                    if (!templateId) {
                      setNewNewsletterData(d => ({ ...d, templateId: '', title: '', }));
                      setEmailDesign(null);
                      return;
                    }
                    const template = templatesList.find((t: any) => String(t.id) === String(templateId));
                    if (template) {
                      setNewNewsletterData(d => ({
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
                    onChange={e => setNewNewsletterData(d => ({ ...d, status: e.target.value }))}
                    aria-label="Newsletter status"
                    title="Newsletter status"
                  >
                    <option value="draft">Draft</option>
                    <option value="finalised">Finalised</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="px-5 py-2 rounded-lg bg-muted text-foreground font-semibold hover:bg-muted/80 transition" onClick={() => setShowNewNewsletterForm(false)}>Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition">Continue</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Dialog */}
      {showDetailsDialog && selectedNewsletter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            {/* Header */}
            <div className="flex justify-between items-start p-6 border-b">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center">
                  <span className="text-xl font-semibold text-[var(--accent-foreground)]">
                    {selectedNewsletter?.title?.charAt(0) || 'N'}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{selectedNewsletter?.title || 'Untitled Newsletter'}</h2>
                  <span className={`inline-block text-xs px-3 py-1 rounded-full mt-1 ${getStatusColor(selectedNewsletter?.status || 'draft')}`}>
                    {(selectedNewsletter?.status || 'draft').charAt(0).toUpperCase() + (selectedNewsletter?.status || 'draft').slice(1)}
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
              {/* Newsletter Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Date</p>
                    <p className="text-sm text-gray-600">{selectedNewsletter?.date || 'No date'}</p>
                  </div>
                </div>
              </div>

              {/* Email Content Preview */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">Email Content Preview</h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 min-h-32">
                  {selectedNewsletter?.content ? (
                    <div
                      className="text-sm text-foreground"
                      dangerouslySetInnerHTML={{ __html: selectedNewsletter?.content || '' }}
                    />
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No content available</p>
                      <p className="text-xs">Click "Edit Newsletter" to add content</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between items-center p-6 border-t bg-muted">
              <div className="flex gap-2">
                {(selectedNewsletter?.status === 'draft' || selectedNewsletter?.status === 'finalised') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      router.push(`/send-email?newsletterId=${selectedNewsletter.id}`);
                    }}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Schedule Email
                  </Button>
                )}
                 {selectedNewsletter.status !== 'finalised' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => showDeleteConfirmation(selectedNewsletter.id, selectedNewsletter.title)}
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
                    router.push(`/newsletters/builder?id=${selectedNewsletter.id}`);
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={selectedNewsletter.status === 'finalised'}
                  title={selectedNewsletter.status === 'finalised' ? 'Cannot edit finalised newsletters' : 'Edit newsletter'}
                >
                  {isRedirecting ? (
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                  <Edit className="h-4 w-4 mr-2" />
                  )}
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
          onConfirm={() => {
            confirmationData.onConfirm();
            setShowConfirmationDialog(false);
          }}
          onCancel={() => setShowConfirmationDialog(false)}
        />
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
                Design your email newsletter using the drag-and-drop editor
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
                  if (!unlayer) return;
                  unlayer.saveDesign((designData: any) => {
                    unlayer.exportHtml((data: any) => {
                    const { html } = data;
                      setSelectedNewsletter(prev => prev ? { ...prev, content: html, design: designData } : null);
                      setNotification({ message: 'Editor changes applied. Review and click "Save Newsletter" to persist.', type: "info" });
                      setShowEditor(false);
                    });
                  });
                }}
              >
                <Save className="h-4 w-4 mr-2" />
                Apply Changes
              </Button>
            </div>
            <div className="flex gap-2">
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