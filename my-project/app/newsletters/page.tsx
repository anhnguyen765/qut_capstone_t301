"use client";

import { useState } from "react";
import { Search, Filter, Plus, ArrowUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";

type Newsletter = {
  id: string;
  title: string;
  description: string;
  status: "draft" | "scheduled" | "sent";
  date: string;
  recipients: number;
};

const initialNewsletters: Newsletter[] = [
  {
    id: "1",
    title: "Monthly Product Updates",
    description: "Latest features and improvements in our product lineup.",
    status: "sent",
    date: "2024-03-15",
    recipients: 2500
  },
  {
    id: "2",
    title: "Spring Sale Announcement",
    description: "Exclusive spring deals and promotions for our customers.",
    status: "scheduled",
    date: "2024-03-20",
    recipients: 5000
  },
  {
    id: "3",
    title: "Customer Success Stories",
    description: "Highlighting achievements and testimonials from our users.",
    status: "draft",
    date: "2024-03-25",
    recipients: 3000
  },
  {
    id: "4",
    title: "Industry Insights Q1",
    description: "Analysis of market trends and industry developments.",
    status: "sent",
    date: "2024-03-10",
    recipients: 4200
  },
  {
    id: "5",
    title: "Team Newsletter",
    description: "Internal updates and company culture highlights.",
    status: "draft",
    date: "2024-03-22",
    recipients: 150
  },
  {
    id: "6",
    title: "Feature Spotlight",
    description: "Deep dive into our latest product features.",
    status: "scheduled",
    date: "2024-03-18",
    recipients: 3800
  }
];

const STATUS_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Sent", value: "sent" }
];

export default function Newsletters() {
  const [filter, setFilter] = useState("");
  const [newsletters] = useState(initialNewsletters);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"title" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleStatusChange = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const handleSort = (field: "title" | "date") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const filteredNewsletters = newsletters
    .filter(
      (n) =>
        (selectedStatuses.length === 0 || selectedStatuses.includes(n.status)) &&
        (n.title.toLowerCase().includes(filter.toLowerCase()) ||
          n.description.toLowerCase().includes(filter.toLowerCase()))
    )
    .sort((a, b) => {
      const compareValue = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "date") {
        return a.date > b.date ? compareValue : -compareValue;
      }
      return a[sortBy] > b[sortBy] ? compareValue : -compareValue;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "sent":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen w-full p-8 sm:p-20">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-[var(--foreground)]">
          Newsletters
        </h1>
      </header>

      <div className="max-w-full mx-auto space-y-4">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--foreground)]" />
          <input
            type="text"
            placeholder="Search newsletters..."
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
                {STATUS_OPTIONS.map((status) => (
                  <label key={status.value} className="flex items-center space-x-2 p-2 hover:bg-[var(--accent)] rounded-md cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.includes(status.value)}
                      onChange={() => handleStatusChange(status.value)}
                      className="accent-[var(--primary)]"
                    />
                    <span className="text-[var(--foreground)]">{status.label}</span>
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
                onClick={() => handleSort("title")}
                className={`${sortBy === "title" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"}`}
              >
                Title {sortBy === "title" && <ArrowUpDown className="ml-1 h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("date")}
                className={`${sortBy === "date" ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"}`}
              >
                Date {sortBy === "date" && <ArrowUpDown className="ml-1 h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <Button className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            New Newsletter
          </Button>
        </div>

        <main className="mx-auto mt-6">
          {filteredNewsletters.length === 0 ? (
            <div className="text-center p-8 bg-[var(--background)] rounded-lg shadow">
              <p className="text-[var(--foreground)]">No newsletters found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {filteredNewsletters.map((newsletter) => (
                <div
                  key={newsletter.id}
                  className="bg-[var(--background)] rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="h-40 bg-[var(--accent)] flex items-center justify-center">
                    <span className="text-4xl font-bold text-[var(--accent-foreground)]">
                      {newsletter.title.charAt(0)}
                    </span>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-semibold text-[var(--foreground)]">
                        {newsletter.title}
                      </h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs capitalize ${getStatusColor(newsletter.status)}`}>
                        {newsletter.status}
                      </span>
                    </div>
                    <p className="text-[var(--foreground)] text-sm mb-4">
                      {newsletter.description}
                    </p>
                    <div className="flex justify-between items-center text-sm text-[var(--muted-foreground)]">
                      <span>{new Date(newsletter.date).toLocaleDateString()}</span>
                      <span>{newsletter.recipients.toLocaleString()} recipients</span>
                    </div>
                  </div>
                  <div className="px-6 pb-6">
                    <Button className="w-full" variant="outline">
                      {newsletter.status === "draft" ? "Edit" : newsletter.status === "scheduled" ? "Manage" : "View Report"}
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