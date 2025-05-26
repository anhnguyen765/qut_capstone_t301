"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/app/components/ui/sidebar";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/app/components/ui/dropdown-menu";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent
} from "@/app/components/ui/collapsible";

import {
  ChevronDown,
  PartyPopper,
  Users,
  ChartNoAxesColumn,
  House,
  LogOut,
  User,
  Settings
} from "lucide-react";

import Link from "next/link";
import Image from "next/image";

export function AppSidebar() {
  return (
    <Sidebar className="bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)] flex flex-col">
      <SidebarHeader className="px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 w-full rounded-lg p-2 hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors outline-none">
              <Image
                src="/default-avatar.svg"
                alt="User Avatar"
                width={40}
                height={40}
                className="rounded-full text-[var(--foreground)]"
              />
              <div className="flex-1 text-left">
                <div className="font-semibold">Admin User</div>
              </div>
              <ChevronDown className="h-4 w-4 text-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4 text-foreground" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <Link href="/login" prefetch={false}>
              <DropdownMenuItem className="text-[var(--destructive)]">
                <LogOut className="mr-2 h-4 w-4 text-foreground" />
                Logout
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent className="flex-1">
        <SidebarGroupContent>
          <SidebarMenu>
            {/* Dashboard */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="px-4 py-2 gap-x-2 hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] rounded transition-colors">
                <Link href="/" prefetch>
                  <House className="h-5 w-5" />
                  <span className="font-semibold">Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Marketing */}
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <Link href="/campaigns" prefetch>
                    <SidebarMenuButton className="w-full px-4 py-2 gap-x-2 rounded hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">
                      <PartyPopper className="h-5 w-5" />
                      <span className="font-semibold">Marketing</span>
                      <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </Link>
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden">
                  <SidebarMenuSub>
                    {["Campaigns", "Templates", "Newsletters"].map((item) => (
                      <Link key={item} href={`/${item.toLowerCase()}`} prefetch>
                        <SidebarMenuSubItem className="px-6 py-2 rounded hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">
                          {item}
                        </SidebarMenuSubItem>
                      </Link>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            {/* Contacts */}
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <Link href="/contacts" prefetch>
                    <SidebarMenuButton className="w-full px-4 py-2 gap-x-2 rounded hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">
                      <Users className="h-5 w-5" />
                      <span className="font-semibold">Contacts</span>
                      <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                  </Link>
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden">
                  <SidebarMenuSub>
                    {[
                      { label: "Companies", value: "companies" },
                      { label: "Private", value: "private" },
                      { label: "Groups", value: "groups" },
                      { label: "OSHC", value: "oshc" },
                      { label: "Schools", value: "schools" }
                    ].map((item) => (
                      <Link key={item.value} href={`/contacts/${item.value}`} prefetch>
                        <SidebarMenuSubItem className="px-6 py-2 rounded hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">
                          {item.label}
                        </SidebarMenuSubItem>
                      </Link>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            {/* Analytics */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="px-4 py-2 gap-x-2 rounded hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">
                <Link href="/analytics" prefetch>
                  <ChartNoAxesColumn className="h-5 w-5" />
                  <span className="font-semibold">Analytics</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarContent>

      <div className="p-4 flex justify-center items-center border-t border-[var(--border)]">
        <Image
          src="/logo.svg"
          alt="2bentrods Logo"
          width={300}
          height={300}
          className="text-[var(--foreground)]"
        />
      </div>
    </Sidebar>
  );
}
