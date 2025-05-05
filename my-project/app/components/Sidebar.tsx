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
    <Sidebar>
      <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="font-bold text-lg hover:bg-gray-200 transition-colors">
                    2bentrods CRM
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-popper-anchor-width p-0" align="end">
                  <DropdownMenuItem>
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <span>
                      <Link
                        href="/login">
                        Login
                      </Link>
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/">
                    <House className="ml-2" />
                    <span className="font-bold">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="group/collapsible mb-1">
                      <PartyPopper  className="ml-2"/>
                      <span className="font-bold">Marketing</span>
                      <ChevronDown className="ml-auto h-4 w-4 transition-all duration-200 group-data-[state=open]/collapsible:rotate-180" />                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <Link href="/campaigns">Campaigns</Link>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Link href="/templates">Templates</Link>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Link href="/newsletters">Newsletters</Link>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton className="group/collapsible">
                      <Users className="ml-2" />
                      <span className="font-bold">Contacts</span>
                      <ChevronDown className="ml-auto h-4 w-4 transition-all duration-200 group-data-[state=open]/collapsible:rotate-180" />                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <Link href="/contacts">Companies</Link>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Link href="/contacts">Private</Link>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Link href="/contacts">Groups</Link>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <Link href="/contacts">Schools</Link>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
              <SidebarMenuItem>
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
