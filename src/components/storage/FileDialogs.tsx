"use client";

import {
  FolderOpen,
  File,
  Globe,
  Lock,
  History,
  Home,
  Users,
  Upload,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import type {
  FileData,
  FileDetails,
  UploadFile as UploadFileType,
} from "@midori/types/admin";
import { formatFileSize, formatDateTime } from "@midori/lib/format";
import { cn } from "@midori/lib/utils";
import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import { Badge } from "@midori/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midori/components/ui/select";
import { Field, FieldGroup, FieldLabel } from "@midori/components/ui/field";
import { getVisibilityIcon, getVisibilityLabel } from "./FileViews";

// ============================================================================
// Create Folder Dialog
// ============================================================================

interface CreateFolderDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  folderName: string;
  onFolderNameChange: (name: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function CreateFolderDialog({
  isOpen,
  onOpenChange,
  folderName,
  onFolderNameChange,
  onSubmit,
  isLoading,
}: CreateFolderDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>Enter a name for the new folder</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="folder-name">Folder Name</FieldLabel>
            <Input
              id="folder-name"
              placeholder="My Folder"
              value={folderName}
              onChange={(e) => onFolderNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit();
              }}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Folder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Rename Dialog
// ============================================================================

interface RenameDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileData | null;
  newName: string;
  onNewNameChange: (name: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function RenameDialog({
  isOpen,
  onOpenChange,
  file,
  newName,
  onNewNameChange,
  onSubmit,
  isLoading,
}: RenameDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
          <DialogDescription>
            Enter a new name for &quot;{file?.name}&quot;
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="rename">New Name</FieldLabel>
            <Input
              id="rename"
              value={newName}
              onChange={(e) => onNewNameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSubmit();
              }}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Renaming..." : "Rename"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Delete Dialog
// ============================================================================

interface DeleteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileData | null;
  onConfirm: () => void;
  isLoading: boolean;
}

export function DeleteDialog({
  isOpen,
  onOpenChange,
  file,
  onConfirm,
  isLoading,
}: DeleteDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {file?.type === "FOLDER" ? "Folder" : "File"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{file?.name}&quot;?
            {file?.type === "FOLDER" &&
              " This will also delete all files and folders inside it."}
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ============================================================================
// Move Dialog
// ============================================================================

interface MoveDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileData | null;
  targetParentId: string | null;
  onTargetChange: (id: string | null) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function MoveDialog({
  isOpen,
  onOpenChange,
  file,
  targetParentId,
  onTargetChange,
  onSubmit,
  isLoading,
}: MoveDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Move {file?.type === "FOLDER" ? "Folder" : "File"}
          </DialogTitle>
          <DialogDescription>
            Select a destination folder for &quot;{file?.name}&quot;
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel>Destination</FieldLabel>
            <Select
              value={targetParentId ?? "root"}
              onValueChange={(v) => onTargetChange(v === "root" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">
                  <span className="flex items-center gap-2">
                    <Home className="size-4" />
                    Home (Root)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Moving..." : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Copy Dialog
// ============================================================================

interface CopyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileData | null;
  newName: string;
  onNewNameChange: (name: string) => void;
  targetParentId: string | null;
  onTargetChange: (id: string | null) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function CopyDialog({
  isOpen,
  onOpenChange,
  file,
  newName,
  onNewNameChange,
  targetParentId,
  onTargetChange,
  onSubmit,
  isLoading,
}: CopyDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Copy {file?.type === "FOLDER" ? "Folder" : "File"}
          </DialogTitle>
          <DialogDescription>
            Create a copy of &quot;{file?.name}&quot;
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="copy-name">New Name (optional)</FieldLabel>
            <Input
              id="copy-name"
              placeholder={`Copy of ${file?.name}`}
              value={newName}
              onChange={(e) => onNewNameChange(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel>Destination</FieldLabel>
            <Select
              value={targetParentId ?? "root"}
              onValueChange={(v) => onTargetChange(v === "root" ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">
                  <span className="flex items-center gap-2">
                    <Home className="size-4" />
                    Home (Root)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Copying..." : "Copy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Share Dialog
// ============================================================================

interface ShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileData | null;
  fileDetails: FileDetails | null | undefined;
  onTogglePublic: () => void;
}

export function ShareDialog({
  isOpen,
  onOpenChange,
  file,
  fileDetails,
  onTogglePublic,
}: ShareDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share &quot;{file?.name}&quot;</DialogTitle>
          <DialogDescription>
            Manage who has access to this{" "}
            {file?.type === "FOLDER" ? "folder" : "file"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              {file?.isPublic ? (
                <Globe className="size-5 text-primary" />
              ) : (
                <Lock className="size-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  {file?.isPublic ? "Public" : "Private"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {file?.isPublic
                    ? "Anyone with the link can view"
                    : "Only people with access can view"}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onTogglePublic}>
              {file?.isPublic ? "Make Private" : "Make Public"}
            </Button>
          </div>

          {fileDetails?.permissions && fileDetails.permissions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">People with access</p>
              <div className="space-y-2">
                {fileDetails.permissions.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="size-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {perm.user?.name || `User ${perm.platformUserId}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {perm.user?.email}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {getVisibilityIcon(perm.permission)}
                      <span className="ml-1">
                        {getVisibilityLabel(perm.permission)}
                      </span>
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Details Dialog
// ============================================================================

interface DetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileData | null;
  fileDetails: FileDetails | null | undefined;
}

export function DetailsDialog({
  isOpen,
  onOpenChange,
  file,
  fileDetails,
}: DetailsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {file?.type === "FOLDER" ? (
              <FolderOpen className="size-5 text-primary" />
            ) : (
              <File className="size-5 text-muted-foreground" />
            )}
            {file?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium">
                {file?.type === "FOLDER" ? "Folder" : "File"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Size</p>
              <p className="font-medium">
                {file?.type === "FOLDER"
                  ? "—"
                  : formatFileSize(file?.sizeBytes || 0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">
                {formatDateTime(fileDetails?.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Modified</p>
              <p className="font-medium">
                {formatDateTime(fileDetails?.updatedAt)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Access</p>
              <div className="flex items-center gap-1">
                {getVisibilityIcon(file?.visibility || "")}
                <span className="font-medium">
                  {getVisibilityLabel(file?.visibility || "")}
                </span>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground">Visibility</p>
              <div className="flex items-center gap-1">
                {file?.isPublic ? (
                  <>
                    <Globe className="size-3" />
                    <span className="font-medium">Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="size-3" />
                    <span className="font-medium">Private</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {fileDetails?.path && (
            <div className="text-sm">
              <p className="text-muted-foreground">Path</p>
              <p className="mt-1 break-all rounded bg-muted p-2 font-mono text-xs">
                {fileDetails.path}
              </p>
            </div>
          )}

          {fileDetails?.versions && fileDetails.versions.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm font-medium">
                <History className="size-4" />
                Version History
              </p>
              <div className="max-h-32 space-y-1 overflow-y-auto">
                {fileDetails.versions.map((version) => (
                  <div
                    key={version.id}
                    className="flex items-center justify-between rounded border p-2 text-sm"
                  >
                    <span>Version {version.versionNumber}</span>
                    <span className="text-muted-foreground">
                      {formatFileSize(version.sizeBytes)} •{" "}
                      {formatDateTime(version.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
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

// ============================================================================
// Upload Dialog
// ============================================================================

interface UploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  files: UploadFileType[];
  isUploading: boolean;
  onFileSelect: () => void;
  onRemoveFile: (id: string) => void;
  onClearCompleted: () => void;
  onUploadAll: () => void;
  onClose: () => void;
}

export function UploadDialog({
  isOpen,
  onOpenChange,
  files,
  isUploading,
  onFileSelect,
  onRemoveFile,
  onClearCompleted,
  onUploadAll,
  onClose,
}: UploadDialogProps) {
  const pendingCount = files.filter((f) => f.status === "pending").length;
  const hasCompleted = files.some((f) => f.status === "completed");

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !isUploading && onOpenChange(open)}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-5" />
            Upload Files
          </DialogTitle>
          <DialogDescription>
            {files.length === 0
              ? "Select files to upload to the current folder"
              : `${files.length} file${files.length > 1 ? "s" : ""} selected`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          {files.length === 0 && (
            // biome-ignore lint/a11y/useKeyWithClickEvents: click triggers file input
            // biome-ignore lint/a11y/noStaticElementInteractions: interactive drop zone
            <div
              className={cn(
                "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
                "hover:border-primary hover:bg-muted/50",
              )}
              onClick={onFileSelect}
            >
              <Upload className="mx-auto mb-4 size-10 text-muted-foreground" />
              <p className="text-sm font-medium">Click to select files</p>
              <p className="mt-1 text-xs text-muted-foreground">
                or drag and drop files here
              </p>
            </div>
          )}

          {/* File list */}
          {files.length > 0 && (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {files.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="shrink-0">
                    {uploadFile.status === "completed" ? (
                      <CheckCircle className="size-5 text-green-500" />
                    ) : uploadFile.status === "error" ? (
                      <AlertCircle className="size-5 text-destructive" />
                    ) : uploadFile.status === "uploading" ? (
                      <Loader2 className="size-5 animate-spin text-primary" />
                    ) : (
                      <File className="size-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {uploadFile.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(uploadFile.size)}
                      </p>
                      {uploadFile.status === "uploading" && (
                        <span className="text-xs text-primary">
                          {uploadFile.progress}%
                        </span>
                      )}
                      {uploadFile.status === "error" && (
                        <span className="text-xs text-destructive">
                          {uploadFile.error}
                        </span>
                      )}
                    </div>
                    {uploadFile.status === "uploading" && (
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {(uploadFile.status === "pending" ||
                    uploadFile.status === "error") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0"
                      onClick={() => onRemoveFile(uploadFile.id)}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add more files button */}
          {files.length > 0 && !isUploading && (
            <Button variant="outline" className="w-full" onClick={onFileSelect}>
              <Upload className="mr-2 size-4" />
              Add More Files
            </Button>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {hasCompleted && (
            <Button
              variant="ghost"
              onClick={onClearCompleted}
              disabled={isUploading}
            >
              Clear Completed
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Cancel"}
            </Button>
            <Button
              onClick={onUploadAll}
              disabled={isUploading || pendingCount === 0}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 size-4" />
                  Upload {pendingCount > 0 && `(${pendingCount})`}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
