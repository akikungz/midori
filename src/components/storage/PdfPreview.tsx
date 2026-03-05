"use client";

import { Button } from "@midori/components/ui/button";

interface PdfPreviewProps {
  fileName: string;
  downloadUrl?: string;
}

export function PdfPreview({ fileName, downloadUrl }: PdfPreviewProps) {
  if (!downloadUrl) {
    return (
      <div className="flex items-center justify-center rounded-lg bg-muted p-8">
        <p className="text-sm text-muted-foreground">
          PDF preview is loading...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border bg-muted">
        <iframe
          src={downloadUrl}
          title={`PDF preview for ${fileName}`}
          className="h-[55vh] w-full sm:h-[70vh]"
        />
      </div>

      <Button asChild className="w-full">
        <a href={downloadUrl} target="_blank" rel="noopener noreferrer">
          Open PDF in new tab
        </a>
      </Button>
    </div>
  );
}
