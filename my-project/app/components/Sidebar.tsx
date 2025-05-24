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
  DropdownMenuItem
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
  House
} from "lucide-react";

import Link from "next/link";

export function AppSidebar() {
  return (
    <Sidebar className="bg-[var(--background)] text-[var(--foreground)] border-r border-[var(--border)]">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="font-bold text-lg px-4 py-2 rounded-md hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">
                  2bentrods CRM
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full p-0" align="end">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <Link href="/login" prefetch={false}>
                  <DropdownMenuItem>Login</DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
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
                  <SidebarMenuButton className="px-4 py-2 gap-x-2 rounded hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors group-data-[state=open]/collapsible:bg-[var(--accent)] group-data-[state=open]/collapsible:text-[var(--accent-foreground)]">
                    <PartyPopper className="h-5 w-5" />
                    <span className="font-semibold">Marketing</span>
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
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
                  <SidebarMenuButton className="px-4 py-2 gap-x-2 rounded hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors group-data-[state=open]/collapsible:bg-[var(--accent)] group-data-[state=open]/collapsible:text-[var(--accent-foreground)]">
                    <Users className="h-5 w-5" />
                    <span className="font-semibold">Contacts</span>
                    <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden">
                  <SidebarMenuSub>
                    {["Companies", "Private", "Groups", "Schools"].map((item) => (
                      <Link key={item} href="/contacts" prefetch>
                        <SidebarMenuSubItem className="px-6 py-2 rounded hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">
                          {item}
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
    </Sidebar>
  );
}
