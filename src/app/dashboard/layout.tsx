import type { PropsWithChildren } from "react";
import { cookies } from "next/headers";

import { SidebarProvider, SidebarInset } from "@midori/components/ui/sidebar";
import { AppSidebar } from "@midori/components/layout/app-sidebar";
import { DashboardHeader } from "@midori/components/layout/header";

export default async function DashboardLayout({
  children,
}: Readonly<PropsWithChildren>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
