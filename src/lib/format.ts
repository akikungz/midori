import { format } from "date-fns";
import type { ApiDate } from "@midori/types/admin";

/**
 * Format an API date to a human-readable string
 */
export function formatDate(
  date: ApiDate | undefined,
  formatString = "MMM d, yyyy",
): string {
  if (!date || typeof date === "object") return "N/A";
  return format(new Date(date), formatString);
}

/**
 * Format a date for use in an HTML date input
 */
export function formatDateForInput(date: ApiDate): string {
  if (!date || typeof date === "object") return "";
  return format(new Date(date), "yyyy-MM-dd");
}

/**
 * Format bytes to a human-readable size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format a date with time
 */
export function formatDateTime(date: ApiDate | undefined): string {
  if (!date || typeof date === "object") return "N/A";
  return new Date(date as string | number).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get initials from a name string
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Generate a unique ID for use in upload files, etc.
 */
export function generateUniqueId(prefix = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
