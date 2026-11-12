import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";

/**
 * Access control statements for Better Auth's admin plugin.
 * Impersonation actions ("impersonate", "impersonate-admins") are intentionally
 * omitted from every role so user impersonation is completely disabled.
 */
export const ac = createAccessControl(defaultStatements);

export const ADMIN = ac.newRole({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "delete",
    "set-password",
    "set-email",
    "set-phone",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
});

export const PROVIDER = ac.newRole({
  user: [],
  session: [],
});

export const VISITOR = ac.newRole({
  user: [],
  session: [],
});

/**
 * Roles keyed to match the Prisma Role enum exactly.
 */
export const authRoles = {
  ADMIN,
  PROVIDER,
  VISITOR,
};

export type AppRole = keyof typeof authRoles;

