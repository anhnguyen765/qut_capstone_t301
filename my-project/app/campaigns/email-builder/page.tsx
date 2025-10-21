"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { useAuth } from "@/app/contexts/AuthContext";
import { Checkbox } from "@/app/components/ui/checkbox";

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
  const { theme } = useTheme();
  const [campaign, setCampaign] = useState<EmailCampaign>({
    title: "",
    subjectLine: "",
    senderName: user?.firstName + " " + user?.lastName || "",
    senderEmail: user?.email || "",
    design: null,
    htmlContent: "",
    status: "draft"
  });
  const [campaignLoaded, setCampaignLoaded] = useState(false);
  
  const [editor, setEditor] = useState<any>(null);
  const [editorReady, setEditorReady] = useState(false);
  const designLoadedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  useEffect(() => {
    // Load Unlayer editor
    const script = document.createElement("script");
    script.src = "https://unpkg.com/unlayer@latest/dist/unlayer.js";
    script.onload = initializeEditor;
    document.head.appendChild(script);

    // Fetch campaign data from API (replace with your actual API endpoint and logic)
    const fetchCampaign = async () => {
      try {
        // Example: fetch the latest campaign for the user (customize as needed)
        const res = await fetch("/api/campaigns?latest=1");
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setCampaign({ ...data[0] });
          }
        }
      } catch (err) {
        // Optionally handle error
      } finally {
        setCampaignLoaded(true);
      }
    };
    fetchCampaign();

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const initializeEditor = () => {
    if (window.unlayer) {
      const editorInstance = window.unlayer.createEditor({
        id: "email-editor",
        displayMode: "emailMode",
        appearance: {
          theme: theme === 'dark' ? 'dark' : 'light',
        },
        customJS: [
          window.location.protocol + "//" + window.location.host + "/unlayer.js"
        ],
        customCSS: [
          window.location.protocol + "//" + window.location.host + "/unlayer.css"
        ]
      });
      setEditor(editorInstance);
      // Listen for Unlayer's editor:ready event
      if (editorInstance.addEventListener) {
        editorInstance.addEventListener('editor:ready', () => {
          console.log('Unlayer editor:ready event fired');
          setEditorReady(true);
        });
      } else {
        // Fallback: try to set ready after a short delay
        setTimeout(() => {
          if (editorInstance && typeof editorInstance.loadDesign === 'function') {
            console.log('Fallback: editor instance appears ready');
            setEditorReady(true);
          }
        }, 1000);
      }
    }
  };

  // Load design into editor only after editor is truly ready and campaign.design is available
  useEffect(() => {
    if (
      editor &&
      editorReady &&
      campaignLoaded &&
      campaign.design &&
      !designLoadedRef.current
    ) {
      try {
        const designObj = campaign.design;
        // Unlayer expects a design object with a 'body' property (and usually 'body.rows' or 'body.contents')
        if (!designObj || typeof designObj !== 'object') {
          console.warn('Design object is not an object:', designObj);
          setMessage('Design data is not a valid object.');
          return;
        }
        if (!designObj.body || !Array.isArray(designObj.body.rows)) {
          console.warn('Design object is missing body.rows:', designObj);
          setMessage('Design data is missing required Unlayer properties (body.rows).');
          return;
        }
        if (designObj.body.rows.length === 0) {
          console.warn('Design object loaded but body.rows is empty:', designObj);
          setMessage('Design loaded, but it is empty. Please add content and save again.');
          // Still load the empty design so the user can edit
          editor.loadDesign(designObj);
          designLoadedRef.current = true;
          return;
        }
        if (typeof editor.loadDesign !== 'function') {
          console.error('Editor does not have loadDesign method:', editor);
          setMessage('Editor is not ready for loading design.');
          return;
        }
        console.log('Attempting to load design:', designObj);
        editor.loadDesign(designObj);
        setMessage("Design loaded from database.");
        designLoadedRef.current = true;
      } catch (error) {
        setMessage("Error loading design from database: " + error);
        console.error('Error loading design:', error);
      }
    } else {
      if (!editor) console.log('Editor not set');
      if (!editorReady) console.log('Editor not ready');
      if (!campaignLoaded) console.log('Campaign not loaded');
      if (!campaign.design) console.log('No campaign design to load');
    }
  }, [editor, editorReady, campaignLoaded, campaign.design]);

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
          type: "app",
          date: new Date().toISOString().split('T')[0],
          createdBy: user?.userId
        }),
      });

      const data = await response.json();

      // Optionally save as template (independent of campaign save)
      try {
        if (saveAsTemplate && campaign.design && campaign.htmlContent) {
          await fetch('/api/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: campaign.title,
              subject: campaign.subjectLine,
              design: campaign.design,
              content: campaign.htmlContent,
              type: 'campaign'
            })
          });
        }
      } catch (e) {
        // ignore template save errors here
      }

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
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-foreground">
          Email Campaign Builder
        </h1>
        <p className="text-muted-foreground">Design and create email campaigns with the Unlayer editor</p>
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
              <div className="flex items-center gap-2 pt-2">
                <Checkbox
                  id="save-as-template"
                  checked={saveAsTemplate}
                  onCheckedChange={(checked: boolean) => setSaveAsTemplate(Boolean(checked))}
                />
                <label htmlFor="save-as-template" className="text-sm">Save as template</label>
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