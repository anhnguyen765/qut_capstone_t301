import { useState, useEffect } from 'react';

interface ContactGroup {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  contact_count?: number;
}

interface UseContactGroupsReturn {
  groups: ContactGroup[];
  groupNames: string[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useContactGroups(): UseContactGroupsReturn {
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/contact-groups");
      
      if (!response.ok) {
        throw new Error("Failed to fetch contact groups");
      }
      
      const data = await response.json();
      setGroups(data);
    } catch (err) {
      console.error("Error fetching contact groups:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch contact groups");
      
      // Fallback to hardcoded groups if API fails
      setGroups([
        { id: 1, name: "Companies", is_active: true, created_at: "", updated_at: "" },
        { id: 2, name: "Groups", is_active: true, created_at: "", updated_at: "" },
        { id: 3, name: "Private", is_active: true, created_at: "", updated_at: "" },
        { id: 4, name: "OSHC", is_active: true, created_at: "", updated_at: "" },
        { id: 5, name: "Schools", is_active: true, created_at: "", updated_at: "" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const groupNames = groups.map(group => group.name);

  return {
    groups,
    groupNames,
    loading,
    error,
    refetch: fetchGroups,
  };
}

// Helper hook for just the group names (for dropdowns, etc.)
export function useContactGroupNames(): string[] {
  const { groupNames } = useContactGroups();
  return groupNames;
}