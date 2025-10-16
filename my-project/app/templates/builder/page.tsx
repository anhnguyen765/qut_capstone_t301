"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { useAuth } from "@/app/contexts/AuthContext";
import { Save, Eye, FileText, Loader, X } from "lucide-react";
import EmailEditor, { EditorRef } from "react-email-editor";

interface Template {
  id?: number;
  name: string;
  subject: string;
  type: "campaign" | "newsletter";
  design: any;
  content: string;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

declare global {
  interface Window {
    unlayer: any;
  }
}

export default function TemplateBuilder() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const templateId = searchParams.get('id');
  
  const [template, setTemplate] = useState<Template>({
    id: undefined,
    name: "",
    subject: "",
    type: "campaign",
    design: null,
    content: "",
    createdBy: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [emailEditorLoaded, setEmailEditorLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const emailEditorRef = useRef<EditorRef>(null);

  // Prevent background scroll when editor is open
  useEffect(() => {
    if (showEditor) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [showEditor]);

  const onEmailEditorReady = () => {
    setEmailEditorLoaded(true);
    const unlayer = emailEditorRef.current?.editor;
    // Only load the design if it exists
    if (template.design) {
      try {
        console.log('Attempting to load template design:', template.design);
        unlayer?.loadDesign(template.design);
      } catch (err) {
        console.error('Failed to load template design:', err, template.design);
      }
    } else {
      console.warn('No template design to load.');
    }
  };

  // Fetch template data if ID is provided
  useEffect(() => {
    if (templateId) {
      fetchTemplateData();
    }
  }, [templateId]);

  const fetchTemplateData = async () => {
    if (!templateId) return;
    
    try {
      const response = await fetch(`/api/templates/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        const templateData = data.template;
        
        setTemplate({
          id: templateData.id,
          name: templateData.name || "",
          subject: templateData.subject || "",
          type: templateData.type || "campaign",
          design: templateData.design ? JSON.parse(templateData.design) : null,
          content: templateData.content || "",
          createdBy: templateData.created_by,
          createdAt: templateData.created_at,
          updatedAt: templateData.updated_at,
        });
      } else {
        setMessage("Error loading template data");
      }
    } catch (error) {
      console.error("Error fetching template:", error);
      setMessage("Error loading template data");
    }
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
  };

  const saveTemplate = async () => {
    if (!template.name.trim()) {
      setMessage("Error: Template name is required");
      return;
    }

    setIsLoading(true);
    setMessage("Saving template...");

    try {
      let html = template.content;
      let design = template.design;
      // Try to get latest design/html from editor when available
      if (emailEditorRef.current?.editor) {
        const unlayer = emailEditorRef.current.editor;
        // Get the design
        await new Promise((resolve) => {
          unlayer.saveDesign((data: any) => {
            design = data;
            resolve(data);
          });
        });
        // Get the HTML
        await new Promise((resolve) => {
          unlayer.exportHtml((data: any) => {
            html = data.html;
            resolve(data);
          });
        });
      }

      const templateData = {
        ...template,
        content: html,
        design,
        createdBy: user?.userId
      };

      // Create or update template
      let response;
      if (template.id) {
        response = await fetch(`/api/templates/${template.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templateData),
        });
      } else {
        response = await fetch("/api/templates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templateData),
        });
      }

      if (response.ok) {
        const result = await response.json();
        const action = template.id ? "updated" : "saved";
        setMessage(`Template ${action} successfully!`);
        setTemplate(prev => ({ ...prev, id: result.id || prev.id, content: html, design }));
        // Stay on builder after save; close editor if it was open
        setShowEditor(false);
        // Navigate to templates page after saving
        router.push('/templates');
      } else {
        setMessage("Error saving template");
      }
      setIsLoading(false);
    } catch (error) {
      setMessage("Error saving template: " + error);
      setIsLoading(false);
    }
  };

  const previewTemplate = async () => {
    try {
      const unlayer = emailEditorRef.current?.editor;
      unlayer?.exportHtml((data: any) => {
        const { html } = data;
        setTemplate(prev => ({ ...prev, content: html }));
        setShowPreview(true);
      });
    } catch (error) {
      setMessage("Error generating preview: " + error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "campaign":
        return "bg-blue-100 text-blue-800";
      case "newsletter":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="py-8 px-0 w-full max-w-none">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Template Builder
        </h1>
        <p className="text-gray-600">Create and design email templates for campaigns and newsletters</p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="w-full">
        {/* Template Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Template Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Template Name *</label>
                <Input
                  value={template.name}
                  onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                  className="w-full text-black border-2 border-gray-300 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Template Type</label>
                  <Select
                    value={template.type}
                    onValueChange={(value) => setTemplate(prev => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger className="border-2 border-gray-300 w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="campaign">Campaign</SelectItem>
                      <SelectItem value="newsletter">Newsletter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Input
                value={template.subject}
                onChange={(e) => setTemplate(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter template description"
                className="w-full text-black border-2 border-gray-300 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Template Type:</span>
                <Badge className={getTypeColor(template.type)}>
                  {template.type}
                </Badge>
              </div>

              <Button
                onClick={() => setShowEditor(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={!template.name.trim()}
              >
                <Eye className="h-4 w-4 mr-2" />
                Open Editor
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        {template.content && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Template Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="border rounded p-4 bg-gray-50"
                dangerouslySetInnerHTML={{ __html: template.content }}
              />
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <Button
            onClick={saveTemplate}
            disabled={isLoading || !template.name.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <Loader className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Saving..." : "Save Template"}
          </Button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Template Preview</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  Close
                </Button>
              </div>
              <div 
                className="border rounded p-4"
                dangerouslySetInnerHTML={{ __html: template.content }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Editor Dialog */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900 w-full max-w-none px-4 py-3 gap-4" style={{ maxHeight: '100vh' }}>
          {/* Header */}
          <div className="w-full mx-auto flex flex-col sm:flex-row justify-between items-center border-b border-[var(--border)] bg-white dark:bg-gray-900 z-10" style={{ flex: '0 0 auto' }}>
            <div className="mb-4 sm:mb-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                Template Builder
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Design your email template using the drag-and-drop editor
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCloseEditor}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Editor - Responsive and centered */}
          <div className="w-full mx-auto flex-1 flex flex-col overflow-auto gap-4">
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
              style={{ height: '100%', width: '100%', marginBottom: 0 }}
            />
          </div>

          {/* Footer */}
          <div className="w-full mx-auto flex flex-col sm:flex-row justify-between items-center z-20 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3" style={{ position: 'sticky', bottom: 0, flex: '0 0 auto' }}>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  const unlayer = emailEditorRef.current?.editor;
                  unlayer?.showPreview({ device: 'desktop' });
                }}
                className="border-primary text-primary hover:bg-primary/10"
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
                    a.download = `${template.name}.html`;
                    a.click();
                  });
                }}
                className="border-primary text-primary hover:bg-primary/10"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export HTML
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleCloseEditor}
                className="border-primary text-primary hover:bg-primary/10"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  const unlayer = emailEditorRef.current?.editor;
                  if (!unlayer) return;
                  // Export current editor state back to builder without persisting
                  unlayer.saveDesign((designData: any) => {
                    unlayer.exportHtml((data: any) => {
                      const { html } = data;
                      setTemplate(prev => ({ ...prev, design: designData, content: html }));
                      setMessage('Editor changes applied. Review and click "Save Template" to persist.');
                      setShowEditor(false);
                    });
                  });
                }}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Save className="h-4 w-4 mr-2" />
                Apply Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
