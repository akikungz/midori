"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Download,
  Eye,
  File,
  Folder,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { api, fetchClient } from "@midori/lib/api";
import { FilePreview } from "./FilePreview";
import { formatDateTime, formatFileSize } from "@midori/lib/format";
import { useDebounce, usePagination } from "@midori/hooks/useCommon";
import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import { Skeleton } from "@midori/components/ui/skeleton";
import { Badge } from "@midori/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@midori/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midori/components/ui/select";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@midori/components/ui/empty";
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
import { Pagination } from "@midori/components/shared";

const ITEMS_PER_PAGE = 10;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

type StorageType = "FILE" | "FOLDER";
type StorageVisibility = "PRIVATE" | "SHARED" | "PUBLIC";

interface StorageFileItem {
  id: string;
  name: string;
  type: StorageType;
  mimeType?: string;
  extension?: string;
  description?: string;
  parentId?: string;
  ownerId: number;
  sizeBytes: number;
  visibility: StorageVisibility;
  createdAt: string | number | Record<string, never>;
  updatedAt: string | number | Record<string, never>;
}

interface StorageFileListResponse {
  values: StorageFileItem[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

interface PendingDeleteItem {
  id: string;
  name: string;
}

export function StorageClient() {
  const queryClient = useQueryClient();
  const pagination = usePagination(1, ITEMS_PER_PAGE);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | StorageType>("all");
  const [isUploading, setIsUploading] = useState(false);
  const [actionLoadingIds, setActionLoadingIds] = useState<Set<string>>(
    new Set(),
  );
  const [previewFileName, setPreviewFileName] = useState("");
  const [previewMimeType, setPreviewMimeType] = useState<string | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDeleteItem | null>(
    null,
  );

  const debouncedSearchTerm = useDebounce(searchTerm.trim(), 300);
  const isSearching = debouncedSearchTerm.length > 0;

  const listQueryParams = useMemo(
    () => ({
      page: pagination.page,
      pageSize: ITEMS_PER_PAGE,
      ...(typeFilter !== "all" ? { type: typeFilter } : {}),
    }),
    [pagination.page, typeFilter],
  );

  const searchQueryParams = useMemo(
    () => ({
      page: pagination.page,
      pageSize: ITEMS_PER_PAGE,
      ...(typeFilter !== "all" ? { type: typeFilter } : {}),
      query: debouncedSearchTerm,
    }),
    [debouncedSearchTerm, pagination.page, typeFilter],
  );

  const listQuery = api.useQuery(
    "get",
    "/api/storage/files/",
    {
      params: {
        query: listQueryParams,
      },
    },
    {
      enabled: !isSearching,
    },
  ) as {
    data: StorageFileListResponse | undefined;
    isLoading: boolean;
    isFetching: boolean;
    refetch: () => void;
  };

  const searchQuery = api.useQuery(
    "get",
    "/api/storage/files/search",
    {
      params: {
        query: {
          ...searchQueryParams,
        },
      },
    },
    {
      enabled: isSearching,
    },
  ) as {
    data: StorageFileListResponse | undefined;
    isLoading: boolean;
    isFetching: boolean;
    refetch: () => void;
  };

  const { data, isLoading, isFetching, refetch } = isSearching
    ? searchQuery
    : listQuery;

  const files = data?.values || [];
  const totalPages = data?.totalPages || 1;
  const totalItems = data?.totalItems || 0;

  const withActionLoading = useCallback((fileId: string, active: boolean) => {
    setActionLoadingIds((previous) => {
      const next = new Set(previous);
      if (active) {
        next.add(fileId);
      } else {
        next.delete(fileId);
      }
      return next;
    });
  }, []);

  const invalidateStorageQueries = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: ["get", "/api/storage/files/"],
    });
    queryClient.invalidateQueries({
      queryKey: ["get", "/api/storage/files/search"],
    });
  }, [queryClient]);

  const handleUploadClick = useCallback(() => {
    uploadInputRef.current?.click();
  }, []);

  const handleUploadFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];

      if (!selectedFile) {
        return;
      }

      if (selectedFile.size > MAX_FILE_SIZE) {
        toast.error(
          `File is too large. Maximum size is 100 MB, but got ${formatFileSize(selectedFile.size)}.`,
        );
        if (uploadInputRef.current) {
          uploadInputRef.current.value = "";
        }
        return;
      }

      setIsUploading(true);

      try {
        const contentType = selectedFile.type || "application/octet-stream";

        // Step 1: Get presigned upload URL from API
        const { data: uploadData, error: uploadUrlError } =
          await fetchClient.POST("/api/storage/files/upload-url", {
            body: {
              filename: selectedFile.name,
              contentType,
            },
          });

        if (uploadUrlError || !uploadData?.uploadUrl || !uploadData.objectKey) {
          throw new Error("Unable to create upload URL");
        }

        // Step 2: Upload file directly to S3 using presigned URL
        const uploadResponse = await fetch(uploadData.uploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": contentType,
          },
          body: selectedFile,
        });

        if (!uploadResponse.ok) {
          let message = `Upload failed with status ${uploadResponse.status}`;

          if (uploadResponse.status === 413) {
            message =
              "File is too large for the storage backend. Please try a smaller file.";
          } else if (uploadResponse.status === 400) {
            message =
              "Invalid file format or upload request rejected by storage backend.";
          }

          throw new Error(message);
        }

        // Step 3: Create file metadata in the API
        const extension = selectedFile.name.includes(".")
          ? selectedFile.name.split(".").pop()?.toLowerCase()
          : undefined;

        const { data: createdFile, error: createFileError } =
          await fetchClient.POST("/api/storage/files/", {
            body: {
              name: selectedFile.name,
              type: "FILE",
              mimeType: contentType,
              sizeBytes: selectedFile.size,
              storagePath: uploadData.objectKey,
              visibility: "PRIVATE",
              ...(extension ? { extension } : {}),
            },
          });

        if (createFileError || !createdFile) {
          throw new Error("Upload completed but metadata creation failed");
        }

        toast.success(`Uploaded ${selectedFile.name}`);
        invalidateStorageQueries();
      } catch (error) {
        console.error("Failed to upload file:", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to upload file",
        );
      } finally {
        if (uploadInputRef.current) {
          uploadInputRef.current.value = "";
        }
        setIsUploading(false);
      }
    },
    [invalidateStorageQueries],
  );

  const handleDelete = useCallback(
    async (fileId: string) => {
      withActionLoading(fileId, true);
      try {
        const { error } = await fetchClient.DELETE("/api/storage/files/{fileId}", {
          params: {
            path: { fileId },
          },
        });

        if (error) {
          toast.error("Failed to delete file");
          return;
        }

        toast.success("File deleted successfully");
        invalidateStorageQueries();
      } catch (error) {
        console.error("Failed to delete storage item:", error);
        toast.error("Failed to delete file");
      } finally {
        withActionLoading(fileId, false);
      }
    },
    [invalidateStorageQueries, withActionLoading],
  );

  const handleDeleteClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>, file: StorageFileItem) => {
      if (event.shiftKey) {
        void handleDelete(file.id);
        return;
      }

      setPendingDelete({ id: file.id, name: file.name });
      setIsDeleteConfirmOpen(true);
    },
    [handleDelete],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!pendingDelete) {
      return;
    }

    void handleDelete(pendingDelete.id);
    setIsDeleteConfirmOpen(false);
    setPendingDelete(null);
  }, [handleDelete, pendingDelete]);

  const handleDownload = useCallback(
    async (fileId: string) => {
      withActionLoading(fileId, true);
      try {
        const { data } = await fetchClient.GET(
          "/api/storage/files/{fileId}/download-url",
          {
            params: {
              path: { fileId },
            },
          },
        );

        if (data?.downloadUrl) {
          window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
        }
      } catch (error) {
        console.error("Failed to generate download URL:", error);
      } finally {
        withActionLoading(fileId, false);
      }
    },
    [withActionLoading],
  );

  const handlePreview = useCallback(async (file: StorageFileItem) => {
    setPreviewFileName(file.name);
    setPreviewMimeType(file.mimeType);
    setIsPreviewOpen(true);

    try {
      const { data } = await fetchClient.GET(
        "/api/storage/files/{fileId}/download-url",
        {
          params: {
            path: { fileId: file.id },
          },
        },
      );

      setPreviewUrl(data?.downloadUrl);
    } catch (error) {
      console.error("Failed to generate preview URL:", error);
      toast.error("Failed to load file preview");
    }
  }, []);

  const isPreviewable = (file: StorageFileItem): boolean => {
    if (!file.mimeType) return false;
    return (
      file.mimeType.startsWith("image/") ||
      file.mimeType.startsWith("video/") ||
      file.mimeType.startsWith("audio/") ||
      file.mimeType === "application/pdf" ||
      file.mimeType.includes("pdf")
    );
  };

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchTerm(value);
      pagination.setPage(1);
    },
    [pagination],
  );

  const handleTypeFilterChange = useCallback(
    (value: "all" | StorageType) => {
      setTypeFilter(value);
      pagination.setPage(1);
    },
    [pagination],
  );

  return (
    <div className="space-y-4">
      <StorageToolbar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        typeFilter={typeFilter}
        onTypeFilterChange={handleTypeFilterChange}
        onRefresh={refetch}
        isRefreshing={isFetching}
        onUploadClick={handleUploadClick}
        isUploading={isUploading}
        isDisabled={false}
      />

      <Input
        ref={uploadInputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          void handleUploadFileChange(event);
        }}
      />

      <FilePreview
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        fileName={previewFileName}
        mimeType={previewMimeType}
        downloadUrl={previewUrl}
      />

      <AlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={(open) => {
          setIsDeleteConfirmOpen(open);
          if (!open) {
            setPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `Are you sure you want to delete "${pendingDelete.name}"? This action cannot be undone.`
                : "Are you sure you want to delete this file? This action cannot be undone."}
            </AlertDialogDescription>
            <p className="text-xs text-muted-foreground">
              Tip: Hold Shift and click Delete to skip this confirmation.
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoading ? (
        <StorageLoadingState />
      ) : files.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <Folder className="size-5" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No files found</EmptyTitle>
            <EmptyDescription>
              {isSearching
                ? `No results for "${debouncedSearchTerm}". Try another keyword.`
                : "Create your first file or folder to start using storage."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Showing {files.length} of {totalItems} item
            {totalItems === 1 ? "" : "s"}
          </p>

          <div className="grid gap-3">
            {files.map((file) => {
              const isActionLoading = actionLoadingIds.has(file.id);
              const isFile = file.type === "FILE";

              return (
                <Card key={file.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-start gap-2 text-base sm:items-center">
                      {isFile ? (
                        <File className="size-4 text-muted-foreground" />
                      ) : (
                        <Folder className="size-4 text-muted-foreground" />
                      )}
                      <span className="break-all sm:truncate">{file.name}</span>
                    </CardTitle>
                    <CardDescription className="flex flex-wrap gap-2">
                      <Badge variant="outline">{file.type}</Badge>
                      <Badge variant="secondary">{file.visibility}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 space-y-1 text-sm text-muted-foreground">
                      <p>
                        Size: {isFile ? formatFileSize(file.sizeBytes) : "—"}
                      </p>
                      <p>Updated: {formatDateTime(file.updatedAt)}</p>
                      {file.description ? (
                        <p className="wrap-break-word">{file.description}</p>
                      ) : null}
                    </div>

                    <div className="grid w-full grid-cols-2 gap-2 self-start sm:flex sm:w-auto sm:flex-wrap sm:justify-end sm:self-auto">
                      {isFile && isPreviewable(file) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-center sm:w-auto"
                          onClick={() => handlePreview(file)}
                          disabled={isActionLoading}
                        >
                          <Eye className="mr-1.5 size-4" />
                          Preview
                        </Button>
                      ) : null}
                      {isFile ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-center sm:w-auto"
                          onClick={() => handleDownload(file.id)}
                          disabled={isActionLoading}
                        >
                          <Download className="mr-1.5 size-4" />
                          Download
                        </Button>
                      ) : null}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full justify-center sm:w-auto"
                        onClick={(event) => handleDeleteClick(event, file)}
                        disabled={isActionLoading}
                      >
                        <Trash2 className="mr-1.5 size-4" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 ? (
            <Pagination
              page={pagination.page}
              totalPages={totalPages}
              onPageChange={pagination.setPage}
              totalItems={totalItems}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

interface StorageToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  typeFilter: "all" | StorageType;
  onTypeFilterChange: (value: "all" | StorageType) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onUploadClick: () => void;
  isUploading: boolean;
  isDisabled: boolean;
}

function StorageToolbar({
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  onRefresh,
  isRefreshing,
  onUploadClick,
  isUploading,
  isDisabled,
}: StorageToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search files and folders..."
          className="pl-9"
          disabled={isDisabled}
        />
      </div>

      <Select
        value={typeFilter}
        onValueChange={(value) =>
          onTypeFilterChange(value as "all" | StorageType)
        }
        disabled={isDisabled}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All types</SelectItem>
          <SelectItem value="FILE">Files</SelectItem>
          <SelectItem value="FOLDER">Folders</SelectItem>
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={isRefreshing || isDisabled}
      >
        <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
        <span className="sr-only">Refresh</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={onUploadClick}
        disabled={isUploading || isDisabled}
      >
        <Upload className="mr-1.5 size-4" />
        {isUploading ? "Uploading..." : "Upload"}
      </Button>
    </div>
  );
}

function StorageLoadingState() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4].map((index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
    </div>
  );
}

// ==================== File Preview Component ====================

export default StorageClient;
