"use client";

import { useAuth } from "@/app/contexts/AuthContext";
import { SidebarTrigger } from "@/app/components/ui/sidebar";

export function ConditionalSidebarTrigger() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return <SidebarTrigger className="text-[var(--foreground)] w-10 px-0 h-10" />;
} 