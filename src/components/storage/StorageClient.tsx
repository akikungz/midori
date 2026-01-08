"use client";

import { useCallback } from "react";
import { Upload, FolderPlus, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api, fetchClinet } from "@midori/lib/api";
import type { Role } from "@midori/lib/roles";
import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import { Skeleton } from "@midori/components/ui/skeleton";
import { Pagination } from "@midori/components/shared";
import { usePagination, useSubmitState } from "@midori/hooks/useCommon";
import {
  useStorageNavigation,
  useFileUpload,
  useDragAndDrop,
  useFileDialogs,
} from "@midori/hooks/useStorage";
import type { FileData } from "@midori/types/admin";

import { FilesGrid, EmptyStorage, StorageBreadcrumb } from "./FileCard";
import {
  CreateFolderDialog,
  RenameDialog,
  DeleteDialog,
  MoveDialog,
  CopyDialog,
  ShareDialog,
  UploadDialog,
  FileDetailsDialog,
} from "./StorageDialogs";

const ITEMS_PER_PAGE = 20;

interface StorageClientProps {
  userRole: Role;
}

interface FilesResponse {
  values: FileData[];
  totalPages: number;
  totalItems: number;
}

/**
 * Main storage client component
 */
export function StorageClient({ userRole: _userRole }: StorageClientProps) {
  const queryClient = useQueryClient();
  const pagination = usePagination(1, ITEMS_PER_PAGE);
  const submitState = useSubmitState();

  // Navigation state
  const navigation = useStorageNavigation();

  // File upload state
  const upload = useFileUpload();

  // Dialog states
  const dialogs = useFileDialogs();

  // Drag and drop
  const dragDrop = useDragAndDrop(upload.addFilesFromDrop);

  // Data fetching
  const { data, isLoading } = api.useQuery("get", "/api/storage/files", {
    params: {
      query: {
        page: pagination.page,
        pageSize: ITEMS_PER_PAGE,
        parentId: navigation.currentParentId,
      },
    },
  }) as {
    data: FilesResponse | undefined;
    isLoading: boolean;
    refetch: () => void;
  };

  const files = data?.values || [];
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || 0;

  // Invalidate queries helper
  const invalidateFiles = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["get", "/api/storage/files"],
    });
  }, [queryClient]);

  // Create folder handler
  const handleCreateFolder = useCallback(
    async (name: string) => {
      submitState.startSubmit();
      try {
        await fetchClinet.POST("/api/storage/files", {
          body: {
            name,
            type: "FOLDER",
            parentId: navigation.currentParentId,
            isPublic: false,
            file: "",
          },
        });
        invalidateFiles();
        dialogs.setCreateFolderOpen(false);
        dialogs.setNewFolderName("");
        toast.success("Folder created successfully");
      } catch (error) {
        console.error("Failed to create folder:", error);
        toast.error("Failed to create folder");
      } finally {
        submitState.endSubmit();
      }
    },
    [navigation.currentParentId, submitState, dialogs, invalidateFiles],
  );

  // Rename handler
  const handleRename = useCallback(
    async (fileId: string, newName: string) => {
      submitState.startSubmit();
      try {
        await fetchClinet.PATCH("/api/storage/files/{fileId}", {
          params: { path: { fileId } },
          body: { name: newName },
        });
        invalidateFiles();
        dialogs.setRenameDialogOpen(false);
        dialogs.resetDialogState();
        toast.success("Renamed successfully");
      } catch (error) {
        console.error("Failed to rename:", error);
        toast.error("Failed to rename");
      } finally {
        submitState.endSubmit();
      }
    },
    [submitState, dialogs, invalidateFiles],
  );

  // Delete handler
  const handleDelete = useCallback(
    async (fileId: string) => {
      submitState.startSubmit();
      try {
        await fetchClinet.DELETE("/api/storage/files/{fileId}", {
          params: { path: { fileId } },
        });
        invalidateFiles();
        dialogs.setDeleteDialogOpen(false);
        dialogs.resetDialogState();
        toast.success("Deleted successfully");
      } catch (error) {
        console.error("Failed to delete:", error);
        toast.error("Failed to delete");
      } finally {
        submitState.endSubmit();
      }
    },
    [submitState, dialogs, invalidateFiles],
  );

  // Move handler
  const handleMove = useCallback(
    async (fileId: string, targetParentId: string | null) => {
      submitState.startSubmit();
      try {
        await fetchClinet.POST("/api/storage/files/{fileId}/move", {
          params: { path: { fileId } },
          body: { targetParentId },
        });
        invalidateFiles();
        dialogs.setMoveDialogOpen(false);
        dialogs.resetDialogState();
        toast.success("Moved successfully");
      } catch (error) {
        console.error("Failed to move:", error);
        toast.error("Failed to move");
      } finally {
        submitState.endSubmit();
      }
    },
    [submitState, dialogs, invalidateFiles],
  );

  // Copy handler
  const handleCopy = useCallback(
    async (fileId: string, targetParentId: string | null, newName?: string) => {
      submitState.startSubmit();
      try {
        await fetchClinet.POST("/api/storage/files/{fileId}/copy", {
          params: { path: { fileId } },
          body: { targetParentId, newName },
        });
        invalidateFiles();
        dialogs.setCopyDialogOpen(false);
        dialogs.resetDialogState();
        toast.success("Copied successfully");
      } catch (error) {
        console.error("Failed to copy:", error);
        toast.error("Failed to copy");
      } finally {
        submitState.endSubmit();
      }
    },
    [submitState, dialogs, invalidateFiles],
  );

  // Share handler
  const handleShare = useCallback(
    async (fileId: string, isPublic: boolean) => {
      submitState.startSubmit();
      try {
        await fetchClinet.POST("/api/storage/files/{fileId}/share", {
          params: { path: { fileId } },
          body: { isPublic },
        });
        invalidateFiles();
        dialogs.setShareDialogOpen(false);
        dialogs.resetDialogState();
        toast.success(isPublic ? "File shared publicly" : "Sharing updated");
      } catch (error) {
        console.error("Failed to share:", error);
        toast.error("Failed to share");
      } finally {
        submitState.endSubmit();
      }
    },
    [submitState, dialogs, invalidateFiles],
  );

  // Download file handler
  const handleDownload = useCallback(async (file: FileData) => {
    if (file.type === "FOLDER") return;

    try {
      toast.info(`Preparing download for ${file.name}...`);

      // Get file details to find the latest version
      const detailsResponse = await fetchClinet.GET(
        "/api/storage/files/{fileId}",
        {
          params: { path: { fileId: file.id } },
        },
      );

      if (detailsResponse.error) {
        throw new Error(
          detailsResponse.error.message || "Failed to get file details",
        );
      }

      const versions = detailsResponse.data?.versions || [];
      if (versions.length === 0) {
        throw new Error("No file versions available");
      }

      // Get latest version (highest version number)
      const latestVersion = versions.reduce((prev, curr) =>
        curr.versionNumber > prev.versionNumber ? curr : prev,
      );

      // Get presigned download URL
      const presignResponse = await fetchClinet.GET(
        "/api/storage/files/{fileId}/versions/{versionId}/presign_download",
        {
          params: {
            path: { fileId: file.id, versionId: latestVersion.id },
            query: { expiresIn: 3600 },
          },
        },
      );

      if (presignResponse.error) {
        throw new Error(
          presignResponse.error.message || "Failed to get download URL",
        );
      }

      const downloadUrl = presignResponse.data?.url;
      if (!downloadUrl) {
        throw new Error("Failed to get download URL");
      }

      // Blob download approach
      const downloadResponse = await fetch(downloadUrl);

      // Download percentage could be tracked here with response.body and a ReadableStream

      if (!downloadResponse.ok) {
        throw new Error(`Download failed: ${downloadResponse.status}`);
      }

      const blob = await downloadResponse.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const blobLink = document.createElement("a");
      blobLink.href = blobUrl;
      blobLink.download = file.name;
      document.body.appendChild(blobLink);
      blobLink.click();
      document.body.removeChild(blobLink);
      window.URL.revokeObjectURL(blobUrl);

      toast.success(`Download started for ${file.name}`);
    } catch (error) {
      console.error("Download error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Download failed";
      toast.error(`Failed to download: ${errorMessage}`);
    }
  }, []);

  // Upload files handler
  const handleUploadFiles = useCallback(async () => {
    upload.setIsUploading(true);

    for (const uploadFile of upload.uploadFiles) {
      if (uploadFile.status !== "pending") continue;

      try {
        upload.updateFileProgress(uploadFile.id, 10, "uploading");

        // Create file with FormData (required for binary file upload)
        const formData = new FormData();
        formData.append("name", uploadFile.name);
        formData.append("type", "FILE");
        formData.append("file", uploadFile.file);
        formData.append("isPublic", "false");
        if (navigation.currentParentId) {
          formData.append("parentId", navigation.currentParentId);
        }

        upload.updateFileProgress(uploadFile.id, 50, "uploading");

        const response = await fetch("/api/storage/files", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `Upload failed: ${response.status}`,
          );
        }

        upload.updateFileProgress(uploadFile.id, 100, "completed");
        upload.setFileCompleted(uploadFile.id);
      } catch (error) {
        console.error("Upload error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        upload.setFileError(uploadFile.id, errorMessage);
        toast.error(`Failed to upload ${uploadFile.name}: ${errorMessage}`);
      }
    }

    upload.setIsUploading(false);
    invalidateFiles();
  }, [upload, navigation.currentParentId, invalidateFiles]);

  // Handle file/folder click
  const handleFileClick = useCallback(
    (file: FileData) => {
      if (file.type === "FOLDER") {
        navigation.navigateToFile(file);
        pagination.setPage(1);
      } else {
        dialogs.openDetailsDialog(file);
      }
    },
    [navigation, pagination, dialogs],
  );

  if (isLoading) {
    return <StorageLoadingState />;
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Drop zone needs drag events
    <div
      className="space-y-4"
      onDragEnter={dragDrop.handleDragEnter}
      onDragLeave={dragDrop.handleDragLeave}
      onDragOver={dragDrop.handleDragOver}
      onDrop={dragDrop.handleDrop}
    >
      {/* Drop zone overlay */}
      {dragDrop.isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-primary p-12">
            <Upload className="size-16 text-primary" />
            <p className="text-lg font-medium">Drop files here to upload</p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={upload.fileInputRef}
        type="file"
        className="hidden"
        multiple
        onChange={upload.handleFileSelect}
      />

      {/* Toolbar */}
      <StorageToolbar
        onUpload={upload.triggerFileSelect}
        onCreateFolder={() => dialogs.setCreateFolderOpen(true)}
      />

      {/* Breadcrumb */}
      <StorageBreadcrumb
        breadcrumbs={navigation.breadcrumbs}
        onNavigate={navigation.navigateToFolder}
      />

      {/* Files display */}
      {files.length === 0 ? (
        <EmptyStorage
          onUpload={upload.triggerFileSelect}
          onCreateFolder={() => dialogs.setCreateFolderOpen(true)}
        />
      ) : (
        <FilesGrid
          files={files}
          onFileClick={handleFileClick}
          onDownload={handleDownload}
          onRename={dialogs.openRenameDialog}
          onDelete={dialogs.openDeleteDialog}
          onMove={dialogs.openMoveDialog}
          onCopy={(file: FileData) =>
            dialogs.openCopyDialog(file, navigation.currentParentId)
          }
          onShare={dialogs.openShareDialog}
          onDetails={dialogs.openDetailsDialog}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={totalPages}
          onPageChange={pagination.setPage}
          totalItems={totalItems}
        />
      )}

      {/* Dialogs */}
      <CreateFolderDialog
        open={dialogs.createFolderOpen}
        onOpenChange={dialogs.setCreateFolderOpen}
        folderName={dialogs.newFolderName}
        onFolderNameChange={dialogs.setNewFolderName}
        onSubmit={() => handleCreateFolder(dialogs.newFolderName)}
        isSubmitting={submitState.isSubmitting}
      />

      <RenameDialog
        open={dialogs.renameDialogOpen}
        onOpenChange={dialogs.setRenameDialogOpen}
        name={dialogs.renameName}
        onNameChange={dialogs.setRenameName}
        onSubmit={() =>
          dialogs.selectedFile &&
          handleRename(dialogs.selectedFile.id, dialogs.renameName)
        }
        isSubmitting={submitState.isSubmitting}
      />

      <DeleteDialog
        open={dialogs.deleteDialogOpen}
        onOpenChange={dialogs.setDeleteDialogOpen}
        file={dialogs.selectedFile}
        onConfirm={() =>
          dialogs.selectedFile && handleDelete(dialogs.selectedFile.id)
        }
        isSubmitting={submitState.isSubmitting}
      />

      <MoveDialog
        open={dialogs.moveDialogOpen}
        onOpenChange={dialogs.setMoveDialogOpen}
        file={dialogs.selectedFile}
        targetParentId={dialogs.targetParentId}
        onTargetChange={dialogs.setTargetParentId}
        onSubmit={() =>
          dialogs.selectedFile &&
          handleMove(dialogs.selectedFile.id, dialogs.targetParentId)
        }
        isSubmitting={submitState.isSubmitting}
        currentParentId={navigation.currentParentId}
      />

      <CopyDialog
        open={dialogs.copyDialogOpen}
        onOpenChange={dialogs.setCopyDialogOpen}
        file={dialogs.selectedFile}
        targetParentId={dialogs.targetParentId}
        onTargetChange={dialogs.setTargetParentId}
        newName={dialogs.copyNewName}
        onNewNameChange={dialogs.setCopyNewName}
        onSubmit={() =>
          dialogs.selectedFile &&
          handleCopy(
            dialogs.selectedFile.id,
            dialogs.targetParentId,
            dialogs.copyNewName,
          )
        }
        isSubmitting={submitState.isSubmitting}
      />

      <ShareDialog
        open={dialogs.shareDialogOpen}
        onOpenChange={dialogs.setShareDialogOpen}
        file={dialogs.selectedFile}
        onShare={(isPublic: boolean) =>
          dialogs.selectedFile && handleShare(dialogs.selectedFile.id, isPublic)
        }
        isSubmitting={submitState.isSubmitting}
      />

      <UploadDialog
        open={upload.uploadDialogOpen}
        onOpenChange={upload.closeUploadDialog}
        files={upload.uploadFiles}
        isUploading={upload.isUploading}
        onUpload={handleUploadFiles}
        onRemoveFile={upload.removeUploadFile}
        onClearCompleted={upload.clearCompletedUploads}
      />

      <FileDetailsDialog
        open={dialogs.detailsDialogOpen}
        onOpenChange={dialogs.setDetailsDialogOpen}
        file={dialogs.selectedFile}
      />
    </div>
  );
}

// ==================== Toolbar ====================

interface StorageToolbarProps {
  onUpload: () => void;
  onCreateFolder: () => void;
}

function StorageToolbar({ onUpload, onCreateFolder }: StorageToolbarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2">
        <Button onClick={onUpload}>
          <Upload className="mr-2 size-4" />
          Upload
        </Button>
        <Button variant="outline" onClick={onCreateFolder}>
          <FolderPlus className="mr-2 size-4" />
          New Folder
        </Button>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search files..." className="pl-9" />
      </div>
    </div>
  );
}

// ==================== Loading State ====================

function StorageLoadingState() {
  return (
    <div className="space-y-4">
      {/* Toolbar skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-10 w-64" />
      </div>

      {/* Breadcrumb skeleton */}
      <Skeleton className="h-6 w-48" />

      {/* Grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={`skeleton-${i.toString()}`}
            className="h-32 w-full rounded-lg"
          />
        ))}
      </div>
    </div>
  );
}
