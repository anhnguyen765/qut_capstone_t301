"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Progress } from "@/app/components/ui/progress";
import { Toggle } from "@/app/components/ui/toggle";
import { Label } from "@/app/components/ui/label";
import { Bold, Italic, Underline, List, ListOrdered, Link, Image, Trash2 } from "lucide-react";

type Sender = {
  name: string;
  email: string;
};

type RecipientGroup = {
  id: string;
  name: string;
  emails: string[];
};

type CampaignDetails = {
  name: string;
  subject: string;
  sender: Sender | null;
  recipients: {
    groups: string[];
    individualEmails: string[];
  };
};

export default function EmailCampaignCreation() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [progress, setProgress] = useState(33);
  const [details, setDetails] = useState<CampaignDetails>({
    name: "",
    subject: "",
    sender: null,
    recipients: {
      groups: [],
      individualEmails: []
    }
  });
  const [emailContent, setEmailContent] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  // Sample data
  const senderOptions: Sender[] = [
    { name: "Marketing Team", email: "marketing@company.com" },
    { name: "Support Team", email: "support@company.com" },
    { name: "Newsletter", email: "newsletter@company.com" },
  ];

  const recipientGroups: RecipientGroup[] = [
    { id: "all-customers", name: "All Customers", emails: ["customer1@example.com", "customer2@example.com"] },
    { id: "active-users", name: "Active Users", emails: ["user1@example.com", "user2@example.com"] },
    { id: "premium-members", name: "Premium Members", emails: ["premium1@example.com", "premium2@example.com"] },
  ];

  // Formatting functions
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    updateContent();
  };

  const insertLink = () => {
    if (linkUrl) {
      formatText("createLink", linkUrl);
      setShowLinkDialog(false);
      setLinkUrl("");
    }
  };

  const updateContent = () => {
    if (editorRef.current) {
      setEmailContent(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    updateContent();
  };

  useEffect(() => {
    if (editorRef.current && !previewMode) {
      editorRef.current.innerHTML = emailContent;
    }
  }, [previewMode]);

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.sender) {
      alert("Please select a sender");
      return;
    }
    setCurrentStep(2);
    setProgress(66);
  };

  const handleDesignSubmit = () => {
    setCurrentStep(3);
    setProgress(100);
  };

  const handleSendCampaign = () => {
    console.log({ details, emailContent });
    alert("Campaign submitted successfully!");
  };

  const toggleRecipientGroup = (groupId: string) => {
    setDetails(prev => {
      const groups = [...prev.recipients.groups];
      const index = groups.indexOf(groupId);
      
      if (index === -1) {
        groups.push(groupId);
      } else {
        groups.splice(index, 1);
      }
      
      return {
        ...prev,
        recipients: {
          ...prev.recipients,
          groups
        }
      };
    });
  };

  const addIndividualEmail = () => {
    if (newEmail && !details.recipients.individualEmails.includes(newEmail)) {
      setDetails(prev => ({
        ...prev,
        recipients: {
          ...prev.recipients,
          individualEmails: [...prev.recipients.individualEmails, newEmail]
        }
      }));
      setNewEmail("");
    }
  };

  const removeIndividualEmail = (email: string) => {
    setDetails(prev => ({
      ...prev,
      recipients: {
        ...prev.recipients,
        individualEmails: prev.recipients.individualEmails.filter(e => e !== email)
      }
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl text-primary font-bold mb-6">Create Email Campaign</h1>
      
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className={`font-medium ${currentStep >= 1 ? "text-primary" : "text-muted-foreground"}`}>
            Details
          </span>
          <span className={`font-medium ${currentStep >= 2 ? "text-primary" : "text-muted-foreground"}`}>
            Design
          </span>
          <span className={`font-medium ${currentStep >= 3 ? "text-primary" : "text-muted-foreground"}`}>
            Review
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step 1: Details */}
      {currentStep === 1 && (
        <form onSubmit={handleDetailsSubmit} className="space-y-3">
          <h2 className="text-xl text-primary font-semibold">Campaign Details</h2>
          
          <div className="space-y-2">
            <div>
              <Label className="text-muted-foreground font-semibold mb-2">Campaign Name</Label>
              <Input
                className="text-muted-foreground"
                value={details.name}
                onChange={(e) => setDetails({...details, name: e.target.value})}
                placeholder="Summer Sale 2024"
                required
              />
            </div>

            <div>
              <Label className="text-muted-foreground font-semibold mb-2">Email Subject</Label>
              <Input
                className="text-muted-foreground"
                value={details.subject}
                onChange={(e) => setDetails({...details, subject: e.target.value})}
                placeholder="Don't miss our big summer sale!"
                required
              />
            </div>

            <div>
              <Label className="text-muted-foreground font-semibold mb-2">Sender</Label>
              <Select
                
                value={details.sender?.email || ""}
                onValueChange={(value) => {
                  const selectedSender = senderOptions.find(s => s.email === value);
                  if (selectedSender) {
                    setDetails({...details, sender: selectedSender});
                  }
                }}
                required
              >
                <SelectTrigger className="w-full text-muted-foreground">
                  <SelectValue placeholder="Select sender" />
                </SelectTrigger>
                <SelectContent>
                  {senderOptions.map((sender) => (
                    <SelectItem key={sender.email} value={sender.email}>
                      {sender.name} &lt;{sender.email}&gt;
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground font-semibold mb-2">Recipients</Label>
              
              <div className="space-y-2">
                <h4 className="text-sm text-muted-foreground font-medium">Groups</h4>
                <div className="flex flex-wrap gap-2">
                  {recipientGroups.map(group => (
                    <Toggle
                      key={group.id}
                      variant="outline"
                      pressed={details.recipients.groups.includes(group.id)}
                      onPressedChange={() => toggleRecipientGroup(group.id)}
                      className="h-8 text-muted-foreground rounded-md px-2"
                    >
                      {group.name}
                    </Toggle>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm text-muted-foreground font-medium">Individual Emails</h4>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Add individual email"
                  />
                  <Button type="button" size="sm" onClick={addIndividualEmail}>
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
                
                {details.recipients.individualEmails.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {details.recipients.individualEmails.map(email => (
                      <div key={email} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm">
                        {email}
                        <button 
                          type="button" 
                          onClick={() => removeIndividualEmail(email)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit">Continue to Design</Button>
          </div>
        </form>
      )}

      {/* Step 2: Design */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl text-primary font-semibold">Email Design</h2>
          
          <div className="border rounded-lg overflow-hidden">
            <div className="flex border-b">
              <Button 
                variant={!previewMode ? "default" : "ghost"} 
                onClick={() => setPreviewMode(false)}
                className="rounded-none"
              >
                Editor
              </Button>
              <Button 
                variant={previewMode ? "default" : "ghost"} 
                onClick={() => setPreviewMode(true)}
                className="rounded-none"
              >
                Preview
              </Button>
            </div>

            {previewMode ? (
              <div 
                className="text-primary p-6 min-h-[400px] "
                dangerouslySetInnerHTML={{ __html: emailContent }}
              />
            ) : (
              <div className="text-primary min-h-[400px]">
                {/* Custom Toolbar */}
                <div className="flex items-center gap-1 p-2 border-b">
                  <Toggle size="sm" pressed={false} onPressedChange={() => formatText("bold")}>
                    <Bold className="h-4 w-4" />
                  </Toggle>
                  <Toggle size="sm" pressed={false} onPressedChange={() => formatText("italic")}>
                    <Italic className="h-4 w-4" />
                  </Toggle>
                  <Toggle size="sm" pressed={false} onPressedChange={() => formatText("underline")}>
                    <Underline className="h-4 w-4" />
                  </Toggle>
                  <Toggle size="sm" pressed={false} onPressedChange={() => formatText("insertUnorderedList")}>
                    <List className="h-4 w-4" />
                  </Toggle>
                  <Toggle size="sm" pressed={false} onPressedChange={() => formatText("insertOrderedList")}>
                    <ListOrdered className="h-4 w-4" />
                  </Toggle>
                  <Toggle size="sm" pressed={showLinkDialog} onPressedChange={() => setShowLinkDialog(!showLinkDialog)}>
                    <Link className="h-4 w-4" />
                  </Toggle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => formatText("removeFormat")}
                    className="ml-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Link Dialog */}
                {showLinkDialog && (
                  <div className="p-2 border-b flex gap-2">
                    <Input
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="Enter URL"
                      className="h-8"
                    />
                    <Button size="sm" onClick={insertLink}>Insert</Button>
                  </div>
                )}

                {/* ContentEditable Editor */}
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={updateContent}
                    onPaste={handlePaste}
                    className="p-4 outline-none text-right text-primary"
                    style={{ textAlign: 'start' }}
                    dangerouslySetInnerHTML={{ __html: emailContent }}
                />
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline"
                className="text-muted-foreground"
             onClick={() => {
              setCurrentStep(1);
              setProgress(33);
            }}>
              Back
            </Button>
            <Button onClick={handleDesignSubmit}>Continue to Review</Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl text-primary font-semibold">Review Campaign</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-primary space-y-4">
              <h3 className="text-primary font-medium">Details</h3>
              <div className="space-y-2">
                <p><span className="text-muted-foreground">Name:</span> {details.name}</p>
                <p><span className="text-muted-foreground">Subject:</span> {details.subject}</p>
                <p><span className="text-muted-foreground">Sender:</span> {details.sender?.name} &lt;{details.sender?.email}&gt;</p>
                
                <div>
                  <p className="text-muted-foreground">Recipients:</p>
                  <div className="text-primary mt-1 space-y-1">
                    {details.recipients.groups.map(groupId => {
                      const group = recipientGroups.find(g => g.id === groupId);
                      return group ? (
                        <div key={groupId} className="text-sm">{group.name} ({group.emails.length} recipients)</div>
                      ) : null;
                    })}
                    {details.recipients.individualEmails.map(email => (
                      <div key={email} className="text-sm">{email}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-primary font-medium mb-2">Email Preview</h3>
              <div 
                className="border p-4 rounded-lg min-h-[200px] text-primary"
                dangerouslySetInnerHTML={{ __html: emailContent }}
              />
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" 
            className="text-muted-foreground"
            onClick={() => {
              setCurrentStep(2);
              setProgress(66);
            }}>
              Back
            </Button>
            <Button onClick={handleSendCampaign}>Send Campaign</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlusIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

