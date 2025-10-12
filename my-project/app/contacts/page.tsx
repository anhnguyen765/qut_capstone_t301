"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Filter, UserPlus, ArrowUpDown, Upload, Edit, Eye, ChevronDown, Trash2, Download } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
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
  opt1?: boolean;
  opt2?: boolean;
  opt3?: boolean;
  created_at?: string;
  updated_at?: string;
};

const GROUPS = [
  { label: "Companies", value: "Companies" },
  { label: "Private", value: "Private" },
  { label: "Schools", value: "Schools" },
  { label: "Groups", value: "Groups" },
  { label: "OSHC", value: "OSHC" },
];

export default function Contacts() {
  const [filter, setFilter] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "email" | "group">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Add Contact Dialog State
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newContact, setNewContact] = useState<Contact>({
  name: "",
  email: "",
  phone: "",
  group: "Companies",
  notes: "",
  opt1: false,
  opt2: false,
  opt3: false,
  });

  // View/Edit Contact Dialog State
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Import Contacts State
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<Contact[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Add delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch("/api/contacts")
      .then((res) => res.json())
      .then((data) => {
        // Ensure data is always an array
        if (Array.isArray(data)) {
          setContacts(data);
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

  const handleGroupChange = (group: string) => {
    setSelectedGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const handleSort = (field: "name" | "email" | "group") => {
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
        (selectedGroups.length === 0 || selectedGroups.includes(c.group)) &&
        (c.name.toLowerCase().includes(filter.toLowerCase()) ||
          c.email.toLowerCase().includes(filter.toLowerCase()) ||
          (c.phone && c.phone.toLowerCase().includes(filter.toLowerCase())))
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
      setNewContact({ name: "", email: "", phone: "", group: "Companies", notes: "" });
      // Refresh contacts
      const response = await fetch("/api/contacts");
      const data = await response.json();
      if (Array.isArray(data)) {
        setContacts(data);
      } else {
        console.error("Contacts API returned non-array data:", data);
        setContacts([]);
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
        setContacts(data);
      }
    } catch (error) {
      console.error("Error updating contact:", error);
    }
  };

  const parseCsvFile = (file: File): Promise<Contact[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          const lines = csv.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('CSV file must have at least a header row and one data row'));
            return;
          }
          
          // Detect delimiter (tab or comma)
          const firstLine = lines[0];
          const delimiter = firstLine.includes('\t') ? '\t' : ',';
          
          const headers = firstLine.split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));
          
          // Validate required headers
          const requiredHeaders = ['name', 'email'];
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
          if (missingHeaders.length > 0) {
            reject(new Error(`Missing required columns: ${missingHeaders.join(', ')}`));
            return;
          }
          
          const contacts: Contact[] = [];
          const errors: string[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            try {
              // Improved CSV parsing that handles spaces in values
              const values: string[] = [];
              let current = '';
              let inQuotes = false;
              
              for (let j = 0; j < line.length; j++) {
                const char = line[j];
                
                if (char === '"') {
                  inQuotes = !inQuotes;
                } else if (char === delimiter && !inQuotes) {
                  values.push(current.trim());
                  current = '';
                } else {
                  current += char;
                }
              }
              values.push(current.trim()); // Add the last value
              
              const contact: Contact = {
                name: '',
                email: '',
                group: 'Private'
              };
              
              headers.forEach((header, index) => {
                const value = (values[index] || '').replace(/^"|"$/g, '').trim();
                switch (header) {
                  case 'name':
                    if (!value) {
                      errors.push(`Row ${i + 1}: Name is required`);
                      return;
                    }
                    contact.name = value;
                    break;
                  case 'email':
                    if (!value) {
                      errors.push(`Row ${i + 1}: Email is required`);
                      return;
                    }
                    // Basic email validation
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                      errors.push(`Row ${i + 1}: Invalid email format: ${value}`);
                      return;
                    }
                    contact.email = value;
                    break;
                  case 'phone':
                    contact.phone = value; // Now preserves spaces and full phone number
                    break;
                  case 'group':
                    if (value && !['Companies', 'Groups', 'Private', 'OSHC', 'Schools'].includes(value)) {
                      errors.push(`Row ${i + 1}: Invalid group "${value}". Must be one of: Companies, Groups, Private, OSHC, Schools`);
                    } else if (value) {
                      contact.group = value as Contact['group'];
                    }
                    break;
                  case 'notes':
                    contact.notes = value;
                    break;
                }
              });
              
              if (contact.name && contact.email) {
                contacts.push(contact);
              }
            } catch (rowError) {
              errors.push(`Row ${i + 1}: Failed to parse - ${rowError}`);
            }
          }
          
          if (errors.length > 0) {
            reject(new Error(`CSV parsing errors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : ''}`));
            return;
          }
          
          if (contacts.length === 0) {
            reject(new Error('No valid contacts found in CSV file'));
            return;
          }
          
          resolve(contacts);
        } catch (error) {
          reject(new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleImportContacts = async () => {
    if (!importFile) return;
    
    setIsImporting(true);
    try {
      const contacts = await parseCsvFile(importFile);
      setImportPreview(contacts);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      // Show more specific error message
      alert(error instanceof Error ? error.message : 'Error parsing CSV file. Please check the format.');
    }
    setIsImporting(false);
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    try {
      for (const contact of importPreview) {
        await fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contact),
        });
      }
      
      // Refresh contacts
      const response = await fetch("/api/contacts");
      const data = await response.json();
      if (Array.isArray(data)) {
        setContacts(data);
      }
      
      // Reset import state
      setShowImportDialog(false);
      setImportFile(null);
      setImportPreview([]);
      alert(`Successfully imported ${importPreview.length} contacts!`);
    } catch (error) {
      console.error('Error importing contacts:', error);
      alert('Error importing contacts. Please try again.');
    }
    setIsImporting(false);
  };

  // Add delete handlers
  const handleDeleteClick = (contact: Contact, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the view dialog
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
        setContacts(data);
      }
      
      setShowDeleteConfirm(false);
      setContactToDelete(null);
      setShowViewDialog(false); // Close view dialog if open
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert("Error deleting contact. Please try again.");
    }
  };

  return (
    <div className="py-8 px-[10%]">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          Contacts
        </h1>
      </header>

      <div className="space-y-2">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--foreground)]" />
          <Input
            type="text"
            placeholder="Search all contacts..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-10 pr-4 placeholder:text-grey dark:placeholder:text-white/80"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 bg-background hover:bg-[var(--accent)] rounded-md">
                <Filter className="h-5 w-5 text-[var(--foreground)]" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <div className="space-y-2">
                {GROUPS.map((group) => (
                  <label
                    key={group.value}
                    className="flex items-center space-x-2 p-2 hover:bg-[var(--accent)] rounded-md cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(group.value)}
                      onChange={() => handleGroupChange(group.value)}
                      className="accent-[var(--primary)]"
                    />
                    <span className="text-[var(--foreground)]">
                      {group.label}
                    </span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("group")}
                className={`${
                  sortBy === "group"
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                }`}
              >
                Group{" "}
                {sortBy === "group" && <ArrowUpDown className="ml-1 h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              className="flex-1 sm:flex-none text-[var(--foreground)]"
              variant="outline"
              onClick={() => setShowImportDialog(true)}
            >
              <Upload className="h-4 w-4 text-[var(--foreground)]" />
              Import
            </Button>
            <Button
              className="flex-1 sm:flex-none"
              variant="outline"
              onClick={() => {
                // Export all contacts as CSV (matching import format)
                if (!contacts.length) return;
                const headers = [
                  'name','email','phone','group','notes','opt1','opt2','opt3'
                ];
                const csvRows = [
                  headers.join(','),
                  ...contacts.map(contact =>
                    headers.map(h => {
                      let val = contact[h as keyof typeof contact];
                      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
                      if (val === undefined || val === null) return '';
                      // Escape quotes and commas
                      return `"${String(val).replace(/"/g, '""')}"`;
                    }).join(',')
                  )
                ];
                const csvContent = csvRows.join('\r\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', 'contacts_export.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button
              className="flex-1 sm:flex-none"
              onClick={() => setShowAddDialog(true)}
            >
              <UserPlus className="h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </div>

        <main className="mx-auto mt-6">
          <ul className="divide-y divide-[var(--border)] bg-[var(--background)] rounded-lg shadow">
            {filteredContacts.length === 0 ? (
              <li className="p-6 text-center text-[var(--foreground)]">
                No contacts found.
              </li>
            ) : (
              filteredContacts.map((contact, idx) => (
                <li
                  key={contact.id || idx}
                  className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-[var(--accent)]/50 cursor-pointer"
                  onClick={() => handleViewContact(contact)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[var(--foreground)]">
                        {contact.name}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                        {contact.group}
                      </span>
                    </div>
                    <div className="text-sm text-[var(--foreground)]">
                      <span className="block">{contact.email}</span>
                    </div>
                  </div>
                  
                  {/* Add action buttons */}
                  <div className="flex gap-2 mt-2 sm:mt-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
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
                      onClick={(e) => handleDeleteClick(contact, e)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
            <h2 className="text-xl font-bold mb-4">Add New Contact</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAddContact();
              }}
              className="space-y-4"
            >
              <div>
                <Label className="block text-sm font-medium mb-1">Name *</Label>
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
                <Label className="block text-sm font-medium mb-1">Group</Label>
                <Select
                  value={newContact.group}
                  onValueChange={(value) =>
                    setNewContact({ ...newContact, group: value as Contact["group"] })
                  }
                >
                  <SelectTrigger className="w-full border rounded p-2 flex justify-start items-center">
                    <SelectValue placeholder="Select a group" />
                    <span className="flex-none"><ChevronDown className="h-4 w-4 text-foreground" /></span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Private">Private</SelectItem>
                    <SelectItem value="Companies">Companies</SelectItem>
                    <SelectItem value="Groups">Groups</SelectItem>
                    <SelectItem value="OSHC">OSHC</SelectItem>
                    <SelectItem value="Schools">Schools</SelectItem>
                  </SelectContent>
                </Select>
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
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!newContact.opt1}
                    onChange={e => setNewContact({ ...newContact, opt1: e.target.checked })}
                  />
                  Opt1
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!newContact.opt2}
                    onChange={e => setNewContact({ ...newContact, opt2: e.target.checked })}
                  />
                  Opt2
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!newContact.opt3}
                    onChange={e => setNewContact({ ...newContact, opt3: e.target.checked })}
                  />
                  Opt3
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Contact</Button>
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
                {isEditing ? "Edit Contact" : "Contact Details"}
              </h2>
              {!isEditing && (
                <div className="flex gap-2">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleDeleteClick(selectedContact, e)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
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
                  <Label className="block text-sm font-medium mb-1">Name *</Label>
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
                    <SelectTrigger className="w-full border rounded p-2 flex justify-between items-center">
                      <SelectValue placeholder="Select group" />
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </SelectTrigger>

                    <SelectContent>
                      {GROUPS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
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
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!selectedContact.opt1}
                      onChange={e => setSelectedContact({ ...selectedContact, opt1: e.target.checked } as Contact)}
                    />
                    Opt1
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!selectedContact.opt2}
                      onChange={e => setSelectedContact({ ...selectedContact, opt2: e.target.checked } as Contact)}
                    />
                    Opt2
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!!selectedContact.opt3}
                      onChange={e => setSelectedContact({ ...selectedContact, opt3: e.target.checked } as Contact)}
                    />
                    Opt3
                  </label>
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
                  <Label className="block text-sm font-medium mb-1">Name</Label>
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
                <div className="flex gap-4">
                  <span className="flex items-center gap-1">
                    <input type="checkbox" checked={!!selectedContact.opt1} readOnly /> Opt1
                  </span>
                  <span className="flex items-center gap-1">
                    <input type="checkbox" checked={!!selectedContact.opt2} readOnly /> Opt2
                  </span>
                  <span className="flex items-center gap-1">
                    <input type="checkbox" checked={!!selectedContact.opt3} readOnly /> Opt3
                  </span>
                </div>
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

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Import Contacts</h2>
            
            {importPreview.length === 0 ? (
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium mb-2">
                    Upload CSV File
                  </Label>
                  <p className="text-sm text-gray-600 mb-4">
                    CSV should have columns: name, email, phone, group, notes
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImportFile(file);
                      }
                    }}
                    className="w-full border rounded p-2 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-medium mb-2">CSV Format Example:</h3>
                  <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
                      {`name,email,phone,group,notes
                      John Doe,john@example.com,123-456-7890,Companies,CEO
                      Jane Smith,jane@example.com,,Private,Friend`}
                  </pre>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowImportDialog(false);
                      setImportFile(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleImportContacts}
                    disabled={!importFile || isImporting}
                  >
                    {isImporting ? 'Processing...' : 'Preview Import'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">
                    Preview ({importPreview.length} contacts found)
                  </h3>
                  <div className="max-h-60 overflow-y-auto border rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Name</th>
                          <th className="p-2 text-left">Email</th>
                          <th className="p-2 text-left">Phone</th>
                          <th className="p-2 text-left">Group</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((contact, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2">{contact.name}</td>
                            <td className="p-2">{contact.email}</td>
                            <td className="p-2">{contact.phone || '-'}</td>
                            <td className="p-2">{contact.group}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setImportPreview([])}
                  >
                    Back
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleConfirmImport}
                    disabled={isImporting}
                  >
                    {isImporting ? 'Importing...' : `Import ${importPreview.length} Contacts`}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                Are you sure you want to delete{" "}
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
    </div>
  );
}