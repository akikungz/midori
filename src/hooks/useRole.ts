"use client";

import { useSession } from "@midori/hooks/useSession";
import {
  type Permission,
  type Role,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin as checkIsAdmin,
  isInstructor as checkIsInstructor,
  isStudent as checkIsStudent,
} from "@midori/lib/roles";

/**
 * Hook for role-based permission checks
 * Provides utilities to check user permissions in components
 */
export function useRole() {
  const { role, isLoading, isAuthenticated } = useSession();

  /**
   * Check if user has a specific permission
   */
  const can = (permission: Permission): boolean => {
    if (!role) return false;
    return hasPermission(role, permission);
  };

  /**
   * Check if user has any of the specified permissions
   */
  const canAny = (permissions: Permission[]): boolean => {
    if (!role) return false;
    return hasAnyPermission(role, permissions);
  };

  /**
   * Check if user has all of the specified permissions
   */
  const canAll = (permissions: Permission[]): boolean => {
    if (!role) return false;
    return hasAllPermissions(role, permissions);
  };

  /**
   * Check if user has one of the specified roles
   */
  const hasRole = (roles: Role[]): boolean => {
    if (!role) return false;
    return roles.includes(role);
  };

  return {
    role,
    isLoading,
    isAuthenticated,
    can,
    canAny,
    canAll,
    hasRole,
    isAdmin: role ? checkIsAdmin(role) : false,
    isInstructor: role ? checkIsInstructor(role) : false,
    isStudent: role ? checkIsStudent(role) : false,
  };
}
