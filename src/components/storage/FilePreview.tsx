"use client";

import { useState } from "react";

import { PdfPreview } from "./PdfPreview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@midori/components/ui/dialog";
import { Skeleton } from "@midori/components/ui/skeleton";

interface FilePreviewProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  mimeType?: string;
  downloadUrl?: string;
}

function getFileType(
  mimeType?: string,
): "image" | "video" | "audio" | "pdf" | "unknown" {
  if (!mimeType) return "unknown";

  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType === "application/pdf" ||
    mimeType.includes("pdf")
  ) {
    return "pdf";
  }

  return "unknown";
}

export function FilePreview({
  isOpen,
  onOpenChange,
  fileName,
  mimeType,
  downloadUrl,
}: FilePreviewProps) {
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const fileType = getFileType(mimeType);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="truncate">{fileName}</DialogTitle>
        </DialogHeader>

        {isLoadingContent || !downloadUrl ? (
          <div className="flex items-center justify-center rounded-lg bg-muted p-8">
            <Skeleton className="h-96 w-full" />
          </div>
        ) : fileType === "image" ? (
          <div className="flex items-center justify-center rounded-lg bg-muted p-4">
            {/* biome-ignore lint: Using native img element for file preview with dynamic source */}
            <img
              src={downloadUrl}
              alt={fileName}
              className="max-h-96 max-w-full object-contain"
              onError={() => setIsLoadingContent(false)}
            />
          </div>
        ) : fileType === "video" ? (
          <video
            src={downloadUrl}
            controls
            className="w-full rounded-lg bg-black"
            onLoadedMetadata={() => setIsLoadingContent(false)}
          >
            <track kind="captions" srcLang="en" label="English" />
          </video>
        ) : fileType === "audio" ? (
          <div className="space-y-4 rounded-lg bg-muted p-6">
            <audio
              src={downloadUrl}
              controls
              className="w-full"
              onLoadedMetadata={() => setIsLoadingContent(false)}
            >
              <track kind="captions" srcLang="en" label="English" />
            </audio>
            <p className="text-sm text-muted-foreground">
              Playing: {fileName}
            </p>
          </div>
        ) : fileType === "pdf" ? (
          <PdfPreview fileName={fileName} downloadUrl={downloadUrl} />
        ) : (
          <div className="flex items-center justify-center rounded-lg bg-muted p-8">
            <p className="text-sm text-muted-foreground">
              Preview not available for this file type. Download to view.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
