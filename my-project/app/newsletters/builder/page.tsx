"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import EmailEditor, { EditorRef } from "react-email-editor";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { Target, Save, CheckCircle, Loader2, FileText, Eye, X } from "lucide-react";

type Newsletter = {
  id: string;
  title: string;
  status: "draft" | "finalised";
  content?: string;
  design?: any;
  createdAt?: string;
  updatedAt?: string;
};

export default function NewsletterBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const newsletterId = searchParams.get('id');
  const [newsletter, setNewsletter] = useState<Newsletter>({
    id: '',
    title: '',
    status: 'draft',
    content: '',
    design: null,
  });
  const [showEditor, setShowEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [emailEditorLoaded, setEmailEditorLoaded] = useState(false);
  const [emailDesign, setEmailDesign] = useState<any>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [showFinalisedConfirm, setShowFinalisedConfirm] = useState(false);
  const emailEditorRef = useRef<EditorRef>(null);

  // Load existing newsletter data when editing
  useEffect(() => {
    if (newsletterId) {
      const fetchNewsletter = async () => {
        try {
          const response = await fetch(`/api/newsletters/${newsletterId}`);
          if (response.ok) {
            const newsletterData = await response.json();
            setNewsletter({
              id: String(newsletterData.id),
              title: newsletterData.title,
              status: newsletterData.status,
              content: newsletterData.content,
              design: newsletterData.design ? JSON.parse(newsletterData.design) : null,
              createdAt: newsletterData.created_at || newsletterData.createdAt,
              updatedAt: newsletterData.updated_at || newsletterData.updatedAt,
            });
            setEmailDesign(newsletterData.design ? JSON.parse(newsletterData.design) : null);
          } else {
            setMessage("Error: Failed to load newsletter");
          }
        } catch (error) {
          console.error("Error loading newsletter:", error);
          setMessage("Error: Failed to load newsletter");
        }
      };
      fetchNewsletter();
    }
  }, [newsletterId]);

  const onEmailEditorReady = () => {
    setEmailEditorLoaded(true);
    const unlayer = emailEditorRef.current?.editor;
    if (newsletter.design) {
      try {
        unlayer?.loadDesign(newsletter.design);
      } catch (e) {
        console.error('Failed to load design:', e);
      }
    }
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "finalised":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusChange = (value: string) => {
    if (value === 'finalised') {
      setShowFinalisedConfirm(true);
    } else {
      setNewsletter(prev => ({ ...prev, status: value as Newsletter['status'] }));
    }
  };

  const confirmFinalised = () => {
    setNewsletter(prev => ({ ...prev, status: 'finalised' }));
    setShowFinalisedConfirm(false);
  };

  const saveNewsletter = async () => {
    if (!newsletter.title.trim()) {
      setMessage("Error: Newsletter title is required");
      return;
    }

    setIsLoading(true);
    setMessage("Saving newsletter...");

    try {
      let html = newsletter.content;
      let design = newsletter.design;
      // Try to get latest design/html from editor when available
      if (emailEditorRef.current?.editor) {
        const unlayer = emailEditorRef.current.editor;
        await new Promise<void>((resolve) => {
          unlayer.saveDesign((designData: any) => {
            design = designData;
            unlayer.exportHtml((data: any) => {
              html = data.html;
              resolve();
            });
          });
        });
      }

      const newsletterData = {
        title: newsletter.title.trim(),
        status: newsletter.status,
        content: html,
        design: design,
        finalisedAt: newsletter.status === 'finalised' ? new Date().toISOString() : null,
      };

      let response;
      if (newsletter.id) {
        // Update existing newsletter
        response = await fetch(`/api/newsletters/${newsletter.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newsletterData),
        });
      } else {
        // Create new newsletter
        response = await fetch('/api/newsletters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newsletterData),
        });
      }

      if (response.ok) {
        setMessage("Newsletter saved successfully!");
        // Redirect to newsletters page after a short delay
        setTimeout(() => {
          router.push('/newsletters');
        }, 1500);
      } else {
        const errorData = await response.json();
        setMessage(`Error: ${errorData.error || 'Failed to save newsletter'}`);
      }
    } catch (error) {
      console.error("Save error:", error);
      setMessage("Error: Failed to save newsletter");
    } finally {
      setIsLoading(false);
    }
  };

  const saveNewsletterAsTemplate = async () => {
    if (!newsletter.title.trim()) {
      setMessage("Error: Newsletter title is required");
      return;
    }

    setIsLoading(true);
    setMessage("Saving newsletter as template...");

    try {
      let html = newsletter.content;
      let design = newsletter.design;
      
      // Try to get latest design/html from editor when available
      if (emailEditorRef.current?.editor) {
        const unlayer = emailEditorRef.current.editor;
        await new Promise<void>((resolve) => {
          unlayer.saveDesign((designData: any) => {
            design = designData;
            unlayer.exportHtml((data: any) => {
              html = data.html;
              resolve();
            });
          });
        });
      }

      const templateData = {
        name: `${newsletter.title} Template`,
        subject: newsletter.title,
        type: 'newsletter',
        design: design,
        content: html,
      };

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        setMessage("Newsletter saved as template successfully!");
        // Redirect to templates page after a short delay
        setTimeout(() => {
          router.push('/templates');
        }, 1500);
      } else {
        const errorData = await response.json();
        setMessage(`Error: ${errorData.error || 'Failed to save as template'}`);
      }
    } catch (error) {
      console.error("Save as template error:", error);
      setMessage("Error: Failed to save as template");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Message Display */}
      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.includes('Error') ? 'bg-red-50 text-red-700' : 
          message.includes('successfully') ? 'bg-green-50 text-green-700' : 
          'bg-blue-50 text-blue-700'
        }`}>
          {message}
        </div>
      )}

      <div className="w-full">
        {/* Newsletter Details */}
        <Card className="relative">
          {isLoadingTemplate && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Loading template...</span>
              </div>
            </div>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Newsletter Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Newsletter Title *</label>
                <Input
                  value={newsletter.title}
                  onChange={(e) => setNewsletter(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter newsletter title"
                  className="w-full text-black border-2 border-gray-300 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <Select
                  value={newsletter.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="border-2 border-gray-300 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="finalised">Finalised</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Current Status:</span>
                <Badge className={getStatusColor(newsletter.status)}>
                  {newsletter.status}
                </Badge>
              </div>

              <Button
                onClick={() => setShowEditor(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={!newsletter.title.trim()}
              >
                <Eye className="h-4 w-4 mr-2" />
                Open Editor
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        {newsletter.content && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Newsletter Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="border rounded p-4 bg-gray-50"
                dangerouslySetInnerHTML={{ __html: newsletter.content }}
              />
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <Button
            onClick={saveNewsletter}
            disabled={isLoading || !newsletter.title.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Saving..." : "Save Newsletter"}
          </Button>
        </div>
      </div>

      {/* Finalised Confirmation Dialog */}
      {showFinalisedConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <h2 className="text-xl font-bold mb-4">Finalise Newsletter</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to finalise this newsletter? Once finalised, it cannot be edited.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowFinalisedConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmFinalised}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalise
              </Button>
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
                Newsletter Builder
              </h2>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">
                Design your email newsletter using the drag-and-drop editor
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
              style={{ flex: 1, width: '100%', height: '100%' }}
            />
          </div>

          {/* Footer */}
          <div className="w-full mx-auto flex flex-col sm:flex-row justify-between items-center p-6 border-t border-[var(--border)] bg-gray-50 dark:bg-gray-800 z-10 gap-4" style={{ flex: '0 0 auto' }}>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  const unlayer = emailEditorRef.current?.editor;
                  if (!unlayer) return;
                  unlayer.saveDesign((designData: any) => {
                    unlayer.exportHtml((data: any) => {
                      const { html } = data;
                      setNewsletter(prev => ({ ...prev, content: html, design: designData }));
                      setMessage('Editor changes applied. Review and click "Save Newsletter" to persist.');
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
                onClick={() => {
                  const unlayer = emailEditorRef.current?.editor;
                  if (!unlayer) return;
                  unlayer.saveDesign((designData: any) => {
                    unlayer.exportHtml((data: any) => {
                      const { html } = data;
                      setNewsletter(prev => ({ ...prev, content: html, design: designData }));
                      setMessage('Editor changes applied. Review and click "Save Newsletter" to persist.');
                      setShowEditor(false);
                    });
                  });
                }}
                variant="outline"
                className="border-primary text-primary hover:bg-primary/10"
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button 
                onClick={() => {
                  const unlayer = emailEditorRef.current?.editor;
                  if (!unlayer) return;
                  unlayer.saveDesign((designData: any) => {
                    unlayer.exportHtml((data: any) => {
                      const { html } = data;
                      setNewsletter(prev => ({ ...prev, content: html, design: designData, status: 'finalised' }));
                      setMessage('Newsletter finalised! Review and click "Save Newsletter" to persist.');
                      setShowEditor(false);
                    });
                  });
                }}
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