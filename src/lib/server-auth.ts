import { redirect } from "next/navigation";

import type { Permission, Role } from "@midori/lib/roles";
import { hasPermission } from "@midori/lib/roles";
import { getServerSession } from "@midori/lib/server-api";

type ServerUser = NonNullable<Awaited<ReturnType<typeof getServerSession>>>;

interface AuthenticatedServerSession {
  user: ServerUser;
  role: Role;
}

export async function requireServerSession(): Promise<AuthenticatedServerSession> {
  const user = await getServerSession();

  if (!user) {
    redirect("/login");
  }

  return {
    user,
    role: user.role as Role,
  };
}

export async function requireServerRole(
  allowedRoles: Role | Role[],
): Promise<AuthenticatedServerSession & { isAllowed: boolean }> {
  const session = await requireServerSession();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return {
    ...session,
    isAllowed: roles.includes(session.role),
  };
}

export async function requireServerPermission(
  permission: Permission,
): Promise<AuthenticatedServerSession & { isAllowed: boolean }> {
  const session = await requireServerSession();

  return {
    ...session,
    isAllowed: hasPermission(session.role, permission),
  };
}
