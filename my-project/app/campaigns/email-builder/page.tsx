"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { useAuth } from "@/app/contexts/AuthContext";

interface EmailCampaign {
  id?: number;
  title: string;
  subjectLine: string;
  senderName: string;
  senderEmail: string;
  design: any;
  htmlContent: string;
  status: string;
}

declare global {
  interface Window {
    unlayer: any;
  }
}

export default function EmailCampaignBuilder() {
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<EmailCampaign>({
    title: "",
    subjectLine: "",
    senderName: user?.firstName + " " + user?.lastName || "",
    senderEmail: user?.email || "",
    design: null,
    htmlContent: "",
    status: "draft"
  });
  
  const [editor, setEditor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Load Unlayer editor
    const script = document.createElement("script");
    script.src = "https://unpkg.com/unlayer@latest/dist/unlayer.js";
    script.onload = initializeEditor;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const initializeEditor = () => {
    if (window.unlayer) {
      const editorInstance = window.unlayer.createEditor({
        id: "email-editor",
        displayMode: "emailMode",
        customJS: [
          window.location.protocol + "//" + window.location.host + "/unlayer.js"
        ],
        customCSS: [
          window.location.protocol + "//" + window.location.host + "/unlayer.css"
        ]
      });

      setEditor(editorInstance);
    }
  };

  const saveDesign = async () => {
    if (!editor) return;

    setIsLoading(true);
    setMessage("");

    try {
      // Export design as JSON
      const designJson = await editor.saveDesign();
      
      // Export HTML
      const htmlContent = await editor.exportHtml();

      setCampaign(prev => ({
        ...prev,
        design: designJson,
        htmlContent: htmlContent.html
      }));

      setMessage("Design saved successfully!");
    } catch (error) {
      setMessage("Error saving design: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCampaign = async () => {
    if (!campaign.title || !campaign.subjectLine || !campaign.htmlContent) {
      setMessage("Please fill in all required fields and save the design first.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...campaign,
          type: "event",
          date: new Date().toISOString().split('T')[0],
          createdBy: user?.userId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Campaign saved successfully!");
        setCampaign(prev => ({ ...prev, id: data.id }));
      } else {
        setMessage("Error saving campaign: " + data.error);
      }
    } catch (error) {
      setMessage("Error saving campaign: " + error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDesign = async (designJson: any) => {
    if (!editor) return;

    try {
      await editor.loadDesign(designJson);
      setMessage("Design loaded successfully!");
    } catch (error) {
      setMessage("Error loading design: " + error);
    }
  };

  return (
    <div className="py-8 px-[10%]">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          Email Campaign Builder
        </h1>
        <p className="text-gray-600">Design and create email campaigns with the Unlayer editor</p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Settings */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Campaign Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Campaign Title *</label>
                <Input
                  value={campaign.title}
                  onChange={(e) => setCampaign(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter campaign title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subject Line *</label>
                <Input
                  value={campaign.subjectLine}
                  onChange={(e) => setCampaign(prev => ({ ...prev, subjectLine: e.target.value }))}
                  placeholder="Enter email subject"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sender Name</label>
                <Input
                  value={campaign.senderName}
                  onChange={(e) => setCampaign(prev => ({ ...prev, senderName: e.target.value }))}
                  placeholder="Sender name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sender Email</label>
                <Input
                  type="email"
                  value={campaign.senderEmail}
                  onChange={(e) => setCampaign(prev => ({ ...prev, senderEmail: e.target.value }))}
                  placeholder="sender@example.com"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={saveDesign} 
                  disabled={isLoading || !editor}
                  className="flex-1"
                >
                  Save Design
                </Button>
                <Button 
                  onClick={saveCampaign} 
                  disabled={isLoading || !campaign.htmlContent}
                  className="flex-1"
                >
                  Save Campaign
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Editor */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Email Designer</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                id="email-editor" 
                style={{ height: "600px", width: "100%" }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}