import { redirect } from "next/navigation";

import { getServerSession } from "@midori/lib/server-api";
import { SettingsClient } from "@midori/components/settings/SettingsClient";

export default async function SettingsPage() {
  const user = await getServerSession();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and SSH keys
        </p>
      </div>

      <SettingsClient user={user} />
    </div>
  );
}
