"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  type: "workshop" | "event" | "community" | "special" | "promotion";
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
  { label: "Workshop", value: "workshop" },
  { label: "Event", value: "event" },
  { label: "Community", value: "community" },
  { label: "Special", value: "special" },
  { label: "Promotion", value: "promotion" },
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
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const campaignId = searchParams.get('id');
  
  const [campaign, setCampaign] = useState<Campaign>({
    id: undefined,
    title: "",
    description: "",
    type: "workshop",
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
  const [showPreview, setShowPreview] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [emailEditorLoaded, setEmailEditorLoaded] = useState(false);
  const [emailDesign, setEmailDesign] = useState<any>(null);
  const emailEditorRef = useRef<EditorRef>(null);

  const onEmailEditorReady = () => {
    setEmailEditorLoaded(true);
    // Load existing design if available
    if (campaign.design) {
      const unlayer = emailEditorRef.current?.editor;
      unlayer?.loadDesign(campaign.design);
    }
  };

  // Fetch campaign data if ID is provided
  useEffect(() => {
    if (campaignId) {
      fetchCampaignData();
    }
  }, [campaignId]);

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
          type: campaignData.type || "workshop",
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

  const saveCampaign = async () => {
    if (!campaign.title.trim()) {
      setMessage("Error: Campaign title is required");
      return;
    }

    setIsLoading(true);
    setMessage("Saving campaign...");
    
    try {
      // Get current design from editor if it's open
      let html = campaign.content;
      if (showEditor && emailEditorRef.current?.editor) {
        const unlayer = emailEditorRef.current.editor;
        await new Promise((resolve) => {
          unlayer.exportHtml((data: any) => {
            html = data.html;
            resolve(data);
          });
        });
      }

      const campaignData = {
        title: campaign.title,
        type: campaign.type,
        status: campaign.status,
        targetGroups: campaign.targetGroups,
        content: html,
        design: campaign.design,
        createdBy: user?.userId
      };

      // Create or update campaign
      let response;
      if (campaign.id) {
        // Update existing campaign
        response = await fetch(`/api/campaigns/${campaign.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(campaignData),
        });
      } else {
        // Create new campaign
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
        setCampaign(prev => ({ ...prev, id: result.id || prev.id, content: html }));
        setShowEditor(false); // Exit back to builder
        
        // Redirect to campaigns page after a short delay
        setTimeout(() => {
          router.push('/campaigns');
        }, 1500);
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
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="py-8 px-[10%]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Target className="h-8 w-8" />
          Campaign Builder
        </h1>
        <p className="text-gray-600">Create and design email campaigns with scheduling</p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="w-full">
        {/* Campaign Details */}
        <Card>
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
                  className="w-full text-black border-2 border-gray-300 focus:border-blue-500"
                />
              </div>

              <div className="flex gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Campaign Type</label>
                  <Select
                    value={campaign.type}
                    onValueChange={(value) => setCampaign(prev => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger className="border-2 border-gray-300 w-32">
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
                    onValueChange={(value) => setCampaign(prev => ({ ...prev, status: value as any }))}
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
                className="border rounded p-4 bg-gray-50"
                dangerouslySetInnerHTML={{ __html: campaign.content }}
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
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Campaign Preview</h2>
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
                dangerouslySetInnerHTML={{ __html: campaign.content }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Editor Dialog */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center p-6 border-b border-[var(--border)] bg-white dark:bg-gray-900 z-10">
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
                    onClick={saveCampaign}
                    disabled={isLoading}
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
        </div>
      )}
    </div>
  );
}
