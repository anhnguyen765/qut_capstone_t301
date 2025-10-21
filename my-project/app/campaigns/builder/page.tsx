"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { Checkbox } from "@/app/components/ui/checkbox";
import { useAuth } from "@/app/contexts/AuthContext";
import { Save, Eye, Send, Calendar, Target, Users, Clock, X, FileText, Loader2 } from "lucide-react";
import EmailEditor, { EditorRef } from "react-email-editor";

interface Campaign {
  id?: number;
  title: string;
  description: string;
  type: "app" | "classes" | "fishing_comps" | "oshc_vacation_care" | "promotion" | "other";
  status: "draft" | "finalised";
  design: any;
  content: string;
  targetGroups: string[];
  scheduleDate?: string;
  scheduleTime?: string;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
}

const CAMPAIGN_TYPES = [
  { label: "App", value: "app" },
  { label: "Classes", value: "classes" },
  { label: "Fishing Comps", value: "fishing_comps" },
  { label: "OSHC/Vacation Care", value: "oshc_vacation_care" },
  { label: "Promotion", value: "promotion" },
  { label: "Other", value: "other" },
];

const TARGET_GROUPS = [
  { label: "Companies", value: "Companies" },
  { label: "Groups", value: "Groups" },
  { label: "Private", value: "Private" },
  { label: "OSHC", value: "OSHC" },
  { label: "Schools", value: "Schools" },
];

declare global {
  interface Window {
    unlayer: any;
  }
}

