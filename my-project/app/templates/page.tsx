"use client";

import { useState } from "react";
import { Search, Filter, Plus, ArrowUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";

type Template = {
  id: string;
  name: string;
  description: string;
  category: "announcement" | "newsletter" | "event" | "promotion";
};

const initialTemplates: Template[] = [
  {
    id: "1",
    name: "Announcement Template",
    description: "A template for sending out important announcements to your audience.",
    category: "announcement"
  },
  {
    id: "2",
    name: "Newsletter Template",
    description: "A reusable newsletter layout for regular updates and news.",
    category: "newsletter"
  },
  {
    id: "3",
    name: "Event Invitation",
    description: "Invite your contacts to events with this customizable invitation template.",
    category: "event"
  },
  {
    id: "4",
    name: "Special Promotion",
    description: "Promote your special offers and deals with this engaging template.",
    category: "promotion"
  },
  {
    id: "5",
    name: "Monthly Newsletter",
    description: "Keep your audience updated with monthly news and updates.",
    category: "newsletter"
  },
  {
    id: "6",
    name: "Product Launch",
    description: "Announce new products or services with this impactful template.",
    category: "announcement"
  }
];

const CATEGORIES = [
  { label: "Announcement", value: "announcement" },
  { label: "Newsletter", value: "newsletter" },
  { label: "Event", value: "event" },
  { label: "Promotion", value: "promotion" }
];

export default function Templates() {
  const [filter, setFilter] = useState("");
  const [templates] = useState(initialTemplates);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"name" | "category">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleSort = (field: "name" | "category") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const filteredTemplates = templates
    .filter(
      (t) =>
        (selectedCategories.length === 0 || selectedCategories.includes(t.category)) &&
        (t.name.toLowerCase().includes(filter.toLowerCase()) ||
          t.description.toLowerCase().includes(filter.toLowerCase()))
    )
    .sort((a, b) => {
      const compareValue = sortOrder === "asc" ? 1 : -1;
      return a[sortBy] > b[sortBy] ? compareValue : -compareValue;
    });

  return (
    <div className="min-h-screen w-full py-8 px-[10%]">
      <header className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          Templates
        </h1>
      </header>

      <div className="space-y-4">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--foreground)]" />
          <input
            type="text"
            placeholder="Search templates..."
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
                {CATEGORIES.map((category) => (
                  <label key={category.value} className="flex items-center space-x-2 p-2 hover:bg-[var(--accent)] rounded-md cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.value)}
                      onChange={() => handleCategoryChange(category.value)}
                      className="accent-[var(--primary)]"
                    />
                    <span className="text-[var(--foreground)]">{category.label}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--foreground)]">Sort by:</span>
            <div className="flex gap-2">
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
                onClick={() => handleSort("category")}
                className={`${sortBy === "category" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"}`}
              >
                Category {sortBy === "category" && <ArrowUpDown className="ml-1 h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <Button className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </div>

        <main className="mx-auto mt-6">
          {filteredTemplates.length === 0 ? (
            <div className="text-center p-8 bg-[var(--background)] rounded-lg shadow">
              <p className="text-[var(--foreground)]">No templates found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-[var(--background)] rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="h-40 bg-[var(--accent)] flex items-center justify-center">
                    <span className="text-4xl font-bold text-[var(--accent-foreground)]">
                      {template.name.charAt(0)}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                      {template.name}
                    </h3>
                    <p className="text-[var(--foreground)] text-sm mb-4">
                      {template.description}
                    </p>
                    <span className="inline-block px-3 py-1 rounded-full text-xs bg-[var(--muted)] text-[var(--muted-foreground)] capitalize">
                      {template.category}
                    </span>
                  </div>
                  <div className="px-6 pb-6">
                    <Button className="w-full" variant="outline">
                      Use Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}