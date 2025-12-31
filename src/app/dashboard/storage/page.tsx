"use client";

import { useState } from "react";
import {
  FolderOpen,
  Upload,
  Download,
  Trash2,
  FolderPlus,
  File,
  MoreVertical,
  Search,
  Grid,
  List,
} from "lucide-react";

import { api } from "@midori/lib/api";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midori/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@midori/components/ui/field";
import { Tabs, TabsList, TabsTrigger } from "@midori/components/ui/tabs";

export default function StoragePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);

  const { data, isLoading } = api.useQuery("get", "/api/storage/files", {
    params: {
      query: {
        parentId: currentParentId,
      },
    },
  });

  const files = data?.values || [];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  if (isLoading) {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Storage</h1>
          <p className="text-muted-foreground">
            Manage your files and documents
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="mr-2 size-4" />
                New Folder
              </Button>
            </DialogTrigger>
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
                  <Input id="folder-name" placeholder="My Folder" />
                </Field>
                <Button className="w-full">Create Folder</Button>
              </FieldGroup>
            </DialogContent>
          </Dialog>
          <Button>
            <Upload className="mr-2 size-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search files..." className="pl-9" />
        </div>
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

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => setCurrentParentId(null)}
          className="text-primary hover:underline"
        >
          Home
        </button>
        {currentParentId && (
          <>
            <span className="text-muted-foreground">/</span>
            <span>Current Folder</span>
          </>
        )}
      </div>

      {/* Files */}
      {files.length === 0 ? (
        <Empty>
          <EmptyMedia variant="icon">
            <FolderOpen />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyTitle>No Files</EmptyTitle>
            <EmptyDescription>
              This folder is empty. Upload files or create a new folder.
            </EmptyDescription>
          </EmptyHeader>
          <Button>
            <Upload className="mr-2 size-4" />
            Upload Files
          </Button>
        </Empty>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {files.map((file) => (
            <Card
              key={file.id}
              className="group cursor-pointer transition-colors hover:border-primary/50"
              onClick={() => {
                if (file.type === "FOLDER") {
                  setCurrentParentId(file.id);
                }
              }}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {file.type === "FOLDER" ? (
                      <FolderOpen className="size-8 text-primary" />
                    ) : (
                      <File className="size-8 text-muted-foreground" />
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Download className="mr-2 size-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="truncate text-sm">{file.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {file.type === "FOLDER"
                    ? "Folder"
                    : formatFileSize(file.sizeBytes)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            // biome-ignore lint/a11y/noStaticElementInteractions: false positive
            // biome-ignore lint/a11y/useKeyWithClickEvents: false positive
            <div
              key={file.id}
              className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:border-primary/50 cursor-pointer"
              onClick={() => {
                if (file.type === "FOLDER") {
                  setCurrentParentId(file.id);
                }
              }}
            >
              <div className="flex items-center gap-3">
                {file.type === "FOLDER" ? (
                  <FolderOpen className="size-5 text-primary" />
                ) : (
                  <File className="size-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.type === "FOLDER"
                      ? "Folder"
                      : formatFileSize(file.sizeBytes)}
                  </p>
                </div>
              </div>
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
                  <DropdownMenuItem>
                    <Download className="mr-2 size-4" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
