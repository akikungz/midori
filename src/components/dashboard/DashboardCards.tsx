"use client";

import { useRouter } from "next/navigation";
import {
  Server,
  FileText,
  FolderOpen,
  Key,
  ArrowRight,
  Plus,
  Clock,
} from "lucide-react";

import type { Role } from "@midori/lib/roles";
import {
  getRoleDisplayName,
  getRoleBadgeVariant,
  hasPermission,
} from "@midori/lib/roles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midori/components/ui/card";
import { Button } from "@midori/components/ui/button";
import { Badge } from "@midori/components/ui/badge";

interface DashboardCardsProps {
  user: {
    name?: string | null;
    role?: string;
  } | null;
}

export function DashboardCards({ user }: DashboardCardsProps) {
  const router = useRouter();
  const role = user?.role as Role | undefined;
  const isStudent = role === "STUDENT";

  const can = (permission: string) => {
    if (!role) return false;
    return hasPermission(
      role,
      permission as Parameters<typeof hasPermission>[1],
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0] || "User"}!
          </h1>
          {role && (
            <Badge variant={getRoleBadgeVariant(role)}>
              {getRoleDisplayName(role)}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          Here's an overview of your FITM Cloud resources.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* My Instances */}
        <Card className="group cursor-pointer transition-colors hover:border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Instances</CardTitle>
            <Server className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>
              View and manage your virtual machine instances
            </CardDescription>
            <Button
              variant="link"
              className="mt-2 h-auto p-0"
              onClick={() => router.push("/dashboard/instances")}
            >
              View Instances
              <ArrowRight className="ml-1 size-3" />
            </Button>
          </CardContent>
        </Card>

        {/* Requests */}
        <Card className="group cursor-pointer transition-colors hover:border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Requests</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>
              {isStudent
                ? "Submit new instance requests or check status"
                : "Review and manage instance requests"}
            </CardDescription>
            <Button
              variant="link"
              className="mt-2 h-auto p-0"
              onClick={() => router.push("/dashboard/requests")}
            >
              {isStudent ? "View Requests" : "Review Requests"}
              <ArrowRight className="ml-1 size-3" />
            </Button>
          </CardContent>
        </Card>

        {/* Storage */}
        {can("VIEW_STORAGE") && (
          <Card className="group cursor-pointer transition-colors hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Storage</CardTitle>
              <FolderOpen className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Manage your files and shared documents
              </CardDescription>
              <Button
                variant="link"
                className="mt-2 h-auto p-0"
                onClick={() => router.push("/dashboard/storage")}
              >
                Open Storage
                <ArrowRight className="ml-1 size-3" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* SSH Keys */}
        <Card className="group cursor-pointer transition-colors hover:border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">SSH Keys</CardTitle>
            <Key className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription>
              Manage your SSH keys for secure access
            </CardDescription>
            <Button
              variant="link"
              className="mt-2 h-auto p-0"
              onClick={() => router.push("/dashboard/settings")}
            >
              Manage Keys
              <ArrowRight className="ml-1 size-3" />
            </Button>
          </CardContent>
        </Card>

        {/* Student: Request New Instance */}
        {can("CREATE_REQUEST") && (
          <Card className="group cursor-pointer border-dashed transition-colors hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                New Instance Request
              </CardTitle>
              <Plus className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Submit a request for a new virtual machine
              </CardDescription>
              <Button
                variant="link"
                className="mt-2 h-auto p-0"
                onClick={() => router.push("/dashboard/requests/new")}
              >
                Create Request
                <ArrowRight className="ml-1 size-3" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Instructor/Admin: Create Instance */}
        {can("CREATE_INSTANCE") && (
          <Card className="group cursor-pointer border-dashed transition-colors hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Create Instance
              </CardTitle>
              <Plus className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Directly create a new virtual machine instance
              </CardDescription>
              <Button
                variant="link"
                className="mt-2 h-auto p-0"
                onClick={() => router.push("/dashboard/instances/new")}
              >
                Create Instance
                <ArrowRight className="ml-1 size-3" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Admin: Pending Reviews */}
        {can("REVIEW_REQUEST") && (
          <Card className="group cursor-pointer transition-colors hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Reviews
              </CardTitle>
              <Clock className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CardDescription>
                Review pending instance and extension requests
              </CardDescription>
              <Button
                variant="link"
                className="mt-2 h-auto p-0"
                onClick={() =>
                  router.push("/dashboard/requests?status=PENDING")
                }
              >
                Review Pending
                <ArrowRight className="ml-1 size-3" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
