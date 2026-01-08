"use client";

import {
  File,
  Folder,
  MoreVertical,
  Pencil,
  Trash2,
  Move,
  Copy,
  Share2,
  Info,
  Upload,
  FolderPlus,
  ChevronRight,
  Globe,
  Lock,
  Download,
} from "lucide-react";

import { Button } from "@midori/components/ui/button";
import { Card, CardContent } from "@midori/components/ui/card";
import { Badge } from "@midori/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midori/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@midori/components/ui/empty";
import { formatFileSize, formatDateTime } from "@midori/lib/format";
import type { FileData, BreadcrumbItem } from "@midori/types/admin";

// ==================== File Card ====================

interface FileCardProps {
  file: FileData;
  onClick: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
  onMove: () => void;
  onCopy: () => void;
  onShare: () => void;
  onDetails: () => void;
}

export function FileCard({
  file,
  onClick,
  onDownload,
  onRename,
  onDelete,
  onMove,
  onCopy,
  onShare,
  onDetails,
}: FileCardProps) {
  const isFolder = file.type === "FOLDER";
  const Icon = isFolder ? Folder : File;

  return (
    <Card
      className="group cursor-pointer transition-colors hover:border-primary/50"
      onClick={onClick}
    >
      <CardContent className="flex items-start justify-between p-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className={`flex size-10 items-center justify-center rounded-lg ${isFolder
              ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
              : "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
              }`}
          >
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{file.name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {!isFolder && <span>{formatFileSize(file.sizeBytes)}</span>}
              {file.isPublic ? (
                <Badge variant="secondary" className="gap-1 px-1.5 py-0">
                  <Globe className="size-3" />
                  Public
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1 px-1.5 py-0">
                  <Lock className="size-3" />
                  Private
                </Badge>
              )}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={onDetails}>
              <Info className="mr-2 size-4" />
              Details
            </DropdownMenuItem>
            {!isFolder && (
              <DropdownMenuItem onClick={onDownload}>
                <Download className="mr-2 size-4" />
                Download
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onRename}>
              <Pencil className="mr-2 size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMove}>
              <Move className="mr-2 size-4" />
              Move
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCopy}>
              <Copy className="mr-2 size-4" />
              Copy
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShare}>
              <Share2 className="mr-2 size-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}

// ==================== Files Grid ====================

interface FilesGridProps {
  files: FileData[];
  onFileClick: (file: FileData) => void;
  onDownload: (file: FileData) => void;
  onRename: (file: FileData) => void;
  onDelete: (file: FileData) => void;
  onMove: (file: FileData) => void;
  onCopy: (file: FileData) => void;
  onShare: (file: FileData) => void;
  onDetails: (file: FileData) => void;
}

export function FilesGrid({
  files,
  onFileClick,
  onDownload,
  onRename,
  onDelete,
  onMove,
  onCopy,
  onShare,
  onDetails,
}: FilesGridProps) {
  // Sort files: folders first, then files
  const sortedFiles = [...files].sort((a, b) => {
    if (a.type === "FOLDER" && b.type === "FILE") return -1;
    if (a.type === "FILE" && b.type === "FOLDER") return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {sortedFiles.map((file) => (
        <FileCard
          key={file.id}
          file={file}
          onClick={() => onFileClick(file)}
          onDownload={() => onDownload(file)}
          onRename={() => onRename(file)}
          onDelete={() => onDelete(file)}
          onMove={() => onMove(file)}
          onCopy={() => onCopy(file)}
          onShare={() => onShare(file)}
          onDetails={() => onDetails(file)}
        />
      ))}
    </div>
  );
}

// ==================== Files List View ====================

interface FilesListProps {
  files: FileData[];
  onFileClick: (file: FileData) => void;
  onDownload: (file: FileData) => void;
  onRename: (file: FileData) => void;
  onDelete: (file: FileData) => void;
  onMove: (file: FileData) => void;
  onCopy: (file: FileData) => void;
  onShare: (file: FileData) => void;
  onDetails: (file: FileData) => void;
}

export function FilesList({
  files,
  onFileClick,
  onDownload,
  onRename,
  onDelete,
  onMove,
  onCopy,
  onShare,
  onDetails,
}: FilesListProps) {
  // Sort files: folders first, then files
  const sortedFiles = [...files].sort((a, b) => {
    if (a.type === "FOLDER" && b.type === "FILE") return -1;
    if (a.type === "FILE" && b.type === "FOLDER") return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="rounded-lg border">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 border-b bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground">
        <div className="col-span-6">Name</div>
        <div className="col-span-2">Size</div>
        <div className="col-span-3">Modified</div>
        <div className="col-span-1" />
      </div>
      {/* Rows */}
      {sortedFiles.map((file) => (
        <FileListRow
          key={file.id}
          file={file}
          onClick={() => onFileClick(file)}
          onDownload={() => onDownload(file)}
          onRename={() => onRename(file)}
          onDelete={() => onDelete(file)}
          onMove={() => onMove(file)}
          onCopy={() => onCopy(file)}
          onShare={() => onShare(file)}
          onDetails={() => onDetails(file)}
        />
      ))}
    </div>
  );
}

interface FileListRowProps {
  file: FileData;
  onClick: () => void;
  onDownload: () => void;
  onRename: () => void;
  onDelete: () => void;
  onMove: () => void;
  onCopy: () => void;
  onShare: () => void;
  onDetails: () => void;
}

function FileListRow({
  file,
  onClick,
  onDownload,
  onRename,
  onDelete,
  onMove,
  onCopy,
  onShare,
  onDetails,
}: FileListRowProps) {
  const isFolder = file.type === "FOLDER";
  const Icon = isFolder ? Folder : File;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: Grid layout requires div with role
    <div
      role="button"
      tabIndex={0}
      className="group grid cursor-pointer grid-cols-12 items-center gap-4 border-b px-4 py-2 transition-colors last:border-0 hover:bg-muted/50"
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <div className="col-span-6 flex items-center gap-3 overflow-hidden">
        <div
          className={`flex size-8 items-center justify-center rounded ${isFolder
            ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
            : "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
            }`}
        >
          <Icon className="size-4" />
        </div>
        <span className="truncate">{file.name}</span>
        {file.isPublic && (
          <Globe className="size-3 shrink-0 text-muted-foreground" />
        )}
      </div>
      <div className="col-span-2 text-sm text-muted-foreground">
        {isFolder ? "—" : formatFileSize(file.sizeBytes)}
      </div>
      <div className="col-span-3 text-sm text-muted-foreground">
        {formatDateTime(file.updatedAt)}
      </div>
      <div className="col-span-1 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={onDetails}>
              <Info className="mr-2 size-4" />
              Details
            </DropdownMenuItem>
            {!isFolder && (
              <DropdownMenuItem onClick={onDownload}>
                <Download className="mr-2 size-4" />
                Download
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onRename}>
              <Pencil className="mr-2 size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMove}>
              <Move className="mr-2 size-4" />
              Move
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onCopy}>
              <Copy className="mr-2 size-4" />
              Copy
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShare}>
              <Share2 className="mr-2 size-4" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ==================== Breadcrumb ====================

interface StorageBreadcrumbProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigate: (folderId: string | null, folderName: string) => void;
}

export function StorageBreadcrumb({
  breadcrumbs,
  onNavigate,
}: StorageBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.id ?? "home"} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
          <button
            type="button"
            className={`rounded px-2 py-1 hover:bg-muted ${index === breadcrumbs.length - 1
              ? "font-medium text-foreground"
              : "text-muted-foreground"
              }`}
            onClick={() => onNavigate(crumb.id, crumb.name)}
          >
            {crumb.name}
          </button>
        </div>
      ))}
    </nav>
  );
}

// ==================== Empty State ====================

interface EmptyStorageProps {
  onUpload: () => void;
  onCreateFolder: () => void;
}

export function EmptyStorage({ onUpload, onCreateFolder }: EmptyStorageProps) {
  return (
    <Empty>
      <EmptyMedia>
        <Folder className="size-16 text-muted-foreground/50" />
      </EmptyMedia>
      <EmptyContent>
        <EmptyHeader>
          <EmptyTitle>No files yet</EmptyTitle>
          <EmptyDescription>
            Upload files or create folders to get started with your storage.
          </EmptyDescription>
        </EmptyHeader>
        <div className="flex gap-2">
          <Button onClick={onUpload}>
            <Upload className="mr-2 size-4" />
            Upload Files
          </Button>
          <Button variant="outline" onClick={onCreateFolder}>
            <FolderPlus className="mr-2 size-4" />
            New Folder
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
