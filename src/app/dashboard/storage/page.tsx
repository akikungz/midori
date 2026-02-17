import type { Metadata } from "next";
import { StorageClient } from "@midori/components/storage/StorageClient";

export const metadata: Metadata = {
  title: "Storage - FITM Cloud",
  description: "Manage your cloud files and assets.",
};

export default function StoragePage() {
  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Cloud Storage</h2>
          <p className="text-muted-foreground">
            Manage your personal files and project assets.
          </p>
        </div>
      </div>
      <StorageClient />
    </div>
  );
}
