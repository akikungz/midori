"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, FolderPlus, Upload, List, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { api, fetchClinet } from "@midori/lib/api";
import {
  useSearch,
  usePagination,
  useSubmitState,
} from "@midori/hooks/useCommon";
import {
  useStorageNavigation,
  useFileUpload,
  useDragAndDrop,
  useFileDialogs,
} from "@midori/hooks/useStorage";

import { Button } from "@midori/components/ui/button";
import { Card, CardContent } from "@midori/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@midori/components/ui/dropdown-menu";
import {
  SearchInput,
  Pagination,
  LoadingState,
} from "@midori/components/shared";

import {
  BreadcrumbNav,
  SearchIndicator,
  EmptyFilesState,
} from "./FileNavigation";
import { FileGrid, FileList } from "./FileViews";
import {
  CreateFolderDialog,
  RenameDialog,
  DeleteDialog,
  MoveDialog,
  CopyDialog,
  ShareDialog,
  DetailsDialog,
  UploadDialog,
} from "./FileDialogs";

import type { FileData } from "@midori/types/admin";

const ITEMS_PER_PAGE = 20;

type ViewMode = "grid" | "list";

/**
 * Main storage client component
 * Handles file browsing, upload, and management
 */
export default function StorageClient() {
  const queryClient = useQueryClient();

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Custom hooks for different concerns
  const navigation = useStorageNavigation();
  const fileUpload = useFileUpload();
  const dialogs = useFileDialogs();
  const { searchQuery, isSearching, handleSearch, clearSearch } = useSearch();
  const pagination = usePagination(1, ITEMS_PER_PAGE);
  const submitState = useSubmitState();

  // Drag and drop handling
  const dragDrop = useDragAndDrop(fileUpload.addFilesFromDrop);

  // Data fetching
  const {
    data: filesData,
    isLoading: filesLoading,
    refetch: refetchFiles,
  } = api.useQuery("get", "/api/storage/files", {
    params: {
      query: {
        page: pagination.page,
        pageSize: ITEMS_PER_PAGE,
        parentId: navigation.currentParentId ?? undefined,
      },
    },
  });

  // Search files query
  const { data: searchData } = api.useQuery(
    "get",
    "/api/storage/files/search",
    {
      params: {
        query: {
          page: pagination.page,
          pageSize: ITEMS_PER_PAGE,
          query: searchQuery,
        },
      },
    },
    {
      enabled: isSearching && searchQuery.length > 0,
    },
  );

  // Get file details for dialogs
  const { data: fileDetailsData } = api.useQuery(
    "get",
    "/api/storage/files/{fileId}",
    {
      params: {
        path: { fileId: dialogs.selectedFile?.id || "" },
      },
    },
    {
      enabled:
        (dialogs.detailsDialogOpen || dialogs.shareDialogOpen) &&
        !!dialogs.selectedFile,
    },
  );

  // Cast file details to match expected type (API may return slightly different shape)
  const fileDetails = fileDetailsData as
    | import("@midori/types/admin").FileDetails
    | undefined;

  // Computed values
  const files = useMemo(() => {
    if (isSearching && searchQuery) {
      return searchData?.values ?? [];
    }
    return filesData?.values ?? [];
  }, [filesData, searchData, isSearching, searchQuery]);

  const totalPages = useMemo(() => {
    if (isSearching && searchQuery) {
      return searchData?.totalPages ?? 1;
    }
    return filesData?.totalPages ?? 1;
  }, [filesData, searchData, isSearching, searchQuery]);

  // Sort files: folders first, then by name
  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      if (a.type === "FOLDER" && b.type !== "FOLDER") return -1;
      if (a.type !== "FOLDER" && b.type === "FOLDER") return 1;
      return a.name.localeCompare(b.name);
    });
  }, [files]);

  const isLoading = filesLoading;

  // Refetch helper
  const refetchAll = useCallback(() => {
    refetchFiles();
    queryClient.invalidateQueries({ queryKey: ["get", "/api/storage/files"] });
  }, [refetchFiles, queryClient]);

  // File operations
  const handleCreateFolder = useCallback(async () => {
    if (!dialogs.newFolderName.trim()) return;

    submitState.startSubmit();
    try {
      await fetchClinet.POST("/api/storage/files", {
        body: {
          name: dialogs.newFolderName.trim(),
          type: "FOLDER",
          parentId: navigation.currentParentId,
          isPublic: false,
        },
      });

      toast.success("Folder created successfully");
      dialogs.setCreateFolderOpen(false);
      dialogs.setNewFolderName("");
      refetchAll();
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Failed to create folder");
    } finally {
      submitState.endSubmit();
    }
  }, [dialogs, navigation.currentParentId, refetchAll, submitState]);

  const handleRename = useCallback(async () => {
    if (!dialogs.selectedFile || !dialogs.renameName.trim()) return;

    submitState.startSubmit();
    try {
      await fetchClinet.PATCH("/api/storage/files/{fileId}", {
        params: { path: { fileId: dialogs.selectedFile.id } },
        body: { name: dialogs.renameName.trim() },
      });

      toast.success("Renamed successfully");
      dialogs.setRenameDialogOpen(false);
      dialogs.resetDialogState();
      refetchAll();
    } catch (error) {
      console.error("Error renaming:", error);
      toast.error("Failed to rename");
    } finally {
      submitState.endSubmit();
    }
  }, [dialogs, refetchAll, submitState]);

  const handleDelete = useCallback(async () => {
    if (!dialogs.selectedFile) return;

    submitState.startSubmit();
    try {
      await fetchClinet.DELETE("/api/storage/files/{fileId}", {
        params: { path: { fileId: dialogs.selectedFile.id } },
      });

      toast.success("Deleted successfully");
      dialogs.setDeleteDialogOpen(false);
      dialogs.resetDialogState();
      refetchAll();
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to delete");
    } finally {
      submitState.endSubmit();
    }
  }, [dialogs, refetchAll, submitState]);

  const handleMove = useCallback(async () => {
    if (!dialogs.selectedFile) return;

    submitState.startSubmit();
    try {
      await fetchClinet.POST("/api/storage/files/{fileId}/move", {
        params: { path: { fileId: dialogs.selectedFile.id } },
        body: { targetParentId: dialogs.targetParentId },
      });

      toast.success("Moved successfully");
      dialogs.setMoveDialogOpen(false);
      dialogs.resetDialogState();
      refetchAll();
    } catch (error) {
      console.error("Error moving:", error);
      toast.error("Failed to move");
    } finally {
      submitState.endSubmit();
    }
  }, [dialogs, refetchAll, submitState]);

  const handleCopy = useCallback(async () => {
    if (!dialogs.selectedFile) return;

    submitState.startSubmit();
    try {
      await fetchClinet.POST("/api/storage/files/{fileId}/copy", {
        params: { path: { fileId: dialogs.selectedFile.id } },
        body: {
          targetParentId: dialogs.targetParentId,
          ...(dialogs.copyNewName.trim() && {
            newName: dialogs.copyNewName.trim(),
          }),
        },
      });

      toast.success("Copied successfully");
      dialogs.setCopyDialogOpen(false);
      dialogs.resetDialogState();
      refetchAll();
    } catch (error) {
      console.error("Error copying:", error);
      toast.error("Failed to copy");
    } finally {
      submitState.endSubmit();
    }
  }, [dialogs, refetchAll, submitState]);

  const handleVisibilityChange = useCallback(
    async (file: FileData, isPublic: boolean) => {
      submitState.startSubmit();
      try {
        await fetchClinet.PATCH("/api/storage/files/{fileId}", {
          params: { path: { fileId: file.id } },
          body: { isPublic },
        });

        toast.success("Visibility updated");
        dialogs.setShareDialogOpen(false);
        refetchAll();
      } catch (error) {
        console.error("Error updating visibility:", error);
        toast.error("Failed to update visibility");
      } finally {
        submitState.endSubmit();
      }
    },
    [refetchAll, submitState, dialogs],
  );

  const handleUploadFiles = useCallback(async () => {
    const filesToUpload = fileUpload.uploadFiles.filter(
      (f) => f.status === "pending",
    );
    if (filesToUpload.length === 0) return;

    fileUpload.setIsUploading(true);

    for (const uploadFile of filesToUpload) {
      try {
        fileUpload.updateFileProgress(uploadFile.id, 0, "uploading");

        const formData = new FormData();
        formData.append("file", uploadFile.file);
        if (navigation.currentParentId) {
          formData.append("parentId", navigation.currentParentId);
        }

        // Simulate progress
        const progressInterval = setInterval(() => {
          fileUpload.updateFileProgress(
            uploadFile.id,
            Math.min(90, uploadFile.progress + 10),
          );
        }, 200);

        await fetch("/api/storage/files/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);
        fileUpload.setFileCompleted(uploadFile.id);
      } catch (error) {
        console.error("Error uploading file:", error);
        fileUpload.setFileError(
          uploadFile.id,
          error instanceof Error ? error.message : "Upload failed",
        );
      }
    }

    fileUpload.setIsUploading(false);
    refetchAll();
  }, [fileUpload, navigation.currentParentId, refetchAll]);

  // File action handlers for the FileGrid/FileList components
  const fileActionsProps = {
    onViewDetails: dialogs.openDetailsDialog,
    onRename: dialogs.openRenameDialog,
    onMove: dialogs.openMoveDialog,
    onCopy: (file: FileData) =>
      dialogs.openCopyDialog(file, navigation.currentParentId),
    onTogglePublic: (file: FileData) =>
      handleVisibilityChange(file, !file.isPublic),
    onShare: dialogs.openShareDialog,
    onDelete: dialogs.openDeleteDialog,
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Drag and drop container
    <div
      className="flex flex-col gap-4"
      onDragEnter={dragDrop.handleDragEnter}
      onDragLeave={dragDrop.handleDragLeave}
      onDragOver={dragDrop.handleDragOver}
      onDrop={dragDrop.handleDrop}
    >
      {/* Hidden file input for uploads */}
      <input
        ref={fileUpload.fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={fileUpload.handleFileSelect}
      />

      {/* Header with actions */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <BreadcrumbNav
            breadcrumbs={navigation.breadcrumbs}
            onNavigate={navigation.navigateToFolder}
          />
        </div>

        <div className="flex items-center gap-2">
          <SearchInput
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search files..."
          />

          {/* View mode toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? (
              <List className="h-4 w-4" />
            ) : (
              <LayoutGrid className="h-4 w-4" />
            )}
          </Button>

          {/* Create dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => dialogs.setCreateFolderOpen(true)}
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                New Folder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={fileUpload.triggerFileSelect}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Files
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Search indicator */}
      {isSearching && searchQuery && (
        <SearchIndicator searchQuery={searchQuery} onClear={clearSearch} />
      )}

      {/* Drag overlay */}
      {dragDrop.isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Card className="p-8">
            <CardContent className="flex flex-col items-center gap-4 p-0">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">Drop files here to upload</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main content */}
      {isLoading ? (
        <LoadingState variant={viewMode === "grid" ? "grid" : "list"} />
      ) : sortedFiles.length === 0 ? (
        <EmptyFilesState
          isSearching={isSearching}
          searchQuery={searchQuery}
          onCreateFolder={() => dialogs.setCreateFolderOpen(true)}
          onUpload={fileUpload.triggerFileSelect}
        />
      ) : viewMode === "grid" ? (
        <FileGrid
          files={sortedFiles}
          onNavigate={navigation.navigateToFile}
          onViewDetails={dialogs.openDetailsDialog}
          fileActionsProps={fileActionsProps}
        />
      ) : (
        <FileList
          files={sortedFiles}
          onNavigate={navigation.navigateToFile}
          onViewDetails={dialogs.openDetailsDialog}
          fileActionsProps={fileActionsProps}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={totalPages}
          onPageChange={pagination.setPage}
        />
      )}

      {/* Dialogs */}
      <CreateFolderDialog
        isOpen={dialogs.createFolderOpen}
        onOpenChange={dialogs.setCreateFolderOpen}
        folderName={dialogs.newFolderName}
        onFolderNameChange={dialogs.setNewFolderName}
        onSubmit={handleCreateFolder}
        isLoading={submitState.isSubmitting}
      />

      <RenameDialog
        isOpen={dialogs.renameDialogOpen}
        onOpenChange={dialogs.setRenameDialogOpen}
        file={dialogs.selectedFile}
        newName={dialogs.renameName}
        onNewNameChange={dialogs.setRenameName}
        onSubmit={handleRename}
        isLoading={submitState.isSubmitting}
      />

      <DeleteDialog
        isOpen={dialogs.deleteDialogOpen}
        onOpenChange={dialogs.setDeleteDialogOpen}
        file={dialogs.selectedFile}
        onConfirm={handleDelete}
        isLoading={submitState.isSubmitting}
      />

      <MoveDialog
        isOpen={dialogs.moveDialogOpen}
        onOpenChange={dialogs.setMoveDialogOpen}
        file={dialogs.selectedFile}
        targetParentId={dialogs.targetParentId}
        onTargetChange={dialogs.setTargetParentId}
        onSubmit={handleMove}
        isLoading={submitState.isSubmitting}
      />

      <CopyDialog
        isOpen={dialogs.copyDialogOpen}
        onOpenChange={dialogs.setCopyDialogOpen}
        file={dialogs.selectedFile}
        newName={dialogs.copyNewName}
        onNewNameChange={dialogs.setCopyNewName}
        targetParentId={dialogs.targetParentId}
        onTargetChange={dialogs.setTargetParentId}
        onSubmit={handleCopy}
        isLoading={submitState.isSubmitting}
      />

      <ShareDialog
        isOpen={dialogs.shareDialogOpen}
        onOpenChange={dialogs.setShareDialogOpen}
        file={dialogs.selectedFile}
        fileDetails={fileDetails}
        onTogglePublic={() =>
          dialogs.selectedFile &&
          handleVisibilityChange(
            dialogs.selectedFile,
            !dialogs.selectedFile.isPublic,
          )
        }
      />

      <DetailsDialog
        isOpen={dialogs.detailsDialogOpen}
        onOpenChange={dialogs.setDetailsDialogOpen}
        file={dialogs.selectedFile}
        fileDetails={fileDetails}
      />

      <UploadDialog
        isOpen={fileUpload.uploadDialogOpen}
        onOpenChange={fileUpload.closeUploadDialog}
        files={fileUpload.uploadFiles}
        isUploading={fileUpload.isUploading}
        onFileSelect={fileUpload.triggerFileSelect}
        onRemoveFile={fileUpload.removeUploadFile}
        onClearCompleted={fileUpload.clearCompletedUploads}
        onUploadAll={handleUploadFiles}
        onClose={fileUpload.closeUploadDialog}
      />
    </div>
  );
}
