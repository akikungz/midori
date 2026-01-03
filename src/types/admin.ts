/**
 * Shared types for admin components
 */

// Date type that can come from API in various formats
export type ApiDate = Record<string, never> | string | number;

// Course related types
export interface Course {
  id: number;
  code: string;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt?: ApiDate;
  updatedAt?: ApiDate;
}

export interface CourseDetails extends Course {
  instructors?: Instructor[];
  semesters?: Semester[];
}

// Instructor related types
export interface Instructor {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT";
}

// Semester related types
export interface Semester {
  id: number;
  name: string;
  startDate: ApiDate;
  endDate: ApiDate;
  isCurrent: boolean;
  createdAt?: ApiDate;
  updatedAt?: ApiDate;
}

export interface SemesterDetails extends Semester {
  courses?: Course[];
}

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
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface RequestSpecs {
  cpus: number;
  memoryMB: number;
  diskGB: number;
}

export interface InstanceRequest {
  id: number;
  title: string;
  description?: string;
  status: RequestStatus;
  specs: RequestSpecs;
  templateName?: string;
  courseOffering?: CourseOffering;
  createdAt?: ApiDate;
}

export interface ExtendedRequest {
  id: number;
  title: string;
  description?: string;
  reason?: string;
  status: RequestStatus;
  targetInstanceId: number;
  createdAt?: ApiDate;
}

// Storage related types
export type FileType = "FILE" | "FOLDER";
export type FileVisibility = "VIEWER" | "EDITOR" | "OWNER";

export interface FileData {
  id: string;
  name: string;
  type: FileType;
  sizeBytes: number;
  visibility: FileVisibility;
  parentId?: string | null;
  isPublic: boolean;
  createdAt?: ApiDate;
  updatedAt?: ApiDate;
}

export interface FilePermission {
  id: number;
  platformUserId: number;
  permission: FileVisibility;
  user?: {
    name?: string;
    email?: string;
  };
}

export interface FileVersion {
  id: number;
  versionNumber: number;
  sizeBytes: number;
  storagePath: string;
  createdAt?: ApiDate;
}

export interface FileDetails extends FileData {
  path?: string;
  permissions?: FilePermission[];
  versions?: FileVersion[];
}

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
