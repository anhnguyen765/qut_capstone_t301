"use client";

import { useState, useEffect } from "react";
import { Search, UserPlus, ArrowUpDown, Edit, Eye, Trash2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";

type Contact = {
  id?: number;
  name: string;
  email: string;
  phone?: string;
  group: "Companies" | "Groups" | "Private" | "OSHC" | "Schools";
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

const GROUPS = [
  { label: "Companies", value: "Companies" },
  { label: "Private", value: "Private" },
  { label: "Schools", value: "Schools" },
  { label: "Groups", value: "Groups" },
  { label: "OSHC", value: "OSHC" }
];

export default function SchoolsContacts() {
  const [filter, setFilter] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "email">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Add Contact Dialog State
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newContact, setNewContact] = useState<Contact>({
    name: "",
    email: "",
    phone: "",
    group: "Schools",
    notes: "",
  });

  // View/Edit Contact Dialog State
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Delete Contact Dialog State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  // Fetch contacts from API and filter by Schools group
  useEffect(() => {
    fetch("/api/contacts")
      .then(res => res.json())
      .then((data: Contact[]) => {
        // Ensure data is always an array and filter by Schools group
        if (Array.isArray(data)) {
          setContacts(data.filter(contact => contact.group === "Schools"));
        } else {
          console.error("Contacts API returned non-array data:", data);
          setContacts([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching contacts:", error);
        setContacts([]);
      });
  }, []);

  const handleSort = (field: "name" | "email") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const filteredContacts = contacts
    .filter(
      (c) =>
        c.name.toLowerCase().includes(filter.toLowerCase()) ||
        c.email.toLowerCase().includes(filter.toLowerCase()) ||
        (c.phone && c.phone.toLowerCase().includes(filter.toLowerCase()))
    )
    .sort((a, b) => {
      const compareValue = sortOrder === "asc" ? 1 : -1;
      return a[sortBy] > b[sortBy] ? compareValue : -compareValue;
    });

  const handleAddContact = async () => {
    try {
      await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContact),
      });
      setShowAddDialog(false);
      setNewContact({ name: "", email: "", phone: "", group: "Schools", notes: "" });
      // Refresh contacts
      const response = await fetch("/api/contacts");
      const data = await response.json();
      if (Array.isArray(data)) {
        setContacts(data.filter(contact => contact.group === "Schools"));
      }
    } catch (error) {
      console.error("Error adding contact:", error);
    }
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsEditing(false);
    setShowViewDialog(true);
  };

  const handleEditContact = async () => {
    if (!selectedContact) return;
    
    try {
      await fetch(`/api/contacts/${selectedContact.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedContact),
      });
      setIsEditing(false);
      // Refresh contacts
      const response = await fetch("/api/contacts");
      const data = await response.json();
      if (Array.isArray(data)) {
        setContacts(data.filter(contact => contact.group === "Schools"));
      }
    } catch (error) {
      console.error("Error updating contact:", error);
    }
  };

  // Delete handlers
  const handleDeleteClick = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation();
    setContactToDelete(contact);
    setShowDeleteConfirm(true);
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete?.id) return;
    try {
      await fetch(`/api/contacts/${contactToDelete.id}`, {
        method: "DELETE",
      });
      // Refresh contacts
      const response = await fetch("/api/contacts");
      const data = await response.json();
      if (Array.isArray(data)) {
        setContacts(data.filter(contact => contact.group === "Schools"));
      }
      setShowDeleteConfirm(false);
      setContactToDelete(null);
      setShowViewDialog(false);
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert("Error deleting contact. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-full py-8 px-[10%]">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          Schools Contacts
        </h1>
      </header>
        <Button
          onClick={() => setShowAddDialog(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add School Contact
        </Button>
      </header>

      <div className="max-w-full mx-auto space-y-4">
        <div className="relative flex items-center flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--foreground)]" />
          <Input
            type="text"
            placeholder="Search schools..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-10 pr-12 p-4 border border-[var(--border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-[var(--background)] text-[var(--foreground)]"
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--foreground)]">Sort by:</span>
            <div className="flex gap-2 text-[var(--foreground)]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("name")}
                className={`${
                  sortBy === "name"
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                }`}
              >
                Name{" "}
                {sortBy === "name" && <ArrowUpDown className="ml-1 h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("email")}
                className={`${
                  sortBy === "email"
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                }`}
              >
                Email{" "}
                {sortBy === "email" && <ArrowUpDown className="ml-1 h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        <main className="mx-auto mt-6">
          <ul className="divide-y divide-[var(--border)] bg-[var(--background)] rounded-lg shadow">
            {filteredContacts.length === 0 ? (
              <li className="p-6 text-center text-[var(--foreground)]">No school contacts found.</li>
            ) : (
              filteredContacts.map((contact, idx) => (
                <li
                  key={contact.id || idx}
                  className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-[var(--accent)]/50 cursor-pointer"
                  onClick={() => handleViewContact(contact)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[var(--foreground)]">{contact.name}</span>
                    </div>
                    <div className="text-sm text-[var(--foreground)]">
                      <span className="block">{contact.email}</span>
                      {contact.phone && (
                        <span className="block text-[var(--muted-foreground)]">{contact.phone}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2 sm:mt-0" onClick={e => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        handleViewContact(contact);
                      }}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={e => handleDeleteClick(contact, e)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && contactToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-4">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Contact</h3>
                <p className="text-sm text-gray-600">This action cannot be undone.</p>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete {" "}
                <span className="font-semibold">{contactToDelete.name}</span>?
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Email: {contactToDelete.email}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setContactToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteContact}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Contact
              </Button>
            </div>
          </div>
        </div>
      )}
                </li>
              ))
            )}
          </ul>
        </main>
      </div>

      {/* Add Contact Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Add New School Contact</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAddContact();
              }}
              className="space-y-4"
            >
              <div>
                <Label className="block text-sm font-medium mb-1">School Name *</Label>
                <Input
                  type="text"
                  value={newContact.name}
                  onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                  required
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-1">Email *</Label>
                <Input
                  type="email"
                  value={newContact.email}
                  onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                  required
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-1">Phone</Label>
                <Input
                  type="tel"
                  value={newContact.phone}
                  onChange={e => setNewContact({ ...newContact, phone: e.target.value })}
                  className="w-full border rounded p-2"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-1">Notes</Label>
                <Textarea
                  value={newContact.notes}
                  onChange={e => setNewContact({ ...newContact, notes: e.target.value })}
                  rows={3}
                  className="w-full border rounded p-2"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add School Contact</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View/Edit Contact Dialog */}
      {showViewDialog && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {isEditing ? "Edit School Contact" : "School Contact Details"}
              </h2>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
            
            {isEditing ? (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleEditContact();
                }}
                className="space-y-4"
              >
                <div>
                  <Label className="block text-sm font-medium mb-1">School Name *</Label>
                  <Input
                    type="text"
                    value={selectedContact.name}
                    onChange={e => setSelectedContact({ ...selectedContact, name: e.target.value })}
                    required
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-1">Email *</Label>
                  <Input
                    type="email"
                    value={selectedContact.email}
                    onChange={e => setSelectedContact({ ...selectedContact, email: e.target.value })}
                    required
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-1">Phone</Label>
                  <Input
                    type="tel"
                    value={selectedContact.phone || ""}
                    onChange={e => setSelectedContact({ ...selectedContact, phone: e.target.value })}
                    className="w-full border rounded p-2"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-1">Group</Label>
                  <Select
                    value={selectedContact.group}
                    onValueChange={(value) =>
                      setSelectedContact({ ...selectedContact, group: value as Contact["group"] })
                    }
                  >
                    <SelectTrigger className="w-full border rounded p-2 flex justify-start items-center">
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Companies">Companies</SelectItem>
                      <SelectItem value="Groups">Groups</SelectItem>
                      <SelectItem value="Private">Private</SelectItem>
                      <SelectItem value="OSHC">OSHC</SelectItem>
                      <SelectItem value="Schools">Schools</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-1">Notes</Label>
                  <Textarea
                    value={selectedContact.notes || ""}
                    onChange={e => setSelectedContact({ ...selectedContact, notes: e.target.value })}
                    rows={3}
                    className="w-full border rounded p-2"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium mb-1">School Name</Label>
                  <p className="text-[var(--foreground)]">{selectedContact.name}</p>
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-1">Email</Label>
                  <p className="text-[var(--foreground)]">{selectedContact.email}</p>
                </div>
                {selectedContact.phone && (
                  <div>
                    <Label className="block text-sm font-medium mb-1">Phone</Label>
                    <p className="text-[var(--foreground)]">{selectedContact.phone}</p>
                  </div>
                )}
                <div>
                  <Label className="block text-sm font-medium mb-1">Group</Label>
                  <p className="text-[var(--foreground)]">{selectedContact.group}</p>
                </div>
                {selectedContact.notes && (
                  <div>
                    <Label className="block text-sm font-medium mb-1">Notes</Label>
                    <p className="text-[var(--foreground)] whitespace-pre-wrap">{selectedContact.notes}</p>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowViewDialog(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 