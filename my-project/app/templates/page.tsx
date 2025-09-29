// Clean, working TemplatesPage with feature parity
"use client";
import React, { useState, useEffect, useRef } from "react";
import EmailEditor, { EditorRef } from "react-email-editor";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Dialog } from "@/app/components/ui/dialog";
import ConfirmationDialog from "@/app/components/ConfirmationDialog";
import { Skeleton } from "@/app/components/ui/skeleton";

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
      <Input
        placeholder="Search templates..."
        value={search}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
        className="mb-6"
      />
      {filteredTemplates.length === 0 ? (
        <div className="text-gray-500">No templates found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template, idx) => (
            <Card key={template.id ?? idx} className="p-4 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-2">{template.name}</h2>
                <div className="text-sm text-gray-600 mb-2">{template.subject}</div>
                <div className="text-xs text-gray-400 mb-2">{template.description}</div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => handleOpenDetails(template)}>
                  Details
                </Button>
                <Button size="sm" onClick={() => handleOpenEditor("edit", template)}>
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleOpenDelete(template)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        {selectedTemplate && (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-2">{selectedTemplate.name}</h2>
            <div className="mb-2">Description: {selectedTemplate.description || selectedTemplate.subject}</div>
            <div className="mb-2">Created: {selectedTemplate.createdAt && !isNaN(Date.parse(selectedTemplate.createdAt)) ? new Date(selectedTemplate.createdAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown'}</div>
            <div className="mb-2">Updated: {selectedTemplate.updatedAt && !isNaN(Date.parse(selectedTemplate.updatedAt)) ? new Date(selectedTemplate.updatedAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : 'Unknown'}</div>
            <div className="border p-2 bg-gray-50 mt-4">
              <div dangerouslySetInnerHTML={{ __html: selectedTemplate.html }} />
            </div>
            <Button className="mt-4" onClick={() => setShowDetails(false)}>
              Close
            </Button>
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
          <div className="flex flex-col sm:flex-row justify-between items-center p-6 border-t border-[var(--border)] bg-gray-50 dark:bg-gray-800 z-10 gap-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const unlayer = emailEditorRef.current?.editor;
                  unlayer?.showPreview({ device: 'desktop' });
                }}
              >
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
                    a.download = `${selectedTemplate?.name || 'template'}.html`;
                    a.click();
                  });
                }}
              >
                Export HTML
              </Button>
            </div>
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
