"use client";

import { useState } from "react";
import { Search, Filter, Plus, ArrowUpDown, Calendar } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";

type Campaign = {
  id: string;
  title: string;
  date: string;
  type: "workshop" | "event" | "community" | "special";
};

const CAMPAIGN_TYPES = [
  { label: "Workshop", value: "workshop" },
  { label: "Event", value: "event" },
  { label: "Community", value: "community" },
  { label: "Special", value: "special" },
];

const initialCampaigns: Campaign[] = [
  {
    id: "1",
    title: "Summer Fishing Workshop Series",
    date: "2025-06-30",
    type: "workshop",
  },
  {
    id: "2",
    title: "Teen Fishing & Survival Skills",
    date: "2025-07-10",
    type: "workshop",
  },
  {
    id: "3",
    title: "Family Fishing Day",
    date: "2025-08-03",
    type: "event",
  },
  {
    id: "4",
    title: "Girls Fishing Program",
    date: "2025-09-24",
    type: "special",
  },
  {
    id: "5",
    title: "Community BBQ & Fishing",
    date: "2025-10-06",
    type: "community",
  },
  {
    id: "6",
    title: "Kids Fishing Play Day",
    date: "2025-11-01",
    type: "event",
  },
];

export default function Campaigns() {
  const [filter, setFilter] = useState("");
  const [campaigns] = useState(initialCampaigns);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"date" | "type">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleTypeChange = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleSort = (field: "date" | "type") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const filteredCampaigns = campaigns
    .filter(
      (c) =>
        (selectedTypes.length === 0 || selectedTypes.includes(c.type)) &&
        c.title.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      const compareValue = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "date") {
        return a.date > b.date ? compareValue : -compareValue;
      }
      return a.type > b.type ? compareValue : -compareValue;
    });

  const getTypeLabel = (type: string) => {
    return CAMPAIGN_TYPES.find((t) => t.value === type)?.label || type;
  };

  return (
    <div className="min-h-screen w-full p-8 sm:p-20">
      <header className="mb-12">
        <h1 className="text-4xl font-bold text-[var(--foreground)]">
          Past Campaigns
        </h1>
      </header>

      <div className="max-w-full mx-auto space-y-4">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--foreground)]" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-10 pr-12 p-4 border border-[var(--border)] rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)] bg-[var(--background)] text-[var(--foreground)]"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 bg-background hover:bg-[var(--accent)] rounded-md">
                <Filter className="h-5 w-5 text-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="end">
              <div className="space-y-2">
                {CAMPAIGN_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center space-x-2 p-2 hover:bg-[var(--accent)] rounded-md cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(type.value)}
                      onChange={() => handleTypeChange(type.value)}
                      className="accent-[var(--primary)]"
                    />
                    <span className="text-foreground">{type.label}</span>
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
                onClick={() => handleSort("type")}
                className={`${
                  sortBy === "type"
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                }`}
              >
                Type{" "}
                {sortBy === "type" && <ArrowUpDown className="ml-1 h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSort("date")}
                className={`${
                  sortBy === "date"
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                }`}
              >
                Date{" "}
                {sortBy === "date" && <ArrowUpDown className="ml-1 h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>

        <div className="bg-[var(--background)] rounded-lg shadow overflow-hidden">
          <div className="min-w-full">
            <div className="divide-y divide-[var(--border)]">
              {filteredCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="p-4 hover:bg-[var(--accent)] transition-colors"
                >
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center mr-4">
                      <span className="text-lg font-semibold text-[var(--accent-foreground)]">
                        {campaign.title.charAt(0)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <h4 className="font-medium text-[var(--foreground)]">
                        {campaign.title}
                      </h4>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="text-sm text-[var(--foreground)] flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {new Date(campaign.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </div>
                        <span className="text-sm text-accent-foreground bg-accent rounded-md px-2 py-1">
                          {getTypeLabel(campaign.type)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
