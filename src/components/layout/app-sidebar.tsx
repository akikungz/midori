"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cloud,
  FolderOpen,
  GraduationCap,
  Home,
  Layers,
  MailIcon,
  Server,
  Settings,
  Users,
  CalendarDays,
  FileText,
  FilePlus,
} from "lucide-react";

import { useSession } from "@midori/hooks/useSession";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@midori/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@midori/components/ui/avatar";
import { RoleGuard } from "@midori/components/RoleGuard";
import { getRoleDisplayName, getRoleBadgeVariant } from "@midori/lib/roles";
import { Badge } from "@midori/components/ui/badge";

/**
 * Main navigation items available to all users
 */
const mainNavItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Instances",
    url: "/dashboard/instances",
    icon: Server,
  },
  {
    title: "Requests",
    url: "/dashboard/requests",
    icon: FileText,
  },
  {
    title: "Storage",
    url: "/dashboard/storage",
    icon: FolderOpen,
  },
];

/**
 * Admin-only navigation items
 */
const adminNavItems = [
  {
    title: "Courses",
    url: "/dashboard/admin/courses",
    icon: GraduationCap,
  },
  {
    title: "Semesters",
    url: "/dashboard/admin/semesters",
    icon: CalendarDays,
  },
  {
    title: "Instructors",
    url: "/dashboard/admin/instructors",
    icon: Users,
  },
  {
    title: "Mailing List",
    url: "/dashboard/admin/mailing-list",
    icon: MailIcon,
  },
  {
    title: "All Instances",
    url: "/dashboard/admin/instances",
    icon: Layers,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, role } = useSession();

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Cloud className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">FITM Cloud</span>
                  <span className="text-xs text-muted-foreground">
                    Platform
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link href={item.url}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Navigation - Only visible to admins */}
        <RoleGuard roles={["ADMIN"]}>
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </RoleGuard>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === "/dashboard/settings"}
              tooltip="Settings"
            >
              <Link href="/dashboard/settings">
                <Settings className="size-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default">
              <Avatar className="size-8">
                <AvatarFallback className="text-xs">
                  {user?.name ? getInitials(user.name) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 leading-none overflow-hidden">
                <span className="truncate font-medium">
                  {user?.name || "Loading..."}
                </span>
                {role && (
                  <Badge
                    variant={getRoleBadgeVariant(role)}
                    className="w-fit text-[10px] px-1.5 py-0"
                  >
                    {getRoleDisplayName(role)}
                  </Badge>
                )}
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
