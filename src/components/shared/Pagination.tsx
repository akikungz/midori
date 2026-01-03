"use client";

import { Button } from "@midori/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageInfo?: boolean;
  totalItems?: number;
  className?: string;
}

/**
 * A reusable pagination component with Previous/Next buttons
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  showPageInfo = true,
  totalItems,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        <ChevronLeft className="mr-1 size-4" />
        Previous
      </Button>
      {showPageInfo && (
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
          {totalItems !== undefined && ` (${totalItems} items)`}
        </span>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
      >
        Next
        <ChevronRight className="ml-1 size-4" />
      </Button>
    </div>
  );
}
