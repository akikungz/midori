"use client";

import type { PropsWithChildren, ReactNode } from "react";
import { useRole } from "@midori/hooks/useRole";
import type { Permission, Role } from "@midori/lib/roles";

interface RoleGuardProps extends PropsWithChildren {
  /**
   * Allowed roles - user must have one of these roles
   */
  roles?: Role[];
  /**
   * Required permission - user must have this permission
   */
  permission?: Permission;
  /**
   * Required permissions - user must have all of these
   */
  permissions?: Permission[];
  /**
   * Any permissions - user must have at least one of these
   */
  anyPermissions?: Permission[];
  /**
   * Fallback to render if access is denied
   */
  fallback?: ReactNode;
  /**
   * Show loading state while checking permissions
   */
  showLoading?: boolean;
}

/**
 * Component for role-based UI protection
 * Renders children only if user has required role/permissions
 *
 * @example
 * // Require specific roles
 * <RoleGuard roles={["ADMIN", "INSTRUCTOR"]}>
 *   <AdminPanel />
 * </RoleGuard>
 *
 * @example
 * // Require specific permission
 * <RoleGuard permission="MANAGE_COURSES">
 *   <CourseEditor />
 * </RoleGuard>
 *
 * @example
 * // With fallback
 * <RoleGuard roles={["ADMIN"]} fallback={<AccessDenied />}>
 *   <AdminDashboard />
 * </RoleGuard>
 */
export function RoleGuard({
  children,
  roles,
  permission,
  permissions,
  anyPermissions,
  fallback = null,
  showLoading = false,
}: RoleGuardProps) {
  const { role, isLoading, can, canAll, canAny, hasRole } = useRole();

  // Show loading state if requested
  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Still loading, don't render anything
  if (isLoading) {
    return null;
  }

  // Not authenticated
  if (!role) {
    return <>{fallback}</>;
  }

  // Check role requirement
  if (roles && !hasRole(roles)) {
    return <>{fallback}</>;
  }

  // Check single permission
  if (permission && !can(permission)) {
    return <>{fallback}</>;
  }

  // Check all permissions
  if (permissions && !canAll(permissions)) {
    return <>{fallback}</>;
  }

  // Check any permission
  if (anyPermissions && !canAny(anyPermissions)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Props for creating a role-protected page component
 */
interface WithRoleCheckOptions {
  roles?: Role[];
  permission?: Permission;
  redirectTo?: string;
}

/**
 * Higher-order component for protecting entire pages
 * Redirects to login or shows forbidden if access denied
 *
 * @example
 * export default withRoleCheck(AdminPage, {
 *   roles: ["ADMIN"],
 *   redirectTo: "/dashboard"
 * });
 */
export function withRoleCheck<P extends object>(
  Component: React.ComponentType<P>,
  options: WithRoleCheckOptions
) {
  return function ProtectedComponent(props: P) {
    return (
      <RoleGuard
        roles={options.roles}
        permission={options.permission}
        fallback={
          <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
            <div className="text-6xl">🚫</div>
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </div>
        }
        showLoading
      >
        <Component {...props} />
      </RoleGuard>
    );
  };
}
