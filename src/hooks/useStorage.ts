import { useState, useCallback, useRef } from "react";
import type { BreadcrumbItem, FileData, UploadFile } from "@midori/types/admin";
import { generateUniqueId } from "@midori/lib/format";

/**
 * Hook for managing storage navigation state
 */
export function useStorageNavigation() {
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: "Home" },
  ]);

  const navigateToFolder = useCallback(
    (folderId: string | null, folderName: string) => {
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
    },
    [breadcrumbs],
  );

  const navigateToFile = useCallback(
    (file: FileData) => {
      if (file.type === "FOLDER") {
        navigateToFolder(file.id, file.name);
      }
    },
    [navigateToFolder],
  );

  return {
    currentParentId,
    breadcrumbs,
    navigateToFolder,
    navigateToFile,
  };
}

/**
 * Hook for managing file upload state and handlers
 */
export function useFileUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const triggerFileSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const newUploadFiles: UploadFile[] = Array.from(files).map((file) => ({
        id: generateUniqueId("upload"),
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

  const addFilesFromDrop = useCallback((files: FileList) => {
    const newUploadFiles: UploadFile[] = Array.from(files).map((file) => ({
      id: generateUniqueId("upload"),
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: "pending" as const,
    }));

    setUploadFiles((prev) => [...prev, ...newUploadFiles]);
    setUploadDialogOpen(true);
  }, []);

  const removeUploadFile = useCallback((id: string) => {
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearCompletedUploads = useCallback(() => {
    setUploadFiles((prev) => prev.filter((f) => f.status !== "completed"));
  }, []);

  const updateFileProgress = useCallback(
    (id: string, progress: number, status?: UploadFile["status"]) => {
      setUploadFiles((prev) =>
        prev.map((f) =>
          f.id === id ? { ...f, progress, ...(status && { status }) } : f,
        ),
      );
    },
    [],
  );

  const setFileError = useCallback((id: string, error: string) => {
    setUploadFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: "error" as const, error } : f,
      ),
    );
  }, []);

  const setFileCompleted = useCallback((id: string) => {
    setUploadFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: "completed" as const, progress: 100 } : f,
      ),
    );
  }, []);

  const closeUploadDialog = useCallback(() => {
    if (isUploading) return;
    setUploadDialogOpen(false);
    setTimeout(() => setUploadFiles([]), 200);
  }, [isUploading]);

  return {
    fileInputRef,
    uploadFiles,
    uploadDialogOpen,
    isUploading,
    setIsUploading,
    setUploadDialogOpen,
    triggerFileSelect,
    handleFileSelect,
    addFilesFromDrop,
    removeUploadFile,
    clearCompletedUploads,
    updateFileProgress,
    setFileError,
    setFileCompleted,
    closeUploadDialog,
  };
}

/**
 * Hook for managing drag and drop state
 */
export function useDragAndDrop(onDrop: (files: FileList) => void) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounterRef.current = 0;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onDrop(files);
      }
    },
    [onDrop],
  );

  return {
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
}

/**
 * Hook for managing file dialog states
 */
export function useFileDialogs() {
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [targetParentId, setTargetParentId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [copyNewName, setCopyNewName] = useState("");

  const openRenameDialog = useCallback((file: FileData) => {
    setSelectedFile(file);
    setRenameName(file.name);
    setRenameDialogOpen(true);
  }, []);

  const openDeleteDialog = useCallback((file: FileData) => {
    setSelectedFile(file);
    setDeleteDialogOpen(true);
  }, []);

  const openMoveDialog = useCallback((file: FileData) => {
    setSelectedFile(file);
    setTargetParentId(null);
    setMoveDialogOpen(true);
  }, []);

  const openCopyDialog = useCallback(
    (file: FileData, currentParentId: string | null) => {
      setSelectedFile(file);
      setTargetParentId(currentParentId);
      setCopyNewName(`Copy of ${file.name}`);
      setCopyDialogOpen(true);
    },
    [],
  );

  const openDetailsDialog = useCallback((file: FileData) => {
    setSelectedFile(file);
    setDetailsDialogOpen(true);
  }, []);

  const openShareDialog = useCallback((file: FileData) => {
    setSelectedFile(file);
    setShareDialogOpen(true);
  }, []);

  const resetDialogState = useCallback(() => {
    setSelectedFile(null);
    setTargetParentId(null);
    setNewFolderName("");
    setRenameName("");
    setCopyNewName("");
  }, []);

  return {
    // Dialog open states
    createFolderOpen,
    setCreateFolderOpen,
    renameDialogOpen,
    setRenameDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    shareDialogOpen,
    setShareDialogOpen,
    moveDialogOpen,
    setMoveDialogOpen,
    copyDialogOpen,
    setCopyDialogOpen,
    detailsDialogOpen,
    setDetailsDialogOpen,
    // Form states
    selectedFile,
    setSelectedFile,
    targetParentId,
    setTargetParentId,
    newFolderName,
    setNewFolderName,
    renameName,
    setRenameName,
    copyNewName,
    setCopyNewName,
    // Open dialog helpers
    openRenameDialog,
    openDeleteDialog,
    openMoveDialog,
    openCopyDialog,
    openDetailsDialog,
    openShareDialog,
    resetDialogState,
  };
}
