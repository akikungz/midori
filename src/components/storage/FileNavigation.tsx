"use client";

import { ChevronRight, Home, Search, FolderOpen } from "lucide-react";

import type { BreadcrumbItem } from "@midori/types/admin";
import { Button } from "@midori/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@midori/components/ui/empty";

// ============================================================================
// Breadcrumb Navigation
// ============================================================================

interface BreadcrumbNavProps {
  breadcrumbs: BreadcrumbItem[];
  onNavigate: (id: string | null, name: string) => void;
}

export function BreadcrumbNav({ breadcrumbs, onNavigate }: BreadcrumbNavProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-4 text-sm">
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.id ?? "home"} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="size-4 text-muted-foreground" />
          )}
          <button
            type="button"
            onClick={() => onNavigate(crumb.id, crumb.name)}
            className={`hover:underline ${
              index === breadcrumbs.length - 1
                ? "font-medium text-foreground"
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
  );
}

// ============================================================================
// Search Results Indicator
// ============================================================================

interface SearchIndicatorProps {
  searchQuery: string;
  totalItems?: number;
  onClear: () => void;
}

export function SearchIndicator({
  searchQuery,
  totalItems,
  onClear,
}: SearchIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-2 py-4 text-sm text-muted-foreground">
      <Search className="size-4" />
      <span>
        Showing results for &quot;{searchQuery}&quot;
        {totalItems !== undefined && ` (${totalItems} items)`}
      </span>
      <Button variant="link" size="sm" className="h-auto p-0" onClick={onClear}>
        Clear search
      </Button>
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

interface EmptyFilesStateProps {
  isSearching: boolean;
  searchQuery: string;
  onCreateFolder: () => void;
  onUpload: () => void;
}

export function EmptyFilesState({
  isSearching,
  searchQuery,
  onCreateFolder,
  onUpload,
}: EmptyFilesStateProps) {
  return (
    <Empty>
      <EmptyMedia variant="icon">
        {isSearching ? <Search /> : <FolderOpen />}
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{isSearching ? "No Results Found" : "No Files"}</EmptyTitle>
        <EmptyDescription>
          {isSearching
            ? `No files or folders match "${searchQuery}".`
            : "This folder is empty. Upload files or create a new folder."}
        </EmptyDescription>
      </EmptyHeader>
      {!isSearching && (
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCreateFolder}>
            <FolderOpen className="mr-2 size-4" />
            New Folder
          </Button>
          <Button onClick={onUpload}>
            <FolderOpen className="mr-2 size-4" />
            Upload Files
          </Button>
        </div>
      )}
    </Empty>
  );
}
