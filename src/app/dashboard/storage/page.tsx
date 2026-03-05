import { redirect } from "next/navigation";

import { getServerSession } from "@midori/lib/server-api";
import { StorageClient } from "@midori/components/storage";

export default async function StoragePage() {
  const user = await getServerSession();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Storage</h1>
        <p className="text-muted-foreground">
          Browse and manage your files and folders
        </p>
      </div>

      <StorageClient />
    </div>
  );
}
