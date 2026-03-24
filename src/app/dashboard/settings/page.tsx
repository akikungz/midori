import { SettingsClient } from "@midori/components/settings/SettingsClient";
import { requireServerSession } from "@midori/lib/server-auth";

export default async function SettingsPage() {
  const { user } = await requireServerSession();

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
