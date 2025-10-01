"use client";
import React, { useState, useEffect, useRef } from "react";
import EmailEditor, { EditorRef } from "react-email-editor";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Dialog } from "@/app/components/ui/dialog";
import ConfirmationDialog from "@/app/components/ConfirmationDialog";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";
import { MoreVertical, Edit, Trash2, Info, Calendar, FileText } from "lucide-react";

type Template = { 
  id: string;
  name: string;
  subject: string;
  description?: string;
  html: string;
  createdAt: string;
  updatedAt: string;
};

export default function TemplatesPage() {
  // Helper to fetch templates from API
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/templates");
      if (!res.ok) throw new Error("Failed to fetch templates");
      const data = await res.json();
      const arr = Array.isArray(data) ? data : Array.isArray(data.templates) ? data.templates : [];
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
  const emailEditorRef = useRef<EditorRef>(null);
  const [emailEditorLoaded, setEmailEditorLoaded] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
    if (!search) {
      setFilteredTemplates(templates);
    } else {
      setFilteredTemplates(
        templates.filter((t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.subject.toLowerCase().includes(search.toLowerCase())
        )
      );
    }
  }, [search, templates]);

  const handleOpenDetails = (template: Template) => {
    // Always use the database values for createdAt/updatedAt
    setSelectedTemplate({
      ...template,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    });
    setShowDetails(true);
  };

  // Open name/subject modal before editor
  const handleOpenEditor = (mode: "create" | "edit", template?: Template) => {
    setEditorMode(mode);
    if (mode === "edit" && template) {
      setSelectedTemplate(template);
      setModalName(template.name);
      setModalSubject(template.subject);
      setShowNameModal(true);
    } else {
      setSelectedTemplate(null);
      setModalName("");
      setModalSubject("");
      setShowNameModal(true);
    }
  };
  // Confirm name/subject and open editor
  const handleNameModalConfirm = () => {
    if (!modalName.trim() || !modalSubject.trim()) {
      setModalError("Name and subject are required.");
      return;
    }
    setModalError(null);
    // Do not set selectedTemplate here for create; only for edit
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
    unlayer.saveDesign((design: any) => {
      unlayer.exportHtml(async (data: any) => {
        const { html } = data;
        const name = (selectedTemplate?.name ?? modalName ?? "") || "";
        const subject = (selectedTemplate?.subject ?? modalSubject ?? "") || "";
        const content = typeof html === "string" ? html : "";
        if (typeof name !== "string" || typeof subject !== "string" || typeof content !== "string" || !name.trim() || !subject.trim() || !content.trim()) {
          setError("Name, subject, and content are required.");
          return;
        }
        setLoading(true);
        setShowEditor(false);
        try {
          const body = { name, subject, content };
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
          const newTemplate = await res.json();
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
  <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Email Templates</h1>
        <Button onClick={() => { console.log('Create Template button clicked'); handleOpenEditor("create"); }}>Create Template</Button>
      </div>
      {loading && (
        <>
          <Skeleton className="h-10 w-full mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </>
      )}
      {error && (
        <div className="mb-4 text-red-500">Error: {error}</div>
      )}
      <div className="flex items-center gap-2 mb-6">
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Button variant="outline" size="sm">
          <Info className="h-4 w-4 mr-1" />
          Filter
        </Button>
      </div>
      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 mb-4 text-gray-300" />
          <div className="text-gray-500 text-lg mb-2">No templates found.</div>
          <div className="text-xs text-gray-400">Create a new template to get started.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template, idx) => (
            <div
              key={template.id ?? idx}
              className="bg-[var(--background)] rounded-lg shadow-md border border-[var(--border)] hover:shadow-lg transition-shadow cursor-pointer overflow-hidden flex flex-col"
              onClick={() => setSelectedTemplate(template)}
            >
              {/* Preview Section */}
              <div className="h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                {template.html ? (
                  <div
                    className="h-full w-full p-4 text-xs overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: template.html }}
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
                    {template.name}
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full ml-2 bg-blue-100 text-blue-800">
                    Draft
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">{template.description || template.subject}</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-400">{template.createdAt ? new Date(template.createdAt).toLocaleDateString('en-AU', { dateStyle: 'medium' }) : 'Unknown'}</span>
                  <Edit className="h-3 w-3 text-gray-400 ml-2" />
                  <span className="text-xs text-gray-400">{template.updatedAt ? new Date(template.updatedAt).toLocaleDateString('en-AU', { dateStyle: 'medium' }) : 'Unknown'}</span>
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
                    <span className="inline-block text-xs px-3 py-1 rounded-full mt-1 bg-blue-100 text-blue-800">
                      Template
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTemplate(null)}
                >
                  <span className="text-lg">×</span>
                </Button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Template Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 text-gray-500">📄</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Description</p>
                      <p className="text-sm text-gray-600">{selectedTemplate.description || selectedTemplate.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 text-gray-500">📅</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Created</p>
                      <p className="text-sm text-gray-600">{selectedTemplate.createdAt && !isNaN(Date.parse(selectedTemplate.createdAt)) ? new Date(selectedTemplate.createdAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="h-5 w-5 text-gray-500">📝</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Updated</p>
                      <p className="text-sm text-gray-600">{selectedTemplate.updatedAt && !isNaN(Date.parse(selectedTemplate.updatedAt)) ? new Date(selectedTemplate.updatedAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown'}</p>
                    </div>
                  </div>
                </div>

                {/* Email Content Preview */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Email Content Preview</h3>
                  <div className="bg-gray-50 rounded-lg p-4 min-h-32">
                    {selectedTemplate.html ? (
                      <div 
                        className="text-sm text-gray-700"
                        dangerouslySetInnerHTML={{ __html: selectedTemplate.html }}
                      />
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <span className="h-12 w-12 mx-auto mb-2 opacity-50">📭</span>
                        <p>No content available</p>
                        <p className="text-xs">Click "Edit Template" to add content</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-2 p-6 border-t justify-end">
                <Button size="sm" variant="outline" onClick={() => { setShowEditor(true); setEditorMode('edit'); }}>✏️ Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => { setShowDeleteDialog(true); }}>🗑️ Delete</Button>
                <Button size="sm" onClick={() => setSelectedTemplate(null)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </Dialog>

      {/* Create/Edit Modal with drag-and-drop editor */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center p-6 border-b border-[var(--border)] bg-white dark:bg-gray-900 z-10">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                {editorMode === "edit" && selectedTemplate ? `Edit Template: ${selectedTemplate.name}` : "Create Template"}
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Design your email template using the drag-and-drop editor
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowEditor(false)}>
              Close
            </Button>
            <input
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              id="import-design-input"
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
              className="ml-2"
            >
              Import Design
            </Button>
          </div>

          {/* Editor - Fullscreen */}
          <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
            <EmailEditor
              ref={emailEditorRef}
              onReady={() => {
                setEmailEditorLoaded(true);
                // Load design if editing
                if (editorMode === "edit" && selectedTemplate && emailEditorRef.current?.editor) {
                  try {
                    // Try to parse design from html if available
                    if (selectedTemplate.html) {
                      let design = null;
                      try {
                        design = JSON.parse(selectedTemplate.html);
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
              }}
              options={{
                appearance: {
                  theme: 'light',
                  panels: { tools: { dock: 'left' } }
                },
                projectId: 1234,
                locale: 'en-US',
                features: { preview: true, stockImages: true }
              }}
              style={{ flex: 1, width: '100%', height: '100%' }}
            />
          </div>

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-end items-center p-6 border-t border-[var(--border)] bg-gray-50 dark:bg-gray-800 z-10 gap-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowEditor(false)}>
                Cancel
              </Button>
              <Button onClick={() => handleSave("draft")}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                Save as Draft
              </Button>
              <Button onClick={() => handleSave("finalised")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Finalise Template
              </Button>
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
            {modalError && <div className="text-red-600 mb-2">{modalError}</div>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNameModal(false)}>Cancel</Button>
              <Button onClick={handleNameModalConfirm} className="bg-primary text-white">Continue</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateEditor({
  mode,
  template,
  onSave,
  onCancel,
}: {
  mode: "create" | "edit";
  template: Template | null;
  onSave: (template: Partial<Template>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(template?.name || "");
  const [subject, setSubject] = useState(template?.subject || "");
  const [description, setDescription] = useState(template?.description || "");
  const [html, setHtml] = useState(template?.html || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, subject, description, html });
  };


  return (
    <form className="p-6" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4">{mode === "edit" ? "Edit" : "Create"} Template</h2>
      <Input
        placeholder="Template name"
        value={name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        className="mb-4"
        required
      />
      <Input
        placeholder="Email subject"
        value={subject}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
        className="mb-4"
        required
      />
      <Input
        placeholder="Short description"
        value={description}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
        className="mb-4"
      />
      <textarea
        placeholder="Email HTML content"
        value={html}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setHtml(e.target.value)}
        className="mb-4 w-full h-32 border rounded"
        required
      />
      <div className="flex gap-2 mt-4">
        <Button type="submit">Save</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
