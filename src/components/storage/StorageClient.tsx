"use client";

import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FolderOpen,
  Upload,
  Download,
  Trash2,
  File,
  MoreVertical,
  Search,
  Grid,
  List,
  Copy,
  Move,
  Edit,
  Share2,
  Globe,
  Lock,
  ChevronRight,
  Home,
  FolderPlus,
  Eye,
  Pencil,
  Crown,
  Users,
  ChevronLeft,
  ChevronRightIcon,
  History,
  X,
  FileUp,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { api, fetchClinet } from "@midori/lib/api";
import { Button } from "@midori/components/ui/button";
import { Input } from "@midori/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@midori/components/ui/card";
import { Skeleton } from "@midori/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@midori/components/ui/empty";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midori/components/ui/dropdown-menu";
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
import { Badge } from "@midori/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midori/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@midori/components/ui/tabs";
import { Field, FieldGroup, FieldLabel } from "@midori/components/ui/field";
import { cn } from "@midori/lib/utils";

type FileData = {
  id: string;
  name: string;
  type: "FILE" | "FOLDER";
  sizeBytes: number;
  visibility: "VIEWER" | "EDITOR" | "OWNER";
  parentId?: string | null;
  isPublic: boolean;
  createdAt?: Record<string, never> | string | number;
  updatedAt?: Record<string, never> | string | number;
};

type BreadcrumbItem = {
  id: string | null;
  name: string;
};

type UploadFile = {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
};

