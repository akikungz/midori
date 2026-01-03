"use client";

import {
  FolderOpen,
  File,
  Globe,
  MoreVertical,
  Eye,
  Download,
  Edit,
  Move,
  Copy,
  Lock,
  Share2,
  Trash2,
  Crown,
  Pencil,
} from "lucide-react";

import type { FileData, FileVisibility } from "@midori/types/admin";
import { formatFileSize, formatDateTime } from "@midori/lib/format";
import { Button } from "@midori/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@midori/components/ui/card";
import { Badge } from "@midori/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@midori/components/ui/dropdown-menu";

// ============================================================================
// Visibility Helpers
// ============================================================================

export function getVisibilityIcon(visibility: FileVisibility | string) {
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
}

export function getVisibilityLabel(visibility: FileVisibility | string) {
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
}

export function canEdit(file: FileData) {
  return file.visibility === "OWNER" || file.visibility === "EDITOR";
}

export function isOwner(file: FileData) {
  return file.visibility === "OWNER";
}

// ============================================================================
// File Actions Dropdown
// ============================================================================

interface FileActionsProps {
  file: FileData;
  onViewDetails: (file: FileData) => void;
  onRename: (file: FileData) => void;
  onMove: (file: FileData) => void;
  onCopy: (file: FileData) => void;
  onTogglePublic: (file: FileData) => void;
  onShare: (file: FileData) => void;
  onDelete: (file: FileData) => void;
}

export function FileActions({
  file,
  onViewDetails,
  onRename,
  onMove,
  onCopy,
  onTogglePublic,
  onShare,
  onDelete,
}: FileActionsProps) {
  return (
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
        <DropdownMenuItem onClick={() => onViewDetails(file)}>
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
            <DropdownMenuItem onClick={() => onRename(file)}>
              <Edit className="mr-2 size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove(file)}>
              <Move className="mr-2 size-4" />
              Move
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem onClick={() => onCopy(file)}>
          <Copy className="mr-2 size-4" />
          Copy
        </DropdownMenuItem>
        {isOwner(file) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onTogglePublic(file)}>
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
            <DropdownMenuItem onClick={() => onShare(file)}>
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
              onClick={() => onDelete(file)}
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ============================================================================
// File Grid View
// ============================================================================

interface FileGridProps {
  files: FileData[];
  onNavigate: (file: FileData) => void;
  onViewDetails: (file: FileData) => void;
  fileActionsProps: Omit<FileActionsProps, "file">;
}

export function FileGrid({
  files,
  onNavigate,
  onViewDetails,
  fileActionsProps,
}: FileGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {files.map((file) => (
        <Card
          key={file.id}
          className="group cursor-pointer transition-colors hover:border-primary/50"
          onClick={() => {
            if (file.type === "FOLDER") {
              onNavigate(file);
            } else {
              onViewDetails(file);
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
                  <Badge variant="secondary" className="px-1 text-xs">
                    <Globe className="size-3" />
                  </Badge>
                )}
                {/* biome-ignore lint/a11y/noStaticElementInteractions: click event prevents propagation to parent */}
                <span
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <FileActions file={file} {...fileActionsProps} />
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <CardTitle className="truncate text-sm" title={file.name}>
              {file.name}
            </CardTitle>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {file.type === "FOLDER"
                  ? "Folder"
                  : formatFileSize(file.sizeBytes)}
              </p>
              <Badge variant="outline" className="h-5 gap-1 px-1 py-0 text-xs">
                {getVisibilityIcon(file.visibility)}
                {getVisibilityLabel(file.visibility)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ============================================================================
// File List View
// ============================================================================

interface FileListProps {
  files: FileData[];
  onNavigate: (file: FileData) => void;
  onViewDetails: (file: FileData) => void;
  fileActionsProps: Omit<FileActionsProps, "file">;
}

export function FileList({
  files,
  onNavigate,
  onViewDetails,
  fileActionsProps,
}: FileListProps) {
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-12 gap-4 border-b px-3 py-2 text-xs font-medium text-muted-foreground">
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
          className="grid cursor-pointer grid-cols-12 items-center gap-4 rounded-lg border px-3 py-2 transition-colors hover:border-primary/50 hover:bg-muted/50"
          onClick={() => {
            if (file.type === "FOLDER") {
              onNavigate(file);
            } else {
              onViewDetails(file);
            }
          }}
        >
          <div className="col-span-5 flex min-w-0 items-center gap-3">
            {file.type === "FOLDER" ? (
              <FolderOpen className="size-5 shrink-0 text-primary" />
            ) : (
              <File className="size-5 shrink-0 text-muted-foreground" />
            )}
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate font-medium" title={file.name}>
                {file.name}
              </span>
              {file.isPublic && (
                <Globe className="size-3 shrink-0 text-muted-foreground" />
              )}
            </div>
          </div>
          <div className="col-span-2 text-sm text-muted-foreground">
            {file.type === "FOLDER" ? "—" : formatFileSize(file.sizeBytes)}
          </div>
          <div className="col-span-2 text-sm text-muted-foreground">
            {formatDateTime(file.updatedAt)}
          </div>
          <div className="col-span-2">
            <Badge variant="outline" className="gap-1 text-xs">
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
            <FileActions file={file} {...fileActionsProps} />
          </span>
        </div>
      ))}
    </div>
  );
}
