/**
 * Shared types for admin components
 */

import type { components } from "@midori/types/api";

type SchemaName = keyof components["schemas"];
type Schema<T extends SchemaName> = components["schemas"][T];
type PaginatedValue<T extends SchemaName> = Schema<T> extends {
  values: readonly (infer Item)[];
}
  ? Item
  : never;

// Date type that can come from API in various formats
export type ApiDate = Record<string, never> | string | number;

// Course related types
export type Course = PaginatedValue<"GetCoursesResponse">;
export type CourseDetails = Schema<"GetCourseByIdResponse">;

// Instructor related types
export type Instructor = PaginatedValue<"GetInstructorsResponse">;

// Semester related types
export type Semester = PaginatedValue<"GetSemestersResponse">;
export type SemesterDetails = Schema<"GetSemesterByIdResponse">;

// Mailing list types
export interface MailingListEntry {
  id: number;
  email: string;
  createdAt?: ApiDate;
}

// Instance related types
export type InstanceStatus =
  | "PENDING"
  | "ACTIVE"
  | "PROMOTED"
  | "INACTIVE"
  | "DELETED";

export interface VmDetails {
  hostname: string;
  ip: string;
  os: string;
  cpus: number;
  memoryMB: number;
  diskGB: number;
}

export interface CourseOffering {
  courseCode: string;
  courseTitle: string;
  semester: string;
}

export interface Instance {
  id: number;
  status: InstanceStatus;
  vmDetails?: VmDetails;
  courseOffering?: CourseOffering;
  createdAt?: ApiDate;
  updatedAt?: ApiDate;
}

export interface ReverseProxy {
  id: number;
  targetPort: number;
  type: "HTTP" | "HTTPS";
  description?: string;
}

export interface AuditLog {
  id: number;
  action: string;
  notes?: string;
  timestamp?: ApiDate;
}

// Request related types
export type RequestStatus =
  Schema<"GetRequestsResponse">["values"][number]["status"];
export type RequestSpecs =
  Schema<"GetRequestsResponse">["values"][number]["specs"];
export type InstanceRequest = PaginatedValue<"GetRequestsResponse">;
export type ExtendedRequest = PaginatedValue<"GetExtendedRequestsResponse">;

// Storage related types
export type FileType = "FILE" | "FOLDER";
export type FileVisibility = Schema<"StorageFilePermissionItem">["permission"];
export type FileData = PaginatedValue<"StorageFileListResponse">;
export type FilePermission = Schema<"StorageFilePermissionItem">;
export type FileVersion = Schema<"StorageFileVersionItem">;
export type FileDetails = Schema<"StorageFileDetailResponse">;

export interface BreadcrumbItem {
  id: string | null;
  name: string;
}

export type UploadStatus = "pending" | "uploading" | "completed" | "error";

export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: UploadStatus;
  error?: string;
}