export function StorageClient() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: "Home" },
  ]);

  // Dialog states
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Upload states
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const [isUploading, setIsUploading] = useState(false);

  // Form states
  const [newFolderName, setNewFolderName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [targetParentId, setTargetParentId] = useState<string | null>(null);
  const [copyNewName, setCopyNewName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch files
  const { data, isLoading: filesLoading } = api.useQuery(
    "get",
    "/api/storage/files",
    {
      params: {
        query: {
          page,
          pageSize,
          parentId: currentParentId,
        },
      },
    },
  );

  // Search files
  const { data: searchData } = api.useQuery(
    "get",
    "/api/storage/files/search",
    {
      params: {
        query: {
          page,
          pageSize,
          query: searchQuery,
        },
      },
    },
    {
      enabled: isSearching && searchQuery.length > 0,
    },
  );

  // Get file details
  const { data: fileDetails } = api.useQuery(
    "get",
    "/api/storage/files/{fileId}",
    {
      params: {
        path: { fileId: selectedFile?.id || "" },
      },
    },
    {
      enabled: detailsDialogOpen && !!selectedFile,
    },
  );

  const files = isSearching && searchQuery ? searchData?.values : data?.values;
  const totalPages =
    isSearching && searchQuery ? searchData?.totalPages : data?.totalPages;
  const totalItems =
    isSearching && searchQuery ? searchData?.totalItems : data?.totalItems;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (
    date: Record<string, never> | string | number | undefined,
  ) => {
    if (!date) return "N/A";
    return new Date(date as string | number).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "OWNER":
        return <Crown className="size-3" />;
      case "EDITOR":
        return <Pencil className="size-3" />;
      case "VIEWER":
        return <Eye className="size-3" />;
      default:
        return null;
    }
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case "OWNER":
        return "Owner";
      case "EDITOR":
        return "Can Edit";
      case "VIEWER":
        return "Can View";
      default:
        return visibility;
    }
  };

  const navigateToFolder = useCallback(
    async (folderId: string | null, folderName: string) => {
      if (folderId === null) {
        setBreadcrumbs([{ id: null, name: "Home" }]);
      } else {
        const existingIndex = breadcrumbs.findIndex((b) => b.id === folderId);
        if (existingIndex !== -1) {
          setBreadcrumbs(breadcrumbs.slice(0, existingIndex + 1));
        } else {
          setBreadcrumbs([...breadcrumbs, { id: folderId, name: folderName }]);
        }
      }
      setCurrentParentId(folderId);
      setPage(1);
      setIsSearching(false);
      setSearchQuery("");
    },
    [breadcrumbs],
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);
    setPage(1);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setIsSearching(false);
    setPage(1);
  }, []);

  // Generate unique ID for upload files
  const generateUploadId = () =>
    `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Handle file selection from input
  // biome-ignore lint/correctness/useExhaustiveDependencies: generateUploadId is stable
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const newUploadFiles: UploadFile[] = Array.from(files).map((file) => ({
        id: generateUploadId(),
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: "pending" as const,
      }));

      setUploadFiles((prev) => [...prev, ...newUploadFiles]);
      setUploadDialogOpen(true);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [],
  );

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: generateUploadId is stable
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const newUploadFiles: UploadFile[] = Array.from(files).map((file) => ({
      id: generateUploadId(),
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: "pending" as const,
    }));

    setUploadFiles((prev) => [...prev, ...newUploadFiles]);
    setUploadDialogOpen(true);
  }, []);

  // Remove file from upload queue
  const removeUploadFile = useCallback((id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Clear completed uploads
  const clearCompletedUploads = useCallback(() => {
    setUploadFiles((prev) => prev.filter((f) => f.status !== "completed"));
  }, []);

  // Upload a single file
  const uploadSingleFile = async (uploadFile: UploadFile): Promise<boolean> => {
    // Update status to uploading
    setUploadFiles((prev) =>
      prev.map((f) =>
        f.id === uploadFile.id
          ? { ...f, status: "uploading" as const, progress: 0 }
          : f,
      ),
    );

    try {
      // First, create the file record
      const createResponse = await fetchClinet.POST("/api/storage/files", {
        body: {
          name: uploadFile.name,
          type: "FILE",
          parentId: currentParentId,
          isPublic: false,
        },
      });

      if (!createResponse.data) {
        throw new Error("Failed to create file record");
      }

      // Simulate upload progress (in a real implementation, you'd use XMLHttpRequest or fetch with progress)
      // For now, we'll simulate progress updates
      const fileId = createResponse.data.id;

      // Simulate upload with progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, progress: Math.min(progress, 100) }
              : f,
          ),
        );
      }

      // Create file version with the actual file data
      // In a real implementation, you would upload to a storage service and get the path
      await fetchClinet.POST("/api/storage/files/{fileId}/versions", {
        params: { path: { fileId } },
        body: {
          sizeBytes: uploadFile.size,
          storagePath: `/uploads/${fileId}/${uploadFile.name}`,
        },
      });

      // Update status to completed
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: "completed" as const, progress: 100 }
            : f,
        ),
      );

      return true;
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id
            ? { ...f, status: "error" as const, error: "Upload failed" }
            : f,
        ),
      );
      return false;
    }
  };

  // Upload all pending files
  const handleUploadAll = async () => {
    const pendingFiles = uploadFiles.filter((f) => f.status === "pending");
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    let successCount = 0;
    let failCount = 0;

    for (const file of pendingFiles) {
      const success = await uploadSingleFile(file);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsUploading(false);

    // Show summary toast
    if (successCount > 0 && failCount === 0) {
      toast.success(
        `Successfully uploaded ${successCount} file${successCount > 1 ? "s" : ""}`,
      );
    } else if (successCount > 0 && failCount > 0) {
      toast.warning(
        `Uploaded ${successCount} file${successCount > 1 ? "s" : ""}, ${failCount} failed`,
      );
    } else if (failCount > 0) {
      toast.error(
        `Failed to upload ${failCount} file${failCount > 1 ? "s" : ""}`,
      );
    }

    // Refresh file list
    queryClient.invalidateQueries({ queryKey: ["get", "/api/storage/files"] });
  };

  // Close upload dialog and clear queue
  const closeUploadDialog = () => {
    if (isUploading) return; // Don't close while uploading
    setUploadDialogOpen(false);
    // Clear queue after a short delay to allow animation
    setTimeout(() => {
      setUploadFiles([]);
    }, 200);
  };

  // Create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }

    setIsLoading(true);
    try {
      await fetchClinet.POST("/api/storage/files", {
        body: {
          name: newFolderName.trim(),
          type: "FOLDER",
          parentId: currentParentId,
          isPublic: false,
        },
      });
      toast.success("Folder created successfully");
      setCreateFolderOpen(false);
      setNewFolderName("");
      queryClient.invalidateQueries({
        queryKey: ["get", "/api/storage/files"],
      });
    } catch (error) {
      toast.error("Failed to create folder");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Rename file/folder
  const handleRename = async () => {
    if (!selectedFile || !renameName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    setIsLoading(true);
    try {
      await fetchClinet.PATCH("/api/storage/files/{fileId}", {
        params: { path: { fileId: selectedFile.id } },
        body: { name: renameName.trim() },
      });
      toast.success("Renamed successfully");
      setRenameDialogOpen(false);
      setRenameName("");
      setSelectedFile(null);
      queryClient.invalidateQueries({
        queryKey: ["get", "/api/storage/files"],
      });
    } catch (error) {
      toast.error("Failed to rename");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete file/folder
  const handleDelete = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      await fetchClinet.DELETE("/api/storage/files/{fileId}", {
        params: { path: { fileId: selectedFile.id } },
      });
      toast.success("Deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedFile(null);
      queryClient.invalidateQueries({
        queryKey: ["get", "/api/storage/files"],
      });
    } catch (error) {
      toast.error("Failed to delete");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Move file/folder
  const handleMove = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      await fetchClinet.POST("/api/storage/files/{fileId}/move", {
        params: { path: { fileId: selectedFile.id } },
        body: { targetParentId },
      });
      toast.success("Moved successfully");
      setMoveDialogOpen(false);
      setSelectedFile(null);
      setTargetParentId(null);
      queryClient.invalidateQueries({
        queryKey: ["get", "/api/storage/files"],
      });
    } catch (error) {
      toast.error("Failed to move");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy file/folder
  const handleCopy = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    try {
      await fetchClinet.POST("/api/storage/files/{fileId}/copy", {
        params: { path: { fileId: selectedFile.id } },
        body: {
          targetParentId,
          ...(copyNewName && { newName: copyNewName }),
        },
      });
      toast.success("Copied successfully");
      setCopyDialogOpen(false);
      setSelectedFile(null);
      setTargetParentId(null);
      setCopyNewName("");
      queryClient.invalidateQueries({
        queryKey: ["get", "/api/storage/files"],
      });
    } catch (error) {
      toast.error("Failed to copy");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle public access
  const handleTogglePublic = async (file: FileData) => {
    try {
      await fetchClinet.PATCH("/api/storage/files/{fileId}", {
        params: { path: { fileId: file.id } },
        body: { isPublic: !file.isPublic },
      });
      toast.success(file.isPublic ? "Made private" : "Made public");
      queryClient.invalidateQueries({
        queryKey: ["get", "/api/storage/files"],
      });
    } catch (error) {
      toast.error("Failed to update visibility");
      console.error(error);
    }
  };

  const openRenameDialog = (file: FileData) => {
    setSelectedFile(file);
    setRenameName(file.name);
    setRenameDialogOpen(true);
  };

  const openDeleteDialog = (file: FileData) => {
    setSelectedFile(file);
    setDeleteDialogOpen(true);
  };

  const openMoveDialog = (file: FileData) => {
    setSelectedFile(file);
    setTargetParentId(null);
    setMoveDialogOpen(true);
  };

  const openCopyDialog = (file: FileData) => {
    setSelectedFile(file);
    setTargetParentId(currentParentId);
    setCopyNewName(`Copy of ${file.name}`);
    setCopyDialogOpen(true);
  };

  const openDetailsDialog = (file: FileData) => {
    setSelectedFile(file);
    setDetailsDialogOpen(true);
  };

  const canEdit = (file: FileData) =>
    file.visibility === "OWNER" || file.visibility === "EDITOR";
  const isOwner = (file: FileData) => file.visibility === "OWNER";

  const renderFileActions = (file: FileData) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => openDetailsDialog(file)}>
          <Eye className="mr-2 size-4" />
          View Details
        </DropdownMenuItem>
        {file.type === "FILE" && (
          <DropdownMenuItem>
            <Download className="mr-2 size-4" />
            Download
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {canEdit(file) && (
          <>
            <DropdownMenuItem onClick={() => openRenameDialog(file)}>
              <Edit className="mr-2 size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openMoveDialog(file)}>
              <Move className="mr-2 size-4" />
              Move
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem onClick={() => openCopyDialog(file)}>
          <Copy className="mr-2 size-4" />
          Copy
        </DropdownMenuItem>
        {isOwner(file) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleTogglePublic(file)}>
              {file.isPublic ? (
                <>
                  <Lock className="mr-2 size-4" />
                  Make Private
                </>
              ) : (
                <>
                  <Globe className="mr-2 size-4" />
                  Make Public
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setSelectedFile(file);
                setShareDialogOpen(true);
              }}
            >
              <Share2 className="mr-2 size-4" />
              Share
            </DropdownMenuItem>
          </>
        )}
        {canEdit(file) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => openDeleteDialog(file)}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (filesLoading && !isSearching) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Drag overlay */}
      {isDragging && (
        // biome-ignore lint/a11y/noStaticElementInteractions: drag-drop overlay
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="border-2 border-dashed border-primary rounded-lg p-12 bg-background pointer-events-none">
            <div className="flex flex-col items-center gap-4 text-center">
              <Upload className="size-12 text-primary animate-bounce" />
              <div>
                <h3 className="text-lg font-semibold">Drop files to upload</h3>
                <p className="text-sm text-muted-foreground">
                  Files will be uploaded to the current folder
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content with drag handlers */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: drag-drop container */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="contents"
      >
        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              className="pl-9 pr-9"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 size-7"
                onClick={clearSearch}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setCreateFolderOpen(true)}>
              <FolderPlus className="mr-2 size-4" />
              New Folder
            </Button>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 size-4" />
              Upload
            </Button>
            <Tabs
              value={viewMode}
              onValueChange={(v) => setViewMode(v as "grid" | "list")}
            >
              <TabsList>
                <TabsTrigger value="grid">
                  <Grid className="size-4" />
                </TabsTrigger>
                <TabsTrigger value="list">
                  <List className="size-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Breadcrumb */}
        {!isSearching && (
          <div className="flex items-center gap-1 text-sm flex-wrap py-4 px-2">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.id ?? "home"} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight className="size-4 text-muted-foreground" />
                )}
                <button
                  type="button"
                  onClick={() => navigateToFolder(crumb.id, crumb.name)}
                  className={`hover:underline ${
                    index === breadcrumbs.length - 1
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {index === 0 ? (
                    <span className="flex items-center gap-1">
                      <Home className="size-4" />
                      {crumb.name}
                    </span>
                  ) : (
                    crumb.name
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Search indicator */}
        {isSearching && searchQuery && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 px-2">
            <Search className="size-4" />
            <span>
              Showing results for &quot;{searchQuery}&quot;
              {totalItems !== undefined && ` (${totalItems} items)`}
            </span>
            <Button
              variant="link"
              size="sm"
              className="p-0 h-auto"
              onClick={clearSearch}
            >
              Clear search
            </Button>
          </div>
        )}

        {/* Files */}
        {!files || files.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon">
              {isSearching ? <Search /> : <FolderOpen />}
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>
                {isSearching ? "No Results Found" : "No Files"}
              </EmptyTitle>
              <EmptyDescription>
                {isSearching
                  ? `No files or folders match "${searchQuery}".`
                  : "This folder is empty. Upload files or create a new folder."}
              </EmptyDescription>
            </EmptyHeader>
            {!isSearching && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCreateFolderOpen(true)}
                >
                  <FolderPlus className="mr-2 size-4" />
                  New Folder
                </Button>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 size-4" />
                  Upload Files
                </Button>
              </div>
            )}
          </Empty>
        ) : viewMode === "grid" ? (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {files.map((file) => (
              <Card
                key={file.id}
                className="group cursor-pointer transition-colors hover:border-primary/50"
                onClick={() => {
                  if (file.type === "FOLDER") {
                    navigateToFolder(file.id, file.name);
                  } else {
                    openDetailsDialog(file as FileData);
                  }
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {file.type === "FOLDER" ? (
                        <FolderOpen className="size-10 text-primary" />
                      ) : (
                        <File className="size-10 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {file.isPublic && (
                        <Badge variant="secondary" className="text-xs px-1">
                          <Globe className="size-3" />
                        </Badge>
                      )}
                      {/* biome-ignore lint/a11y/noStaticElementInteractions: click event prevents propagation to parent */}
                      <span
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        {renderFileActions(file as FileData)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardTitle className="truncate text-sm" title={file.name}>
                    {file.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {file.type === "FOLDER"
                        ? "Folder"
                        : formatFileSize(file.sizeBytes)}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-xs px-1 py-0 h-5 gap-1"
                    >
                      {getVisibilityIcon(file.visibility)}
                      {getVisibilityLabel(file.visibility)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            <div className="grid grid-cols-12 gap-4 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
              <div className="col-span-5">Name</div>
              <div className="col-span-2">Size</div>
              <div className="col-span-2">Modified</div>
              <div className="col-span-2">Access</div>
              <div className="col-span-1" />
            </div>
            {files.map((file) => (
              // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard navigation handled via dropdown
              // biome-ignore lint/a11y/noStaticElementInteractions: file row acts as clickable container
              <div
                key={file.id}
                className="grid grid-cols-12 gap-4 items-center rounded-lg border px-3 py-2 transition-colors hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
                onClick={() => {
                  if (file.type === "FOLDER") {
                    navigateToFolder(file.id, file.name);
                  } else {
                    openDetailsDialog(file as FileData);
                  }
                }}
              >
                <div className="col-span-5 flex items-center gap-3 min-w-0">
                  {file.type === "FOLDER" ? (
                    <FolderOpen className="size-5 text-primary shrink-0" />
                  ) : (
                    <File className="size-5 text-muted-foreground shrink-0" />
                  )}
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="font-medium truncate" title={file.name}>
                      {file.name}
                    </span>
                    {file.isPublic && (
                      <Globe className="size-3 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {file.type === "FOLDER"
                    ? "—"
                    : formatFileSize(file.sizeBytes)}
                </div>
                <div className="col-span-2 text-sm text-muted-foreground">
                  {formatDate(file.updatedAt)}
                </div>
                <div className="col-span-2">
                  <Badge variant="outline" className="text-xs gap-1">
                    {getVisibilityIcon(file.visibility)}
                    {getVisibilityLabel(file.visibility)}
                  </Badge>
                </div>
                {/* biome-ignore lint/a11y/noStaticElementInteractions: click event prevents propagation to parent */}
                <span
                  className="col-span-1 flex justify-end"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  {renderFileActions(file as FileData)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages && totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages} ({totalItems} items)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="size-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
                <ChevronRightIcon className="size-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Create Folder Dialog */}
        <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
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
                <Input
                  id="folder-name"
                  placeholder="My Folder"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateFolder();
                    }
                  }}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateFolderOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateFolder} disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Folder"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rename Dialog */}
        <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename</DialogTitle>
              <DialogDescription>
                Enter a new name for &quot;{selectedFile?.name}&quot;
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="rename">New Name</FieldLabel>
                <Input
                  id="rename"
                  value={renameName}
                  onChange={(e) => setRenameName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRename();
                    }
                  }}
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRenameDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleRename} disabled={isLoading}>
                {isLoading ? "Renaming..." : "Rename"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {selectedFile?.type === "FOLDER" ? "Folder" : "File"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &quot;{selectedFile?.name}
                &quot;?
                {selectedFile?.type === "FOLDER" &&
                  " This will also delete all files and folders inside it."}
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isLoading ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Move Dialog */}
        <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Move {selectedFile?.type === "FOLDER" ? "Folder" : "File"}
              </DialogTitle>
              <DialogDescription>
                Select a destination folder for &quot;{selectedFile?.name}&quot;
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel>Destination</FieldLabel>
                <Select
                  value={targetParentId ?? "root"}
                  onValueChange={(v) =>
                    setTargetParentId(v === "root" ? null : v)
                  }
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
              <Button
                variant="outline"
                onClick={() => setMoveDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleMove} disabled={isLoading}>
                {isLoading ? "Moving..." : "Move"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Copy Dialog */}
        <Dialog open={copyDialogOpen} onOpenChange={setCopyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Copy {selectedFile?.type === "FOLDER" ? "Folder" : "File"}
              </DialogTitle>
              <DialogDescription>
                Create a copy of &quot;{selectedFile?.name}&quot;
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="copy-name">New Name (optional)</FieldLabel>
                <Input
                  id="copy-name"
                  placeholder={`Copy of ${selectedFile?.name}`}
                  value={copyNewName}
                  onChange={(e) => setCopyNewName(e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel>Destination</FieldLabel>
                <Select
                  value={targetParentId ?? "root"}
                  onValueChange={(v) =>
                    setTargetParentId(v === "root" ? null : v)
                  }
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
              <Button
                variant="outline"
                onClick={() => setCopyDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCopy} disabled={isLoading}>
                {isLoading ? "Copying..." : "Copy"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Share &quot;{selectedFile?.name}&quot;</DialogTitle>
              <DialogDescription>
                Manage who has access to this{" "}
                {selectedFile?.type === "FOLDER" ? "folder" : "file"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {selectedFile?.isPublic ? (
                    <Globe className="size-5 text-primary" />
                  ) : (
                    <Lock className="size-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium">
                      {selectedFile?.isPublic ? "Public" : "Private"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedFile?.isPublic
                        ? "Anyone with the link can view"
                        : "Only people with access can view"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    selectedFile && handleTogglePublic(selectedFile)
                  }
                >
                  {selectedFile?.isPublic ? "Make Private" : "Make Public"}
                </Button>
              </div>

              {fileDetails?.permissions &&
                fileDetails.permissions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">People with access</p>
                    <div className="space-y-2">
                      {fileDetails.permissions.map((perm) => (
                        <div
                          key={perm.id}
                          className="flex items-center justify-between p-2 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Users className="size-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {perm.user?.name ||
                                  `User ${perm.platformUserId}`}
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
              <Button
                variant="outline"
                onClick={() => setShareDialogOpen(false)}
              >
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedFile?.type === "FOLDER" ? (
                  <FolderOpen className="size-5 text-primary" />
                ) : (
                  <File className="size-5 text-muted-foreground" />
                )}
                {selectedFile?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium">
                    {selectedFile?.type === "FOLDER" ? "Folder" : "File"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Size</p>
                  <p className="font-medium">
                    {selectedFile?.type === "FOLDER"
                      ? "—"
                      : formatFileSize(selectedFile?.sizeBytes || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {formatDate(fileDetails?.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Modified</p>
                  <p className="font-medium">
                    {formatDate(fileDetails?.updatedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Access</p>
                  <div className="flex items-center gap-1">
                    {getVisibilityIcon(selectedFile?.visibility || "")}
                    <span className="font-medium">
                      {getVisibilityLabel(selectedFile?.visibility || "")}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Visibility</p>
                  <div className="flex items-center gap-1">
                    {selectedFile?.isPublic ? (
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
                  <p className="font-mono text-xs bg-muted p-2 rounded mt-1 break-all">
                    {fileDetails.path}
                  </p>
                </div>
              )}

              {fileDetails?.versions && fileDetails.versions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <History className="size-4" />
                    Version History
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {fileDetails.versions.map((version) => (
                      <div
                        key={version.id}
                        className="flex items-center justify-between text-sm p-2 border rounded"
                      >
                        <span>Version {version.versionNumber}</span>
                        <span className="text-muted-foreground">
                          {formatFileSize(version.sizeBytes)} •{" "}
                          {formatDate(version.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDetailsDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Upload Dialog */}
        <Dialog
          open={uploadDialogOpen}
          onOpenChange={(open) => !isUploading && setUploadDialogOpen(open)}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileUp className="size-5" />
                Upload Files
              </DialogTitle>
              <DialogDescription>
                {uploadFiles.length === 0
                  ? "Select files to upload to the current folder"
                  : `${uploadFiles.length} file${uploadFiles.length > 1 ? "s" : ""} selected`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Drop zone */}
              {uploadFiles.length === 0 && (
                // biome-ignore lint/a11y/useKeyWithClickEvents: click triggers file input
                // biome-ignore lint/a11y/noStaticElementInteractions: interactive drop zone
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    "hover:border-primary hover:bg-muted/50",
                  )}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="size-10 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm font-medium">Click to select files</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    or drag and drop files here
                  </p>
                </div>
              )}

              {/* File list */}
              {uploadFiles.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {uploadFiles.map((uploadFile) => (
                    <div
                      key={uploadFile.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <div className="shrink-0">
                        {uploadFile.status === "completed" ? (
                          <CheckCircle className="size-5 text-green-500" />
                        ) : uploadFile.status === "error" ? (
                          <AlertCircle className="size-5 text-destructive" />
                        ) : uploadFile.status === "uploading" ? (
                          <Loader2 className="size-5 text-primary animate-spin" />
                        ) : (
                          <File className="size-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
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
                          <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
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
                          onClick={() => removeUploadFile(uploadFile.id)}
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add more files button */}
              {uploadFiles.length > 0 && !isUploading && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 size-4" />
                  Add More Files
                </Button>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              {uploadFiles.some((f) => f.status === "completed") && (
                <Button
                  variant="ghost"
                  onClick={clearCompletedUploads}
                  disabled={isUploading}
                >
                  Clear Completed
                </Button>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={closeUploadDialog}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Cancel"}
                </Button>
                <Button
                  onClick={handleUploadAll}
                  disabled={
                    isUploading ||
                    uploadFiles.filter((f) => f.status === "pending").length ===
                      0
                  }
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 size-4" />
                      Upload{" "}
                      {uploadFiles.filter((f) => f.status === "pending")
                        .length > 0 &&
                        `(${uploadFiles.filter((f) => f.status === "pending").length})`}
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
