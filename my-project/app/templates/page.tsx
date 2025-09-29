"use client";
import { useEffect, useState, useRef } from "react";
import EmailEditor, { EditorRef } from 'react-email-editor';
import { Button } from "@/app/components/ui/button";

// ...removed TemplateForm...

export default function TemplatesPage() {
  const [search, setSearch] = useState("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editTemplate, setEditTemplate] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const emailEditorRef = useRef<EditorRef>(null);
  const [templateName, setTemplateName] = useState("");
  const [templateSubject, setTemplateSubject] = useState("");

  useEffect(() => {
    fetch("/api/templates")
      .then(res => res.json())
      .then(data => {
        setTemplates(data.templates || []);
        setError(null);
      })
      .catch(() => setError("Failed to load templates."))
      .finally(() => setLoading(false));
  }, []);

  // Open editor for new or edit
  const openEditor = (template?: any) => {
    setEditTemplate(template || null);
    setTemplateName(template?.name || "");
    setTemplateSubject(template?.subject || "");
    setShowForm(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowForm(false);
    setShowEditor(true);
    setTimeout(() => {
      if (editTemplate?.content && emailEditorRef.current && emailEditorRef.current.editor) {
        try {
          emailEditorRef.current.editor.loadDesign(JSON.parse(editTemplate.content));
        } catch {}
      } else if (emailEditorRef.current && emailEditorRef.current.editor) {
        emailEditorRef.current.editor.loadDesign({
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
    }, 300);
  };

  const handleSave = async () => {
    if (!templateName || !templateSubject) return;
    if (emailEditorRef.current?.editor) {
      emailEditorRef.current.editor.exportHtml(async (data: any) => {
        const { design, html } = data;
        const method = editTemplate ? "PUT" : "POST";
        const body = editTemplate ? { id: editTemplate.id, name: templateName, subject: templateSubject, content: JSON.stringify(design), html } : { name: templateName, subject: templateSubject, content: JSON.stringify(design), html };
        await fetch("/api/templates", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        setShowEditor(false);
        setEditTemplate(null);
        setLoading(true);
        fetch("/api/templates")
          .then(res => res.json())
          .then(data => {
            setTemplates(data.templates || []);
            setError(null);
          })
          .catch(() => setError("Failed to load templates."))
          .finally(() => setLoading(false));
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this template?")) return;
    await fetch("/api/templates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setLoading(true);
    fetch("/api/templates")
      .then(res => res.json())
      .then(data => {
        setTemplates(data.templates || []);
        setError(null);
      })
      .catch(() => setError("Failed to load templates."))
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen w-full py-8 px-[10%]">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          Templates
        </h1>
      </header>

      <div className="space-y-4">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-4 pr-12 p-4 border border-[var(--border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-[var(--background)] text-[var(--foreground)]"
          />
          <Button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 bg-background hover:bg-[var(--accent)] rounded-md" onClick={() => openEditor()}>
            + New Template
          </Button>
        </div>
        {/* ...existing code for showForm and showEditor... */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-8 border">
              <h2 className="text-2xl font-bold mb-6 text-blue-700">{editTemplate ? "Edit Template" : "New Template"}</h2>
              <form className="space-y-6" onSubmit={handleFormSubmit}>
                <div>
                  <label className="block text-sm font-semibold mb-2">Name</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    required
                    placeholder="Template Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Subject</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={templateSubject}
                    onChange={e => setTemplateSubject(e.target.value)}
                    required
                    placeholder="Email Subject"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300" onClick={() => { setShowForm(false); setEditTemplate(null); }}>Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700">Continue</button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showEditor && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-gray-900">
            {/* Header */}
            <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center p-6 border-b border-gray-200 bg-white dark:bg-gray-900 z-10">
              <div className="mb-4 sm:mb-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {editTemplate ? `Edit Template: ${templateName}` : 'Create Template'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Design your email template using the drag-and-drop editor
                </p>
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
                onClick={() => handleSort("name")}
                className={`${sortBy === "name" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"}`}
              >
                Name {sortBy === "name" && <ArrowUpDown className="ml-1 h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("category")}
                className={`${sortBy === "category" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"}`}
              >
                Category {sortBy === "category" && <ArrowUpDown className="ml-1 h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <Button 
            className="flex-1 sm:flex-none"
            onClick={() => router.push('/templates/builder')}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        <main className="mx-auto mt-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center p-8 bg-[var(--background)] rounded-lg shadow">
              <p className="text-[var(--foreground)]">No templates found.</p>
            </div>
          </div>
        )}
        {/* Details popup removed */}
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="bg-[var(--background)] rounded-lg shadow overflow-hidden">
            <div className="min-w-full">
              <div className="divide-y divide-[var(--border)]">
                {templates.filter(t =>
                  t.name.toLowerCase().includes(search.toLowerCase()) ||
                  t.subject.toLowerCase().includes(search.toLowerCase()) ||
                  t.content.toLowerCase().includes(search.toLowerCase())
                ).length === 0 ? (
                  <div className="text-gray-500 p-6">No templates found.</div>
                ) : (
                  templates.filter(t =>
                    t.name.toLowerCase().includes(search.toLowerCase()) ||
                    t.subject.toLowerCase().includes(search.toLowerCase()) ||
                    t.content.toLowerCase().includes(search.toLowerCase())
                  ).map(t => (
                    <div
                      key={t.id}
                      className="p-4 hover:bg-[var(--accent)] transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedTemplate(t);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <div className="flex items-start">
                        <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center mr-4">
                          <span className="text-lg font-semibold text-[var(--accent-foreground)]">
                            {t.name?.charAt(0) || 'T'}
                          </span>
                        </div>
                        <div className="flex flex-col flex-1">
                          <h4 className="font-medium text-[var(--foreground)]">{t.name}</h4>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="text-sm text-[var(--foreground)] flex items-center gap-2">
                              {t.subject}
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                              Template
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        {/* Details Modal */}
        {showDetailsDialog && selectedTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-8 border">
              <h2 className="text-2xl font-bold mb-6 text-blue-700">Template Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Name</label>
                  <div className="text-lg font-bold">{selectedTemplate.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Subject</label>
                  <div className="text-md">{selectedTemplate.subject}</div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Preview</label>
                  <div className="bg-gray-50 rounded p-4 text-sm max-h-48 overflow-auto">
                    {selectedTemplate.content ? (
                      <pre className="whitespace-pre-wrap">{selectedTemplate.content}</pre>
                    ) : (
                      <span className="text-gray-500">No content available</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-6">
                <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>Close</Button>
                <Button onClick={() => {
                  window.location.href = `/campaigns?templateId=${selectedTemplate.id}`;
                }}>Use Template</Button>
                <Button variant="outline" onClick={() => {
                  setShowDetailsDialog(false);
                  openEditor(selectedTemplate);
                }}>Edit</Button>
                <Button variant="destructive" onClick={async () => {
                  setShowDetailsDialog(false);
                  await handleDelete(selectedTemplate.id);
                }}>Delete</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
