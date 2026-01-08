"use client";

import { useState } from "react";
import {
  X,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  File,
  Folder,
  Globe,
  Lock,
  Users,
} from "lucide-react";

import { api } from "@midori/lib/api";
import { Button } from "@midori/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midori/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@midori/components/ui/alert-dialog";
import { Field, FieldGroup, FieldLabel } from "@midori/components/ui/field";
import { Input } from "@midori/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midori/components/ui/select";
import { Switch } from "@midori/components/ui/switch";
import { Progress } from "@midori/components/ui/progress";
import { Separator } from "@midori/components/ui/separator";
import { ScrollArea } from "@midori/components/ui/scroll-area";
import { formatFileSize, formatDateTime } from "@midori/lib/format";
import type { FileData, UploadFile, FileVersion } from "@midori/types/admin";

// ==================== Create Folder Dialog ====================

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderName: string;
  onFolderNameChange: (name: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  folderName,
  onFolderNameChange,
  onSubmit,
  isSubmitting,
}: CreateFolderDialogProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for your new folder
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="folder-name">Folder Name</FieldLabel>
              <Input
                id="folder-name"
                placeholder="My Folder"
                value={folderName}
                onChange={(e) => onFolderNameChange(e.target.value)}
                autoFocus
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!folderName.trim() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Folder"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Rename Dialog ====================

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function RenameDialog({
  open,
  onOpenChange,
  name,
  onNameChange,
  onSubmit,
  isSubmitting,
}: RenameDialogProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
            <DialogDescription>Enter a new name</DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-4">
            <Field>
              <FieldLabel htmlFor="rename-input">Name</FieldLabel>
              <Input
                id="rename-input"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                autoFocus
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Renaming...
                </>
              ) : (
                "Rename"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Delete Dialog ====================

interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileData | null;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function DeleteDialog({
  open,
  onOpenChange,
  file,
  onConfirm,
  isSubmitting,
}: DeleteDialogProps) {
  if (!file) return null;

  const isFolder = file.type === "FOLDER";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {isFolder ? "Folder" : "File"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{file.name}&quot;?
            {isFolder && " This will also delete all files inside the folder."}
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ==================== Move Dialog ====================

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileData | null;
  targetParentId: string | null;
  onTargetChange: (id: string | null) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  currentParentId: string | null;
}

export function MoveDialog({
  open,
  onOpenChange,
  file,
  targetParentId,
  onTargetChange,
  onSubmit,
  isSubmitting,
  currentParentId,
}: MoveDialogProps) {
  // Fetch folders for selection
  const { data } = api.useQuery("get", "/api/storage/files", {
    params: {
      query: {
        page: 1,
        pageSize: 100,
        type: "FOLDER",
      },
    },
  }) as { data: { values: FileData[] } | undefined };

  const folders = data?.values || [];

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move &quot;{file.name}&quot;</DialogTitle>
          <DialogDescription>Select the destination folder</DialogDescription>
        </DialogHeader>
        <FieldGroup className="py-4">
          <Field>
            <FieldLabel>Destination Folder</FieldLabel>
            <Select
              value={targetParentId ?? "root"}
              onValueChange={(v) => onTargetChange(v === "root" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">
                  <div className="flex items-center gap-2">
                    <Folder className="size-4" />
                    Home (Root)
                  </div>
                </SelectItem>
                {folders
                  .filter((f) => f.id !== file.id && f.id !== currentParentId)
                  .map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2">
                        <Folder className="size-4" />
                        {folder.name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Moving...
              </>
            ) : (
              "Move"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Copy Dialog ====================

interface CopyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileData | null;
  targetParentId: string | null;
  onTargetChange: (id: string | null) => void;
  newName: string;
  onNewNameChange: (name: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function CopyDialog({
  open,
  onOpenChange,
  file,
  targetParentId,
  onTargetChange,
  newName,
  onNewNameChange,
  onSubmit,
  isSubmitting,
}: CopyDialogProps) {
  // Fetch folders for selection
  const { data } = api.useQuery("get", "/api/storage/files", {
    params: {
      query: {
        page: 1,
        pageSize: 100,
        type: "FOLDER",
      },
    },
  }) as { data: { values: FileData[] } | undefined };

  const folders = data?.values || [];

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copy &quot;{file.name}&quot;</DialogTitle>
          <DialogDescription>
            Select the destination and optionally rename the copy
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="py-4">
          <Field>
            <FieldLabel>New Name</FieldLabel>
            <Input
              value={newName}
              onChange={(e) => onNewNameChange(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Destination Folder</FieldLabel>
            <Select
              value={targetParentId ?? "root"}
              onValueChange={(v) => onTargetChange(v === "root" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">
                  <div className="flex items-center gap-2">
                    <Folder className="size-4" />
                    Home (Root)
                  </div>
                </SelectItem>
                {folders
                  .filter((f) => f.id !== file.id)
                  .map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2">
                        <Folder className="size-4" />
                        {folder.name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!newName.trim() || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Copying...
              </>
            ) : (
              "Copy"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Share Dialog ====================

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileData | null;
  onShare: (isPublic: boolean) => void;
  isSubmitting: boolean;
}

export function ShareDialog({
  open,
  onOpenChange,
  file,
  onShare,
  isSubmitting,
}: ShareDialogProps) {
  const [isPublic, setIsPublic] = useState(file?.isPublic ?? false);

  // Update state when file changes
  if (file && file.isPublic !== isPublic && open) {
    setIsPublic(file.isPublic);
  }

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share &quot;{file.name}&quot;</DialogTitle>
          <DialogDescription>
            Configure sharing settings for this{" "}
            {file.type === "FOLDER" ? "folder" : "file"}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          {/* Public access toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <Globe className="size-5 text-green-500" />
              ) : (
                <Lock className="size-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Public Access</p>
                <p className="text-sm text-muted-foreground">
                  {isPublic
                    ? "Anyone with the link can view"
                    : "Only you and shared users can access"}
                </p>
              </div>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          {/* Share with specific users - placeholder for future */}
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-3 mb-3">
              <Users className="size-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Share with People</p>
                <p className="text-sm text-muted-foreground">
                  Share with specific users by email
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center py-4">
              Coming soon...
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onShare(isPublic)} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Upload Dialog ====================

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: UploadFile[];
  isUploading: boolean;
  onUpload: () => void;
  onRemoveFile: (id: string) => void;
  onClearCompleted: () => void;
}

export function UploadDialog({
  open,
  onOpenChange,
  files,
  isUploading,
  onUpload,
  onRemoveFile,
  onClearCompleted,
}: UploadDialogProps) {
  const pendingFiles = files.filter((f) => f.status === "pending");
  const completedFiles = files.filter((f) => f.status === "completed");
  const hasCompleted = completedFiles.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            {files.length} file{files.length !== 1 ? "s" : ""} selected
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-80">
          <div className="space-y-2 py-4">
            {files.map((file) => (
              <UploadFileItem
                key={file.id}
                file={file}
                onRemove={() => onRemoveFile(file.id)}
                isUploading={isUploading}
              />
            ))}
          </div>
        </ScrollArea>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {hasCompleted && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearCompleted}
              className="w-full sm:w-auto"
            >
              Clear Completed
            </Button>
          )}
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? "Cancel" : "Close"}
            </Button>
            <Button
              onClick={onUpload}
              disabled={isUploading || pendingFiles.length === 0}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 size-4" />
                  Upload ({pendingFiles.length})
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface UploadFileItemProps {
  file: UploadFile;
  onRemove: () => void;
  isUploading: boolean;
}

function UploadFileItem({ file, onRemove, isUploading }: UploadFileItemProps) {
  const statusIcon = {
    pending: <File className="size-4 text-muted-foreground" />,
    uploading: <Loader2 className="size-4 animate-spin text-blue-500" />,
    completed: <CheckCircle className="size-4 text-green-500" />,
    error: <AlertCircle className="size-4 text-destructive" />,
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      {statusIcon[file.status]}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{file.name}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </span>
          {file.status === "uploading" && (
            <Progress value={file.progress} className="h-1 flex-1" />
          )}
          {file.error && (
            <span className="text-xs text-destructive">{file.error}</span>
          )}
        </div>
      </div>
      {(file.status === "pending" || file.status === "error") &&
        !isUploading && (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={onRemove}
          >
            <X className="size-4" />
          </Button>
        )}
    </div>
  );
}

// ==================== File Details Dialog ====================

interface FileDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileData | null;
}

export function FileDetailsDialog({
  open,
  onOpenChange,
  file,
}: FileDetailsDialogProps) {
  // Fetch detailed file info
  const { data } = api.useQuery(
    "get",
    "/api/storage/files/{fileId}",
    {
      params: {
        path: { fileId: file?.id ?? "" },
      },
    },
    {
      enabled: open && !!file,
    },
  ) as {
    data: (FileData & { path?: string; versions?: FileVersion[] }) | undefined;
  };

  const fileDetails = data;
  const isFolder = file?.type === "FOLDER";
  const Icon = isFolder ? Folder : File;

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="size-5" />
            {file.name}
          </DialogTitle>
          <DialogDescription>File details and information</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Details</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Type</div>
              <div>{isFolder ? "Folder" : "File"}</div>
              {!isFolder && (
                <>
                  <div className="text-muted-foreground">Size</div>
                  <div>{formatFileSize(file.sizeBytes)}</div>
                </>
              )}
              <div className="text-muted-foreground">Created</div>
              <div>{formatDateTime(file.createdAt)}</div>
              <div className="text-muted-foreground">Modified</div>
              <div>{formatDateTime(file.updatedAt)}</div>
              <div className="text-muted-foreground">Visibility</div>
              <div className="flex items-center gap-1">
                {file.isPublic ? (
                  <>
                    <Globe className="size-3" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="size-3" />
                    Private
                  </>
                )}
              </div>
              {fileDetails?.path && (
                <>
                  <div className="text-muted-foreground">Path</div>
                  <div className="truncate">{fileDetails.path}</div>
                </>
              )}
            </div>
          </div>

          {/* Versions for files */}
          {!isFolder &&
            fileDetails?.versions &&
            fileDetails.versions.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Versions</h4>
                  <div className="max-h-40 overflow-auto space-y-2">
                    {fileDetails.versions.map((version) => (
                      <div
                        key={version.id}
                        className="flex items-center justify-between rounded-lg border p-2 text-sm"
                      >
                        <div>
                          <span className="font-medium">
                            Version {version.versionNumber}
                          </span>
                          <span className="ml-2 text-muted-foreground">
                            {formatFileSize(version.sizeBytes)}
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          {formatDateTime(version.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
