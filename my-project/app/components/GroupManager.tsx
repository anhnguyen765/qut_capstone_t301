import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog";
import ConfirmationDialog from "@/app/components/ConfirmationDialog";
import { Plus, Edit, Trash2, Users, AlertCircle } from "lucide-react";

interface ContactGroup {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  contact_count?: number;
}

interface GroupManagerProps {
  onGroupsChange?: () => void; // Callback to refresh parent components
}

export default function GroupManager({ onGroupsChange }: GroupManagerProps) {
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  
  // Form state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: ""
  });
  const [formLoading, setFormLoading] = useState(false);

  // Delete confirmation
  const [groupToDelete, setGroupToDelete] = useState<ContactGroup | null>(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/contact-groups");
      const data = await response.json();
      
      if (response.ok) {
        setGroups(data);
      } else {
        setMessage("Failed to load contact groups");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Error loading contact groups");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setMessage("Group name is required");
      setMessageType("error");
      return;
    }

    setFormLoading(true);
    try {
      const response = await fetch("/api/contact-groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Contact group created successfully");
        setMessageType("success");
        setShowCreateDialog(false);
        setFormData({ name: "", description: "" });
        fetchGroups(); // Refresh the list
        onGroupsChange?.(); // Notify parent components
      } else {
        setMessage(data.error || "Failed to create contact group");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Error creating contact group");
      setMessageType("error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingGroup || !formData.name.trim()) {
      setMessage("Group name is required");
      setMessageType("error");
      return;
    }

    setFormLoading(true);
    try {
      const response = await fetch(`/api/contact-groups/${editingGroup.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Contact group updated successfully");
        setMessageType("success");
        setEditingGroup(null);
        setFormData({ name: "", description: "" });
        fetchGroups(); // Refresh the list
        onGroupsChange?.(); // Notify parent components
      } else {
        setMessage(data.error || "Failed to update contact group");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Error updating contact group");
      setMessageType("error");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteGroup = async (group: ContactGroup) => {
    // Check if group has contacts before attempting delete
    if ((group.contact_count || 0) > 0) {
      setMessage(`Cannot delete group '${group.name}' because it has ${group.contact_count} contact(s). Please move or delete the contacts first.`);
      setMessageType("error");
      setGroupToDelete(null);
      return;
    }

    try {
      const response = await fetch(`/api/contact-groups/${group.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Contact group deleted successfully");
        setMessageType("success");
        setGroupToDelete(null);
        fetchGroups(); // Refresh the list
        onGroupsChange?.(); // Notify parent components
      } else {
        setMessage(data.error || "Failed to delete contact group");
        setMessageType("error");
        setGroupToDelete(null);
      }
    } catch (error) {
      setMessage("Error deleting contact group");
      setMessageType("error");
      setGroupToDelete(null);
    }
  };

  const startEdit = (group: ContactGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || ""
    });
  };

  const cancelEdit = () => {
    setEditingGroup(null);
    setFormData({ name: "", description: "" });
  };

  const getMessageColor = () => {
    switch (messageType) {
      case "success":
        return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800";
      case "error":
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900 dark:text-red-100 dark:border-red-800";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-800";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contact Groups
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading contact groups...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded border ${getMessageColor()}`}>
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contact Groups
            </CardTitle>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Contact Group</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div>
                    <Label htmlFor="create-name">Group Name</Label>
                    <Input
                      id="create-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter group name..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-description">Description (Optional)</Label>
                    <Input
                      id="create-description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter group description..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateDialog(false)}
                      disabled={formLoading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={formLoading}>
                      {formLoading ? "Creating..." : "Create Group"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {groups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No contact groups found</p>
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.id} className="border rounded-lg p-4">
                  {editingGroup?.id === group.id ? (
                    // Edit form
                    <form onSubmit={handleEditGroup} className="space-y-3">
                      <div>
                        <Label htmlFor={`edit-name-${group.id}`}>Group Name</Label>
                        <Input
                          id={`edit-name-${group.id}`}
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-description-${group.id}`}>Description</Label>
                        <Input
                          id={`edit-description-${group.id}`}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={cancelEdit}
                          disabled={formLoading}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={formLoading}>
                          {formLoading ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    // Display view
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{group.name}</h3>
                          <Badge variant="outline">
                            {group.contact_count || 0} contact{(group.contact_count || 0) !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        {group.description && (
                          <p className="text-sm text-muted-foreground mb-2">{group.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(group.created_at).toLocaleDateString()}
                          {group.updated_at !== group.created_at && (
                            <span> • Updated: {new Date(group.updated_at).toLocaleDateString()}</span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(group)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setGroupToDelete(group)}
                          className="flex items-center gap-1 text-destructive hover:text-destructive/80"
                          disabled={(group.contact_count || 0) > 0}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {groupToDelete && (
        <ConfirmationDialog
          isOpen={true}
          onCancel={() => setGroupToDelete(null)}
          onConfirm={() => handleDeleteGroup(groupToDelete)}
          title="Delete Contact Group"
          message={
            (groupToDelete.contact_count || 0) > 0 
              ? `Cannot delete group "${groupToDelete.name}" because it has ${groupToDelete.contact_count} contact${groupToDelete.contact_count !== 1 ? 's' : ''}. Please move or delete the contacts first.`
              : `Are you sure you want to delete the group "${groupToDelete.name}"? This action cannot be undone.`
          }
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      )}
    </div>
  );
}