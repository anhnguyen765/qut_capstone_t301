"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import EmailEditor, { EditorRef } from "react-email-editor";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Dialog } from "@/app/components/ui/dialog";
import ConfirmationDialog from "@/app/components/ConfirmationDialog";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { MoreVertical, Edit, Trash2, Info, Calendar, FileText, Search, Filter, ArrowUpDown, Plus, Tag, X, Target, Loader, Check } from "lucide-react";

type Template = {
  id: string;
  name: string;
  subject: string;
  type?: 'campaign' | 'newsletter';
  design: string;
  content?: string;
  created_at: string;
  updated_at: string;
};

export default function TemplatesPage() {
  const router = useRouter();
  // Sorting state and handler
  const [sortBy, setSortBy] = useState<"type" | "updated_at">("updated_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  // Handler for EmailEditor onReady event
  const onEmailEditorReady = () => {
    setEmailEditorLoaded(true);
    // Optionally, load design if editing
    if (editorMode === "edit" && selectedTemplate && emailEditorRef.current?.editor) {
      try {
        if (selectedTemplate.design) {
          let design = null;
          try {
            design = JSON.parse(selectedTemplate.design);
          } catch {}
          if (design) {
            emailEditorRef.current.editor.loadDesign(design);
            return;
          }
        }
      } catch {}
      // Fallback to blank design
      emailEditorRef.current.editor.loadDesign({
        counters: {},
        body: { id: '', rows: [], headers: [], footers: [], values: {} }
      });
    } else if (emailEditorRef.current?.editor) {
      emailEditorRef.current.editor.loadDesign({
        counters: {},
        body: { id: '', rows: [], headers: [], footers: [], values: {} }
      });
    }
  };
  // Helper to fetch templates from API
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      const data = await res.json();
      const arr = (Array.isArray(data) ? data : Array.isArray(data.templates) ? data.templates : []);
      setTemplates(arr);
      setFilteredTemplates(arr);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };
  // Local state for modal/editor visibility
  const [showNameModal, setShowNameModal] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  // State for name/subject modal
  const [modalName, setModalName] = useState<string>("");
  const [modalSubject, setModalSubject] = useState<string>("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalTemplateType, setModalTemplateType] = useState<'campaign' | 'newsletter'>('campaign');
  const emailEditorRef = useRef<EditorRef>(null);
  const [emailEditorLoaded, setEmailEditorLoaded] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Array<'campaign' | 'newsletter'>>([]);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isUsingTemplate, setIsUsingTemplate] = useState(false);
  const [selectedTemplateType, setSelectedTemplateType] = useState<'campaign' | 'newsletter' | null>(null);
  
  // Sort by template type convenience: infer from design JSON templateType
  const getTemplateType = (t: Template): 'campaign' | 'newsletter' | 'unknown' => {
    const typ = t.type || parseDesign(t.design)?.templateType;
    if (typ === 'campaign' || typ === 'newsletter') return typ;
    return 'unknown';
  };
  
  // Sorted templates (must be after filteredTemplates is defined)
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    if (sortBy === 'type') {
      const at = getTemplateType(a);
      const bt = getTemplateType(b);
      if (at === bt) return 0;
      return sortOrder === 'asc' ? (at > bt ? 1 : -1) : (at > bt ? -1 : 1);
    }
    // sortBy === 'updated_at'
    const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    if (aTime === bTime) return 0;
    return aTime > bTime ? (sortOrder === 'asc' ? 1 : -1) : (sortOrder === 'asc' ? -1 : 1);
  });
  const handleSort = (field: "type" | "updated_at") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
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
  
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUseTemplateDialog, setShowUseTemplateDialog] = useState(false);
  const [templateToUse, setTemplateToUse] = useState<Template | null>(null);

  // Safely parse a stored template design (JSON string from DB)
  const parseDesign = (design: string | any): any | null => {
    try {
      if (!design) return null;
      if (typeof design === 'string') {
        // If backend returned already-stringified JSON
        if (design.trim().startsWith('{') || design.trim().startsWith('[')) {
          return JSON.parse(design);
        }
        // Fallback: if someone stored raw HTML by mistake
        return null;
      }
      if (typeof design === 'object') return design;
      return null;
    } catch {
      return null;
    }
  };

  // Generate lightweight preview HTML from Unlayer design JSON
  const generatePreviewHtml = (designObj: any): string => {
    if (!designObj || !designObj.body || !Array.isArray(designObj.body.rows)) return '';
    const chunks: string[] = [];
    // Extract a few first text/image blocks for a quick preview
    let textCount = 0;
    let imageCount = 0;
    try {
      for (const row of designObj.body.rows) {
        if (!row || !Array.isArray(row.columns)) continue;
        for (const col of row.columns) {
          if (!col || !Array.isArray(col.contents)) continue;
          for (const item of col.contents) {
            if (item.type === 'text' && textCount < 3) {
              const html = (item.values && item.values.text) ? String(item.values.text) : '';
              if (html) {
                chunks.push(`<div style=\"margin:4px 0;font-size:12px;line-height:1.4;color:#111\">${html}</div>`);
                textCount++;
              }
            }
            if (item.type === 'image' && imageCount < 1) {
              const src = item.values?.src?.url || item.values?.src || '';
              if (src) {
                chunks.push(`<div style=\"margin:6px 0\"><img src=\"${src}\" alt=\"\" style=\"max-width:100%;height:auto;border-radius:4px\"/></div>`);
                imageCount++;
              }
            }
            if (textCount >= 3 && imageCount >= 1) break;
          }
          if (textCount >= 3 && imageCount >= 1) break;
        }
        if (textCount >= 3 && imageCount >= 1) break;
      }
    } catch {}
    return chunks.join('');
  };

  const handleUseTemplate = (template: Template) => {
    setTemplateToUse(template);
    // Pre-select based on template type
    const templateType = getTemplateType(template);
    if (templateType === 'campaign') {
      setSelectedTemplateType('campaign');
    } else if (templateType === 'newsletter') {
      setSelectedTemplateType('newsletter');
    } else {
      setSelectedTemplateType(null); // No pre-selection for unknown types
    }
    setShowUseTemplateDialog(true);
  };

  const handleUseTemplateConfirm = async (target: 'campaign' | 'newsletter') => {
    if (!templateToUse) return;
    
    setIsUsingTemplate(true);
    try {
      const designObj = parseDesign(templateToUse.design);
      if (!designObj) {
        setError('Template design is invalid or missing.');
        setIsUsingTemplate(false);
        return;
      }
      // Store in sessionStorage to avoid URL size limits
      sessionStorage.setItem('templateDesign', JSON.stringify(designObj));
      sessionStorage.setItem('templateContent', templateToUse.content || '');
      sessionStorage.setItem('templateName', templateToUse.name || '');
      sessionStorage.setItem('templateSubject', templateToUse.subject || '');
      
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (target === 'campaign') {
        setIsRedirecting(true);
        router.push('/campaigns/builder?useTemplate=1');
      } else {
        setIsRedirecting(true);
        router.push('/newsletters?useTemplate=1');
      }
      setShowUseTemplateDialog(false);
      setTemplateToUse(null);
      setSelectedTemplateType(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to use template');
    } finally {
      setIsUsingTemplate(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetch("/api/templates")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch templates");
        return res.json();
      })
      .then((data) => {
        // Defensive: ensure data is always an array
        const arr = Array.isArray(data) ? data : Array.isArray(data.templates) ? data.templates : [];
        setTemplates(arr);
        setFilteredTemplates(arr);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let arr = templates;
    // Text search
    if (search) {
      arr = arr.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.subject.toLowerCase().includes(search.toLowerCase())
      );
    }
    // Type filtering
    if (selectedTypes.length > 0) {
      arr = arr.filter((t) => {
        const typ = getTemplateType(t);
        return selectedTypes.includes(typ as any);
      });
    }
    setFilteredTemplates(arr);
  }, [search, templates, selectedTypes]);

  const handleOpenDetails = (template: Template) => {
    setSelectedTemplate(template);
    setShowDetails(true);
    // Lazy fetch full template if content missing
    if (!template.content && template.id) {
      fetch(`/api/templates/${template.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.template) {
            setSelectedTemplate(prev => prev && String(prev.id) === String(data.template.id) ? { ...prev, content: data.template.content, design: data.template.design } : prev);
          }
        })
        .catch(() => {});
    }
  };

  // Open name/subject modal before editor
  const handleOpenEditor = (mode: "create" | "edit", template?: Template) => {
    setEditorMode(mode);
    if (mode === "edit" && template) {
      setSelectedTemplate(template);
      setModalName(template.name);
      setModalSubject(template.subject);
      // Pre-fill template type from design metadata if available
      const t = parseDesign(template.design)?.templateType;
      setModalTemplateType(t === 'newsletter' ? 'newsletter' : 'campaign');
      setShowNameModal(true);
    } else {
      setSelectedTemplate(null);
      setModalName("");
      setModalSubject("");
      setModalTemplateType('campaign');
      setShowNameModal(true);
    }
  };
  // Confirm name/subject and open editor or redirect
  const handleNameModalConfirm = () => {
    if (!modalName.trim() || !modalSubject.trim()) {
      setModalError("Name and subject are required.");
      return;
    }
    setModalError(null);
    // For create mode: redirect to appropriate flow with a note
    if (editorMode === 'create') {
      try {
        sessionStorage.setItem('templateNewMeta', JSON.stringify({
          name: modalName,
          subject: modalSubject,
        }));
      } catch {}
      setShowNameModal(false);
      if (modalTemplateType === 'campaign') {
        setIsRedirecting(true);
        router.push('/campaigns/builder?fromTemplateNew=1');
      } else {
        setIsRedirecting(true);
        router.push('/newsletters?fromTemplateNew=1');
      }
      return;
    }
    // Edit mode continues to in-page editor
    setShowNameModal(false);
    setShowEditor(true);
  };

  const handleOpenDelete = (template: Template) => {
    setSelectedTemplate(template);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    console.log('handleDelete called, selectedTemplate:', selectedTemplate);
    const idStr = selectedTemplate && selectedTemplate.id !== undefined ? String(selectedTemplate.id) : "";
    if (!selectedTemplate || !idStr.trim()) {
      setError("Invalid template id for deletion.");
      return;
    }
    setLoading(true);
    setShowDeleteDialog(false);
    try {
      const res = await fetch(`/api/templates`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: idStr }),
      });
      if (!res.ok) throw new Error("Failed to delete template");
      setTemplates((prev) => prev.filter((t) => String(t.id) !== idStr));
      setSelectedTemplate(null);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSave = async (status: "draft" | "finalised" = "draft") => {
    const unlayer = emailEditorRef.current?.editor;
    if (!unlayer) return;
    unlayer.saveDesign((designJson: any) => {
      unlayer.exportHtml(async (data: any) => {
        const { html } = data;
        const name = (selectedTemplate?.name ?? modalName ?? "") || "";
        const subject = (selectedTemplate?.subject ?? modalSubject ?? "") || "";
        // Persist JSON design to match API and enable preview with renderer later
        if (!name.trim() || !subject.trim() || !designJson) {
          setError("Name, subject, and design are required.");
          return;
        }
        // Attach template type metadata into design JSON for classification
        try {
          if (typeof designJson === 'object' && designJson) {
            (designJson as any).templateType = modalTemplateType;
          }
        } catch {}
        setLoading(true);
        setShowEditor(false);
        try {
          const body = { name, subject, design: designJson, content: html, type: modalTemplateType };
          const res = await fetch(
            "/api/templates",
            {
              method: editorMode === "edit" ? "PUT" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                editorMode === "edit"
                  ? { ...body, id: selectedTemplate?.id }
                  : body
              ),
            }
          );
          if (!res.ok) throw new Error("Failed to save template");
          const newTemplateRaw = await res.json();
          // Map DB fields to frontend fields
          const newTemplate = {
            ...newTemplateRaw,
            createdAt: newTemplateRaw.created_at || newTemplateRaw.createdAt,
            updatedAt: newTemplateRaw.updated_at || newTemplateRaw.updatedAt,
          };
          if (editorMode === "edit") {
            setTemplates((prev) =>
              prev.map((t) => (t.id === newTemplate.id ? newTemplate : t))
            );
          } else {
            setTemplates((prev) => [newTemplate, ...prev]);
          }
          setLoading(false);
          // Refresh templates after save
          await fetchTemplates();
        } catch (err: any) {
          setError(err.message);
          setLoading(false);
        }
      });
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-[var(--background)] border-b border-[var(--border)] pb-4 mb-6">
        <header className="mb-4">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            Templates
          </h1>
        </header>

        <div className="space-y-4">
          {/* Search bar with icon and filter popover (like campaigns) */}
          <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--foreground)]" />
        <input
          type="text"
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
                  {/* Filter by Type */}
                  <div className="text-xs font-semibold px-2">Filter by Type</div>
                  {['campaign','newsletter'].map((val) => (
                    <label key={val} className="flex items-center space-x-2 p-2 hover:bg-[var(--accent)] rounded-md cursor-pointer">
                      <input
                        type="checkbox"
                        className="accent-[var(--primary)]"
                        checked={selectedTypes.includes(val as any)}
                        onChange={(e) => {
                          setSelectedTypes(prev => {
                            const exists = prev.includes(val as any);
                            if (exists) return prev.filter(x => x !== (val as any));
                            return [...prev, val as any];
                          });
                        }}
                      />
                      <span className="text-foreground capitalize">{val}</span>
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
              title="Sort by type"
              aria-label="Sort by type"
            >
              Type {sortBy === "type" && <ArrowUpDown className="ml-1 h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort("updated_at")}
              className={`${
                sortBy === "updated_at"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
              }`}
              title="Sort by updated date"
              aria-label="Sort by updated date"
            >
              Last Updated {sortBy === "updated_at" && <ArrowUpDown className="ml-1 h-4 w-4" />}
            </Button>
          </div>
        </div>
          <div className="flex gap-2">
            <Button onClick={() => {
              setIsRedirecting(true);
              router.push('/templates/builder');
            }}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
            </Button>
          </div>
        </div>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && (
        <>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        </>
      )}
      {error && (
        <div className="mb-4 text-red-500">Error: {error}</div>
      )}
      {sortedTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 mb-4 text-gray-300" />
          <div className="text-gray-500 text-lg mb-2">No templates found.</div>
          <div className="text-xs text-gray-400">Create a new template to get started.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTemplates.map((template, idx) => (
            <div
              key={template.id ?? idx}
              className="bg-[var(--background)] rounded-lg shadow-md border border-[var(--border)] hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedTemplate(template)}
            >
              {/* Preview Section */}
              <div className="h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                {(() => {
                  const designObj = parseDesign(template.design);
                  const html = template.content || generatePreviewHtml(designObj);
                  return html ? (
                    <div
                      className="h-full w-full p-4 text-xs overflow-hidden email-preview-wrapper"
                      dangerouslySetInnerHTML={{ __html: html }}
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
                    <div className="h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No preview available</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
              {/* Content Section */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-[var(--foreground)] text-lg truncate flex-1">
                    {template.name}
                  </h3>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {(() => {
                    const tt = getTemplateType(template);
                    const color = tt === 'campaign' ? 'bg-blue-100 text-blue-800' : tt === 'newsletter' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800';
                    const label = tt === 'campaign' ? 'Campaign' : tt === 'newsletter' ? 'Newsletter' : 'Unknown';
                    return (
                      <span className={`text-sm px-2 py-1 rounded-md ${color}`}>{label}</span>
                    );
                  })()}
                </div>

                {template.updated_at && (
                  <div className="text-xs text-gray-500 mb-3">
                    <span>
                      Updated: {formatTimeAgo(template.updated_at)}
                    </span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    variant="default"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleUseTemplate(template); }}
                    title="Use template for a campaign or newsletter"
                  >
                    Use Template
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setIsRedirecting(true);
                      router.push(`/templates/builder?id=${template.id}`); 
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={!!selectedTemplate} onOpenChange={open => { if (!open) setSelectedTemplate(null); }}>
        {selectedTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
              {/* Header */}
              <div className="flex justify-between items-start p-6 border-b">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[var(--accent)] flex items-center justify-center">
                    <span className="text-xl font-semibold text-[var(--accent-foreground)]">
                      {selectedTemplate.name?.[0]?.toUpperCase() ?? "T"}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedTemplate.name}</h2>
                    {(() => {
                      const tt = getTemplateType(selectedTemplate);
                      const color = tt === 'campaign' ? 'bg-blue-100 text-blue-800' : tt === 'newsletter' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800';
                      const label = tt === 'campaign' ? 'Campaign' : tt === 'newsletter' ? 'Newsletter' : 'Unknown';
                      return (
                        <span className={`inline-block text-xs px-3 py-1 rounded-full mt-1 ${color}`}>{label}</span>
                      );
                    })()}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTemplate(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Template Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Tag className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Template Type</p>
                      <p className="text-sm text-gray-600">{(() => { const tt = getTemplateType(selectedTemplate); return tt === 'campaign' ? 'Campaign' : tt === 'newsletter' ? 'Newsletter' : 'Unknown'; })()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Description</p>
                      <p className="text-sm text-gray-600">{selectedTemplate.subject || '—'}</p>
                    </div>
                  </div>
                </div>
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Email Content Preview</h3>
                    {(() => {
                      const html = selectedTemplate.content || generatePreviewHtml(parseDesign(selectedTemplate.design));
                      return html ? (
                        <div
                          className="w-full p-4 text-sm overflow-auto border border-border rounded-lg email-preview-wrapper"
                          style={{ 
                            backgroundColor: 'var(--background)', 
                            color: 'var(--foreground)',
                            pointerEvents: 'none', 
                            minHeight: '400px' 
                          }}
                          dangerouslySetInnerHTML={{ __html: html }}
                        />
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No design available</p>
                          <p className="text-xs">Click "Edit" to add design</p>
                        </div>
                      );
                    })()}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-between items-center p-6 border-t">
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => { setShowDeleteDialog(true); }}>
                    <X className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleUseTemplate(selectedTemplate)}>Use Template</Button>
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => {
                      setIsRedirecting(true);
                      router.push(`/templates/builder?id=${selectedTemplate.id}`);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Create/Edit Modal with drag-and-drop editor */}
      {showEditor && (
          <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900 w-full max-w-none px-4 py-3 gap-4 max-h-screen">
          {/* Header */}
          <div className="w-full mx-auto flex flex-col sm:flex-row justify-between items-center border-b border-[var(--border)] bg-white dark:bg-gray-900 z-10 flex-none">
            <div className="mb-4 sm:mb-0 w-full max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                {editorMode === "edit" && selectedTemplate ? `Edit Template: ${selectedTemplate.name}` : "Create Template"}
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Design your email template using the drag-and-drop editor
              </p>
            </div>
          </div>

          <div className="w-full mx-auto flex-1 flex flex-col overflow-auto gap-4">
                      <div className="h-full w-full mb-0">
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
                        />
                      </div>
                    </div>

          {/* Footer */}
          <div className="w-full mx-auto flex flex-col sm:flex-row justify-between items-center z-20 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3 sticky bottom-0 flex-none">
            <div className="w-full flex flex-row justify-between items-center gap-2">
              {/* Left: Import & Export */}
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  id="import-design-input"
                  title="Import design JSON"
                  aria-label="Import design JSON"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const text = await file.text();
                      const design = JSON.parse(text);
                      if (emailEditorRef.current?.editor) {
                        emailEditorRef.current.editor.loadDesign(design);
                      }
                    } catch (err) {
                      alert('Failed to import design: ' + (err instanceof Error ? err.message : String(err)));
                    }
                    e.target.value = '';
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('import-design-input')?.click()}
                >
                  Import
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Export design logic
                    if (emailEditorRef.current?.editor) {
                      emailEditorRef.current.editor.exportHtml(data => {
                        const blob = new Blob([data.design ? JSON.stringify(data.design) : ''], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'template-design.json';
                        a.click();
                        URL.revokeObjectURL(url);
                      });
                    }
                  }}
                >
                  Export
                </Button>
              </div>
              {/* Right: Close & Save */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowEditor(false)}>
                  Close
                </Button>
                <Button onClick={() => handleSave("finalised")}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />

      {/* Name/Subject Modal - Create/Edit Template */}
      {showNameModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">{editorMode === "edit" ? "Edit Template Info" : "Create Template"}</h2>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1" htmlFor="template-name">Template Name</label>
              <input
                id="template-name"
                type="text"
                className="w-full border rounded px-3 py-2"
                value={modalName}
                onChange={e => setModalName(e.target.value)}
                required
                placeholder="e.g. Welcome Email, Newsletter, Promotion"
                aria-label="Template Name"
              />
              <span className="text-xs text-gray-500">Give your template a descriptive name.</span>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1" htmlFor="template-description">Description</label>
              <input
                id="template-description"
                type="text"
                className="w-full border rounded px-3 py-2"
                value={modalSubject}
                onChange={e => setModalSubject(e.target.value)}
                required
                placeholder="e.g. Welcome message, Monthly update, Booking info"
                aria-label="Description"
              />
              <span className="text-xs text-gray-500">A short description for this template.</span>
            </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1" htmlFor="template-type">Template Type</label>
          <select
            id="template-type"
            className="w-full border rounded px-3 py-2"
            value={modalTemplateType}
            onChange={e => setModalTemplateType(e.target.value as any)}
            aria-label="Template Type"
          >
            <option value="campaign">Campaign</option>
            <option value="newsletter">Newsletter</option>
          </select>
          <span className="text-xs text-gray-500">Used for classification and default routing.</span>
        </div>
            {modalError && <div className="text-red-600 mb-2">{modalError}</div>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNameModal(false)}>Cancel</Button>
              <Button onClick={handleNameModalConfirm} className="bg-primary text-white">Continue</Button>
            </div>
          </div>
        </div>
      )}

      {/* Use Template Type Selection Dialog */}
      {showUseTemplateDialog && templateToUse && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Use Template</h2>
            <p className="text-gray-600 mb-2">
              How would you like to use the template "<strong>{templateToUse.name}</strong>"?
            </p>
            {(() => {
              const templateType = getTemplateType(templateToUse);
              const suggestedType = templateType === 'campaign' ? 'campaign' : templateType === 'newsletter' ? 'newsletter' : null;
              return suggestedType && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-blue-800">
                      Suggested: This template is designed for <strong>{suggestedType === 'campaign' ? 'Campaigns' : 'Newsletters'}</strong>
                    </span>
                  </div>
                </div>
              );
            })()}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Button
                className={`h-24 flex-col justify-center items-center p-4 ${
                  selectedTemplateType === 'campaign'
                    ? 'border-2 border-primary bg-primary/5' 
                    : ''
                }`}
                variant="outline"
                onClick={() => setSelectedTemplateType('campaign')}
                disabled={isUsingTemplate}
              >
                <Target className="h-8 w-8 mb-2" />
                <div className="text-center">
                  <div className="font-medium">Use for Campaign</div>
                  <div className="text-sm text-gray-500">Create a new email campaign</div>
                </div>
              </Button>
              <Button
                className={`h-24 flex-col justify-center items-center p-4 ${
                  selectedTemplateType === 'newsletter'
                    ? 'border-2 border-primary bg-primary/5' 
                    : ''
                }`}
                variant="outline"
                onClick={() => setSelectedTemplateType('newsletter')}
                disabled={isUsingTemplate}
              >
                <FileText className="h-8 w-8 mb-2" />
                <div className="text-center">
                  <div className="font-medium">Use for Newsletter</div>
                  <div className="text-sm text-gray-500">Create a new newsletter</div>
                </div>
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { 
                setShowUseTemplateDialog(false); 
                setTemplateToUse(null); 
                setSelectedTemplateType(null);
              }}>
                Cancel
              </Button>
              <Button 
                onClick={() => selectedTemplateType && handleUseTemplateConfirm(selectedTemplateType)}
                disabled={!selectedTemplateType || isUsingTemplate}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isUsingTemplate ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirm & Use Template
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Global Loading Overlay for Redirects */}
      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 flex items-center gap-3">
            <Loader className="h-6 w-6 animate-spin text-primary" />
            <span className="text-lg font-medium">Redirecting...</span>
          </div>
        </div>
      )}
    </div>
  );
}


