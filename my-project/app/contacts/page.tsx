"use client";

import { useState } from "react";

type Contact = {
  name: string;
  email: string;
  group: "companies" | "private" | "schools";
};

const initialContacts: Contact[] = [
  { name: "John Doe", email: "john.doe@example.com", group: "companies" },
  { name: "Jane Smith", email: "jane.smith@example.com", group: "private" },
  { name: "Alice Johnson", email: "alice.johnson@example.com", group: "schools" },
  { name: "Bob Lee", email: "bob.lee@example.com", group: "companies" },
  { name: "Charlie Brown", email: "charlie.brown@example.com", group: "private" },
];

const GROUPS = [
  { label: "Companies", value: "companies" },
  { label: "Private", value: "private" },
  { label: "Schools", value: "schools" },
];

export default function Contacts() {
  const [filter, setFilter] = useState("");
  const [contacts] = useState(initialContacts);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const handleGroupChange = (group: string) => {
    setSelectedGroups((prev) =>
      prev.includes(group)
        ? prev.filter((g) => g !== group)
        : [...prev, group]
    );
  };

  const filteredContacts = contacts.filter(
    (c) =>
      (selectedGroups.length === 0 || selectedGroups.includes(c.group)) &&
      (c.name.toLowerCase().includes(filter.toLowerCase()) ||
        c.email.toLowerCase().includes(filter.toLowerCase()))
  );

  return (
    <div className="min-h-screen w-full p-8 sm:p-20">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-center sm:text-left text-slate-900">
          Contacts
        </h1>
        <p className="text-lg text-center sm:text-left text-slate-600 max-w-2xl">
          Manage your customer and client contacts efficiently. Add, edit, and organize your contacts in one place.
        </p>
      </header>

      

      <div className="max-w-full mx-auto mb-8">
        <input
          type="text"
          placeholder="Filter by name or email..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full p-4 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800"
        />
      </div>

      <div className=" mx-auto mb-4 flex flex-wrap gap-4 items-center">
        {GROUPS.map((group) => (
          <label key={group.value} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedGroups.includes(group.value)}
              onChange={() => handleGroupChange(group.value)}
              className="accent-blue-600"
            />
            <span className="text-slate-700">{group.label}</span>
          </label>
        ))}
      </div>

      <main className="mx-auto">
        <ul className="divide-y divide-slate-200 bg-white rounded-lg shadow">
          {filteredContacts.length === 0 ? (
            <li className="p-6 text-center text-slate-500">No contacts found.</li>
          ) : (
            filteredContacts.map((contact, idx) => (
              <li key={idx} className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="font-semibold text-slate-900">{contact.name}</span>
                  <span className="ml-2 text-xs px-2 py-1 rounded bg-slate-100 text-slate-600">{contact.group}</span>
                </div>
                <span className="text-slate-600 break-words">{contact.email}</span>
              </li>
            ))
          )}
        </ul>
      </main>
    </div>
  );
}