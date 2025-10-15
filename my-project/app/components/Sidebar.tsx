"use client";

import { useAuth } from "@/app/contexts/AuthContext";
import { usePathname } from "next/navigation";
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
  Settings,
  Mail,
  Monitor
} from "lucide-react";

import Link from "next/link";
import Image from "next/image";

export function AppSidebar() {

  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();

  // Don't render the sidebar on public pages or when not authenticated
  const publicPages = ["/login", "/register"];
  if (!isAuthenticated || publicPages.includes(pathname || "")) {
    return null;
  }

  // Show sidebar to all users, but handle logout only if authenticated
  const handleLogout = () => {
    if (isAuthenticated) {
      // Clear cookies
      document.cookie = "authToken=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      logout();
    }
  };

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
              <div className="flex-1 text-left min-w-0">
                <div className="font-semibold truncate">
                  {user ? `${user.firstName} ${user.lastName}` : 'Guest User'}
                </div>
                <div className="text-sm text-foreground truncate" title={user?.email || 'No email'}>
                  {user?.email ? (user.email.length > 20 ? `${user.email.substring(0, 20)}...` : user.email) : 'Not logged in'}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[200px]">
            {isAuthenticated && user ? (
              <>
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4 text-foreground" />
                  Profile
                </DropdownMenuItem>
                {user.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/users" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4 text-foreground" />
                      Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-[var(--foreground)]">
                  <LogOut className="mr-2 h-4 w-4 text-foreground" />
                  Logout
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/login" className="flex items-center">
                    <User className="mr-2 h-4 w-4 text-foreground" />
                    Login
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/register" className="flex items-center">
                    <User className="mr-2 h-4 w-4 text-foreground" />
                    Register
                  </Link>
                </DropdownMenuItem>
              </>
            )}
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

            {/* Send Email */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="px-4 py-2 gap-x-2 hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] rounded transition-colors">
                <Link href="/send-email" prefetch>
                  <Mail className="h-5 w-5" />
                  <span className="font-semibold">Send Email</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Marketing */}
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="w-full px-4 py-2 gap-x-2 rounded hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">
                      <PartyPopper className="h-5 w-5" />
                      <span className="font-semibold">Marketing</span>
                      <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden">
                  <SidebarMenuSub>
                    {["Campaigns", "Newsletters", "Templates"].map((item) => (
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

            {/* Calendar */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="px-4 py-2 gap-x-2 rounded hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">
                <Link href="/calendar" prefetch>
                  {/* You can use a calendar icon from lucide-react or similar */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  <span className="font-semibold">Calendar</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarContent>

      <div className="p-4 flex justify-center items-center border-t border-[var(--border)]">
        <Image
          src="/Logo.svg"
          alt="2bentrods Logo"
          width={300}
          height={300}
          className="text-[var(--foreground)]"
        />
      </div>
    </Sidebar>
  );
}