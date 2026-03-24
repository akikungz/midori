import { StorageClient } from "@midori/components/storage";
import { requireServerSession } from "@midori/lib/server-auth";

export default async function StoragePage() {
  await requireServerSession();

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