export default function CampaignBuilder() {
  const { theme } = useTheme();
  // ...existing code...
  const [showPreview, setShowPreview] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
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
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const campaignId = searchParams.get('id');
  const fromTemplateNew = searchParams.get('fromTemplateNew');
  
  const [campaign, setCampaign] = useState<Campaign>({
    id: undefined,
    title: "",
    description: "",
    type: "app",
    status: "draft",
    design: null,
    content: "",
    targetGroups: [],
    createdBy: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  });
  
  const [editor, setEditor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [emailEditorLoaded, setEmailEditorLoaded] = useState(false);
  const [emailDesign, setEmailDesign] = useState<any>(null);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [showFinalisedConfirm, setShowFinalisedConfirm] = useState(false);
  const emailEditorRef = useRef<EditorRef>(null);

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

  const onEmailEditorReady = () => {
    setEmailEditorLoaded(true);
    const unlayer = emailEditorRef.current?.editor;
    // Only load the design if it exists
    if (campaign.design) {
      try {
        console.log('Attempting to load campaign design:', campaign.design);
        unlayer?.loadDesign(campaign.design);
      } catch (err) {
        console.error('Failed to load campaign design:', err, campaign.design);
      }
    } else {
      console.warn('No campaign design to load.');
    }
  };

  // Fetch campaign data if ID is provided
  useEffect(() => {
    if (campaignId) {
      fetchCampaignData();
    }
  }, [campaignId]);

  // Load template from session when navigated with useTemplate flag
  useEffect(() => {
    const useTemplate = searchParams.get('useTemplate');
    if (useTemplate && !campaign.design) {
      setIsLoadingTemplate(true);
      try {
        const designStr = sessionStorage.getItem('templateDesign');
        const contentStr = sessionStorage.getItem('templateContent');
        const name = sessionStorage.getItem('templateName') || '';
        const subject = sessionStorage.getItem('templateSubject') || '';
        if (designStr) {
          const design = JSON.parse(designStr);
          const previewContent = contentStr || generatePreviewHtml(design);
          setCampaign(prev => ({
            ...prev,
            title: prev.title || name || 'New Campaign',
            description: prev.description || subject || '',
            design,
            content: previewContent,
          }));
          setMessage('Template loaded successfully! You can now customize it.');
          // Do not auto-open editor; let user review and click Open Editor
        }
      } catch (e) {
        console.error('Failed to load template from session:', e);
        setMessage('Failed to load template. Please try again.');
      } finally {
        setIsLoadingTemplate(false);
        // One-time use
        sessionStorage.removeItem('templateDesign');
        sessionStorage.removeItem('templateContent');
        sessionStorage.removeItem('templateName');
        sessionStorage.removeItem('templateSubject');
      }
    }
  }, [searchParams]);

  // Note for redirect from template creation
  useEffect(() => {
    if (fromTemplateNew) {
      setMessage("You were redirected from Templates. Fill in details and click Open Editor to start.");
      try {
        const meta = sessionStorage.getItem('templateNewMeta');
        if (meta) {
          const parsed = JSON.parse(meta);
          setCampaign(prev => ({ ...prev, title: prev.title || parsed.name || '', description: prev.description || parsed.subject || '' }));
          sessionStorage.removeItem('templateNewMeta');
        }
      } catch {}
    }
  }, [fromTemplateNew]);

  const fetchCampaignData = async () => {
    if (!campaignId) return;
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (response.ok) {
        const data = await response.json();
        const campaignData = data.campaign;
        
        setCampaign({
          id: campaignData.id,
          title: campaignData.title || "",
          description: campaignData.description || "",
          type: campaignData.type || "app",
          status: campaignData.status || "draft",
          design: campaignData.design ? JSON.parse(campaignData.design) : null,
          content: campaignData.content || "",
          targetGroups: campaignData.target_groups ? campaignData.target_groups.split(",") : [],
          createdBy: campaignData.created_by,
          createdAt: campaignData.created_at,
          updatedAt: campaignData.updated_at,
        });
      } else {
        setMessage("Error loading campaign data");
      }
    } catch (error) {
      console.error("Error fetching campaign:", error);
      setMessage("Error loading campaign data");
    }
  };

  const handleCloseEditor = () => {
    setShowEditor(false);
  };

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'finalised' && campaign.status !== 'finalised') {
      setShowFinalisedConfirm(true);
    } else {
      setCampaign(prev => ({ ...prev, status: newStatus as any }));
    }
  };

  const confirmFinalised = () => {
    setCampaign(prev => ({ ...prev, status: 'finalised' }));
    setShowFinalisedConfirm(false);
    setMessage('Campaign status changed to finalised. You can duplicate it to make edits.');
  };

  const saveCampaign = async () => {
    if (!campaign.title.trim()) {
      setMessage("Error: Campaign title is required");
      return;
    }

    setIsLoading(true);
    setMessage("Saving campaign...");

    try {
      let html = campaign.content;
      let design = campaign.design;
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

      const campaignData = {
        ...campaign,
        content: html,
        design,
        createdBy: user?.userId
      };

      // Create or update campaign
      let response;
      if (campaign.id) {
        response = await fetch(`/api/campaigns/${campaign.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(campaignData),
        });
      } else {
        response = await fetch("/api/campaigns", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(campaignData),
        });
      }


      if (response.ok) {
        const result = await response.json();
        const action = campaign.id ? "updated" : "saved";
        setMessage(`Campaign ${action} successfully!`);
        setCampaign(prev => ({ ...prev, id: result.id || prev.id, content: html, design }));
        // Stay on builder after save; close editor if it was open
        setShowEditor(false);
        // Navigate to dashboard after saving
        router.push('/campaigns');
      } else {
        setMessage("Error saving campaign");
      }
      setIsLoading(false);
    } catch (error) {
      setMessage("Error saving campaign: " + error);
      setIsLoading(false);
    }
  };


  const previewCampaign = async () => {
    try {
      const unlayer = emailEditorRef.current?.editor;
      unlayer?.exportHtml((data: any) => {
        const { html } = data;
        setCampaign(prev => ({ ...prev, content: html }));
        setShowPreview(true);
      });
    } catch (error) {
      setMessage("Error generating preview: " + error);
    }
  };

  const handleTargetGroupChange = (group: string, checked: boolean) => {
    if (checked) {
      setCampaign(prev => ({ ...prev, targetGroups: [...prev.targetGroups, group] }));
    } else {
      setCampaign(prev => ({ ...prev, targetGroups: prev.targetGroups.filter(g => g !== group) }));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "finalised":
        return "bg-green-100 text-green-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <div className="py-8 px-0 w-full max-w-none">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-foreground">
          <Target className="h-8 w-8" />
          Campaign Builder
        </h1>
        <p className="text-muted-foreground">Create and design email campaigns with scheduling</p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="w-full">
        {/* Campaign Details */}
        <Card className="relative">
          {isLoadingTemplate && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-lg">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-medium">Loading template...</span>
              </div>
            </div>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Campaign Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Campaign Title *</label>
                <Input
                  value={campaign.title}
                  onChange={(e) => setCampaign(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter campaign title"
                  className="w-full border-2 border-border focus:border-primary"
                />
              </div>

              <div className="flex gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Campaign Type</label>
                  <Select
                    value={campaign.type}
                    onValueChange={(value) => setCampaign(prev => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger className="border-2 border-border w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMPAIGN_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select
                    value={campaign.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="border-2 border-border w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="finalised">Finalised</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>



            <div>
              <label className="block text-sm font-medium mb-1">Target Groups</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {TARGET_GROUPS.map((group) => (
                  <div key={group.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={group.value}
                      checked={campaign.targetGroups.includes(group.value)}
                      onCheckedChange={(checked) => handleTargetGroupChange(group.value, checked as boolean)}
                      className="border-2 border-gray-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label htmlFor={group.value} className="text-sm">
                      {group.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Current Status:</span>
                <Badge className={getStatusColor(campaign.status)}>
                  {campaign.status}
                </Badge>
              </div>

              <Button
                onClick={() => setShowEditor(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={!campaign.title.trim()}
              >
                <Eye className="h-4 w-4 mr-2" />
                Open Editor
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        {campaign.content && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Campaign Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="border border-border rounded p-4 bg-background email-preview-container email-preview-wrapper"
                dangerouslySetInnerHTML={{ __html: campaign.content }}
                style={{
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)'
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mt-6">
          <Button
            onClick={saveCampaign}
            disabled={isLoading || !campaign.title.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Saving..." : "Save Campaign"}
          </Button>
        </div>
      </div>


      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-card-foreground">Campaign Preview</h2>
                <Button
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  Close
                </Button>
              </div>
              <div 
                className="border border-border rounded p-4 bg-background email-preview-container email-preview-wrapper"
                dangerouslySetInnerHTML={{ __html: campaign.content }}
                style={{
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Editor Dialog */}
      {showEditor && (
  <div className="fixed inset-0 z-50 flex flex-col bg-background w-full max-w-none px-4 py-3 gap-4" style={{ maxHeight: '100vh' }}>
          {/* Header */}
          <div className="w-full mx-auto flex flex-col sm:flex-row justify-between items-center border-b border-border bg-background z-10" style={{ flex: '0 0 auto' }}>
            <div className="mb-4 sm:mb-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">
                Campaign Builder
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
          <div className="w-full mx-auto flex-1 flex flex-col overflow-auto gap-4">
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
              style={{ height: '100%', width: '100%', marginBottom: 0 }}
            />
          </div>

          {/* Footer */}
          <div className="w-full mx-auto flex flex-col sm:flex-row justify-between items-center z-20 bg-background border-t border-border px-4 py-3" style={{ position: 'sticky', bottom: 0, flex: '0 0 auto' }}>
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
                    a.download = `${campaign.title}.html`;
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
                          setCampaign(prev => ({ ...prev, design: designData, content: html }));
                          setMessage('Editor changes applied. Review and click "Save Campaign" to persist.');
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

      {/* Finalised Confirmation Dialog */}
      {showFinalisedConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-card-foreground">Finalise Campaign</h2>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to finalise this campaign? Once finalised, you won't be able to edit it directly, but you can duplicate it to make changes.
            </p>
            <div className="flex justify-end gap-2">
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
                Yes, Finalise
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
