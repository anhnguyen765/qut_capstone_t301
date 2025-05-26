"use client";

import { useState } from "react";
import { Search, Filter, UserPlus, ArrowUpDown, Upload } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";

type Contact = {
  name: string;
  email: string;
  group: "companies" | "private" | "schools" | "groups" | "oshc";
};

const initialContacts: Contact[] = [
  { name: "John Doe", email: "john.doe@example.com", group: "companies" },
  { name: "Jane Smith", email: "jane.smith@example.com", group: "private" },
  { name: "Alice Johnson", email: "alice.johnson@example.com", group: "schools" },
  { name: "Bob Lee", email: "bob.lee@example.com", group: "companies" },
  { name: "Charlie Brown", email: "charlie.brown@example.com", group: "private" },
  // Groups contacts
  { name: "Soccer Club Brisbane", email: "soccer.club@bris.com.au", group: "groups" },
  { name: "Tennis Association QLD", email: "tennis.qld@sports.com.au", group: "groups" },
  { name: "Swimming Club Gold Coast", email: "swim@gcclub.com.au", group: "groups" },
  { name: "Basketball League Brisbane", email: "bball.bris@league.com.au", group: "groups" },
  // OSHC contacts
  { name: "Sunshine OSHC", email: "admin@sunshineoshc.com.au", group: "oshc" },
  { name: "Kids First Care", email: "contact@kidsfirst.com.au", group: "oshc" },
  { name: "Happy Valley OSHC", email: "info@happyvalleyoshc.com.au", group: "oshc" },
  { name: "Bright Stars Aftercare", email: "bright.stars@oshc.edu.au", group: "oshc" }
];

const GROUPS = [
  { label: "Companies", value: "companies" },
  { label: "Private", value: "private" },
  { label: "Schools", value: "schools" },
  { label: "Groups", value: "groups" },
  { label: "OSHC", value: "oshc" }
];

export default function Contacts() {
  const [filter, setFilter] = useState("");
  const [contacts] = useState(initialContacts);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "email" | "group">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleGroupChange = (group: string) => {
    setSelectedGroups((prev) =>
      prev.includes(group)
        ? prev.filter((g) => g !== group)
        : [...prev, group]
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
          c.email.toLowerCase().includes(filter.toLowerCase()))
    )
    .sort((a, b) => {
      const compareValue = sortOrder === "asc" ? 1 : -1;
      return a[sortBy] > b[sortBy] ? compareValue : -compareValue;
    });

  return (
    <div className="min-h-screen w-full p-8 sm:p-20">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-[var(--foreground)]">
          Contacts
        </h1>
      </header>

      <div className="max-w-full mx-auto space-y-4">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--foreground)]" />
          <input
            type="text"
            placeholder="Search all contacts..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-10 pr-12 p-4 border border-[var(--border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-[var(--background)] text-[var(--foreground)]"
          />
          <Popover>
            <PopoverTrigger asChild>
              <button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-[var(--accent)] rounded-md">
                <Filter className="h-5 w-5 text-[var(--foreground)]" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <div className="space-y-2">
                {GROUPS.map((group) => (
                  <label key={group.value} className="flex items-center space-x-2 p-2 hover:bg-[var(--accent)] rounded-md cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(group.value)}
                      onChange={() => handleGroupChange(group.value)}
                      className="accent-[var(--primary)]"
                    />
                    <span className="text-[var(--foreground)]">{group.label}</span>
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
                className={`${sortBy === "name" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"}`}
              >
                Name {sortBy === "name" && <ArrowUpDown className="ml-1 h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("email")}
                className={`${sortBy === "email" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"}`}
              >
                Email {sortBy === "email" && <ArrowUpDown className="ml-1 h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("group")}
                className={`${sortBy === "group" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"}`}
              >
                Group {sortBy === "group" && <ArrowUpDown className="ml-1 h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button className="flex-1 sm:flex-none text-[var(--foreground)]" variant="outline">
              <Upload className="h-4 w-4 text-[var(--foreground)]" />
              Import
            </Button>
            <Button className="flex-1 sm:flex-none">
              <UserPlus className="h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </div>

        <main className="mx-auto mt-6">
          <ul className="divide-y divide-[var(--border)] bg-[var(--background)] rounded-lg shadow">
            {filteredContacts.length === 0 ? (
              <li className="p-6 text-center text-[var(--foreground)]">No contacts found.</li>
            ) : (
              filteredContacts.map((contact, idx) => (
                <li key={idx} className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-[var(--accent)]/50">
                  <div>
                    <span className="font-semibold text-[var(--foreground)]">{contact.name}</span>
                    <span className="ml-2 text-xs px-2 py-1 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                      {contact.group}
                    </span>
                  </div>
                  <span className="text-[var(--foreground)] break-words">{contact.email}</span>
                </li>
              ))
            )}
          </ul>
        </main>
      </div>
    </div>
  );
}