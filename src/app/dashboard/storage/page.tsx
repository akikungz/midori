import { redirect } from "next/navigation";
import { FolderPlus, Upload } from "lucide-react";

import { getServerSession } from "@midori/lib/server-api";
import { Button } from "@midori/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midori/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@midori/components/ui/field";
import { Input } from "@midori/components/ui/input";
import { StorageClient } from "@midori/components/storage/StorageClient";

export default async function StoragePage() {
  const user = await getServerSession();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Storage</h1>
          <p className="text-muted-foreground">
            Manage your files and documents
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="mr-2 size-4" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Enter a name for the new folder
                </DialogDescription>
              </DialogHeader>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="folder-name">Folder Name</FieldLabel>
                  <Input id="folder-name" placeholder="My Folder" />
                </Field>
                <Button className="w-full">Create Folder</Button>
              </FieldGroup>
            </DialogContent>
          </Dialog>
          <Button>
            <Upload className="mr-2 size-4" />
            Upload
          </Button>
        </div>
      </div>

      <StorageClient />
    </div>
  );
}
