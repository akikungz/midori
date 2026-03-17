/**
 * Role-Based Access Control (RBAC) utilities
 * Defines roles, permissions, and helper functions for access control
 */

export type Role = "ADMIN" | "INSTRUCTOR" | "STUDENT";

/**
 * Permission definitions mapped to allowed roles
 * Each permission key maps to an array of roles that have that permission
 */
export const PERMISSIONS = {
  // User Management
  VIEW_OWN_PROFILE: ["STUDENT", "INSTRUCTOR", "ADMIN"] as const,
  MANAGE_SSH_KEYS: ["STUDENT", "INSTRUCTOR", "ADMIN"] as const,

  // Instances
  VIEW_OWN_INSTANCES: ["STUDENT", "INSTRUCTOR", "ADMIN"] as const,
  VIEW_INSTRUCTOR_INSTANCES: ["INSTRUCTOR", "ADMIN"] as const,
  VIEW_ALL_INSTANCES: ["ADMIN"] as const,
  CREATE_INSTANCE: ["INSTRUCTOR", "ADMIN"] as const,
  DELETE_INSTANCE: ["INSTRUCTOR", "ADMIN"] as const,
  PROMOTE_INSTANCE: ["INSTRUCTOR", "ADMIN"] as const,
  MANAGE_REVERSE_PROXY: ["STUDENT", "INSTRUCTOR", "ADMIN"] as const,

  // Requests
  CREATE_REQUEST: ["STUDENT"] as const,
  VIEW_OWN_REQUESTS: ["STUDENT", "INSTRUCTOR", "ADMIN"] as const,
  REVIEW_REQUEST: ["INSTRUCTOR", "ADMIN"] as const,

  // Extended Requests
  CREATE_EXTENDED_REQUEST: ["STUDENT"] as const,
  REVIEW_EXTENDED_REQUEST: ["INSTRUCTOR", "ADMIN"] as const,

  // Academic Management
  VIEW_COURSES: ["INSTRUCTOR", "ADMIN"] as const,
  MANAGE_COURSES: ["ADMIN"] as const,
  VIEW_SEMESTERS: ["INSTRUCTOR", "ADMIN"] as const,
  MANAGE_SEMESTERS: ["ADMIN"] as const,
  VIEW_INSTRUCTORS: ["ADMIN"] as const,
  MANAGE_INSTRUCTORS: ["ADMIN"] as const,
  MANAGE_MAILING_LIST: ["ADMIN"] as const,

  // Storage
  ACCESS_STORAGE: ["INSTRUCTOR", "ADMIN"] as const,
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return (allowedRoles as readonly string[]).includes(role);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(
  role: Role,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(
  role: Role,
  permissions: Permission[],
): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Check if the role is ADMIN
 */
export function isAdmin(role: Role): boolean {
  return role === "ADMIN";
}

/**
 * Check if the role is INSTRUCTOR or higher (ADMIN)
 */
export function isInstructor(role: Role): boolean {
  return role === "INSTRUCTOR" || role === "ADMIN";
}

/**
 * Check if the role is STUDENT (base role)
 */
export function isStudent(role: Role): boolean {
  return role === "STUDENT";
}

/**
 * Get the display name for a role
 */
export function getRoleDisplayName(role: Role): string {
  const displayNames: Record<Role, string> = {
    ADMIN: "Administrator",
    INSTRUCTOR: "Instructor",
    STUDENT: "Student",
  };
  return displayNames[role];
}

/**
 * Get role badge color classes for UI
 */
export function getRoleBadgeVariant(
  role: Role,
): "default" | "secondary" | "destructive" | "outline" {
  const variants: Record<
    Role,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    ADMIN: "destructive",
    INSTRUCTOR: "default",
    STUDENT: "secondary",
  };
  return variants[role];
}
