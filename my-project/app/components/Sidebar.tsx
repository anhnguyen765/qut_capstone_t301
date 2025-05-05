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
} from "@/app/components/ui/sidebar"

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/app/components/ui/dropdown-menu"

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent
} from "@/app/components/ui/collapsible"

import {
  ChevronDown,
  PartyPopper,
  Users,
  ChartNoAxesColumn,
  House
} from "lucide-react"

import Link from "next/link"

export function AppSidebar() {
  return (
    <Sidebar className="text-[var(--foreground)]">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="font-bold text-lg hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]">
                  2bentrods CRM
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-popper-anchor-width p-0" align="end">
                <DropdownMenuItem>
                  <span>Profile</span>
                </DropdownMenuItem>
                <Link href="/login">
                  <DropdownMenuItem>
                    Login
                  </DropdownMenuItem>
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]">
                <Link href="/">
                  <House className="ml-2" />
                  <span className="font-bold ">Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            { /* Marketing Section */}
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild >
                  <SidebarMenuButton className="
                    group/collapsible 
                    mb-1 
                    hover:bg-[var(--accent)] 
                    hover:text-[var(--accent-foreground)] 
                    data-[state=open]:[&:hover]:bg-[var(--accent)] 
                    data-[state=open]:[&:hover]:text-[var(--accent-foreground)]
                    transition-colors
                  ">
                    <PartyPopper className="ml-2" />
                    <span className="font-bold">Marketing</span>
                    <ChevronDown className="ml-auto h-4 w-4 transition-all duration-200 group-data-[state=open]/collapsible:rotate-180" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                  <SidebarMenuSub>
                    <Link href="/campaigns">
                      <SidebarMenuSubItem className="hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">
                        Campaigns
                      </SidebarMenuSubItem>
                    </Link>
                    <Link href="/templates">
                      <SidebarMenuSubItem className="hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">                        
                        Templates
                      </SidebarMenuSubItem>
                    </Link>
                    <Link href="/newsletters">
                      <SidebarMenuSubItem className="hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">                        
                        Newsletters
                      </SidebarMenuSubItem>
                    </Link>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
            { /* Contacts Section */}
            <Collapsible defaultOpen className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton className="
                    group/collapsible 
                    mb-1 
                    hover:bg-[var(--accent)] 
                    hover:text-[var(--accent-foreground)] 
                    data-[state=open]:[&:hover]:bg-[var(--accent)] 
                    data-[state=open]:[&:hover]:text-[var(--accent-foreground)]
                    transition-colors
                  ">
                    <Users className="ml-2" />
                    <span className="font-bold">Contacts</span>
                    <ChevronDown className="ml-auto h-4 w-4 transition-all duration-200 group-data-[state=open]/collapsible:rotate-180" />                    
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                  <SidebarMenuSub>
                    <Link href="/contacts">
                      <SidebarMenuSubItem className="hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">                        
                        Companies
                      </SidebarMenuSubItem>
                    </Link>
                    <Link href="/contacts">
                      <SidebarMenuSubItem className="hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">                        
                        Private
                      </SidebarMenuSubItem>
                    </Link>
                    <Link href="/contacts">
                      <SidebarMenuSubItem className="hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">                        
                        Groups
                      </SidebarMenuSubItem>
                    </Link>
                    <Link href="/contacts">
                      <SidebarMenuSubItem className="hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors">                        
                        Schools
                      </SidebarMenuSubItem>
                    </Link>                                 
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
            <SidebarMenuItem className="hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]">
              <SidebarMenuButton asChild>
                <Link href="/analytics">
                  <ChartNoAxesColumn className="ml-2" />
                  <span className="font-bold">Analytics</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarContent>
    </Sidebar>
  )
}
