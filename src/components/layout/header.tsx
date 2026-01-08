"use client";

import { useEffect, useState } from "react";
import { SidebarTrigger } from "@midori/components/ui/sidebar";
import { Separator } from "@midori/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midori/components/ui/dropdown-menu";
import { Button } from "@midori/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@midori/components/ui/avatar";
import { Badge } from "@midori/components/ui/badge";
import { LogOut, Moon, Sun, User } from "lucide-react";
import { useTheme } from "next-themes";
import { redirect } from "next/navigation";

import { useSession, useClearSession } from "@midori/hooks/useSession";
import { authClient } from "@midori/lib/auth-client";
import { api } from "@midori/lib/api";

export function DashboardHeader() {
  const { user } = useSession();
  const clearSession = useClearSession();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: currentSemester, isPending } = api.useQuery(
    "get",
    "/api/academic/semesters/current",
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          clearSession();
          redirect("/login");
        },
      },
    });
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return (
      <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-6" />
        <div className="flex-1" />
      </header>
    );
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />

      <div className="flex-1" />

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="size-8"
      >
        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      {!isPending && currentSemester && (
        <Badge variant="default">{currentSemester.name}</Badge>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8">
            <Avatar className="size-7">
              <AvatarImage src={user?.image || undefined} alt={user?.name} />
              <AvatarFallback className="text-xs">
                {user?.name ? getInitials(user.name) : "?"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user?.name || "Loading..."}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email || ""}
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/dashboard/settings">
              <User className="mr-2 size-4" />
              Settings
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="text-destructive"
          >
            <LogOut className="mr-2 size-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
