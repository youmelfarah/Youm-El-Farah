import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Role = "ADMIN" | "PROVIDER" | "VISITOR";

export class AuthError extends Error {
  constructor(
    public code: "UNAUTHENTICATED" | "FORBIDDEN" | "PHONE_NOT_VERIFIED",
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Single source of truth for activating/deactivating a user.
 * Keeps `isActive` and Better Auth admin plugin's `banned`/`banReason`/`banExpires`
 * strictly in sync inside one transaction, and revokes all existing sessions
 * immediately on deactivation.
 */
export async function setUserActiveStatus(params: {
  userId: string;
  isActive: boolean;
  banReason?: string | null;
}) {
  const { userId, isActive, banReason } = params;

  return prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        isActive,
        banned: !isActive,
        banReason: isActive
          ? null
          : (banReason ?? "Account deactivated by admin"),
        banExpires: null,
      },
      select: {
        id: true,
        isActive: true,
        banned: true,
      },
    });

    if (!isActive) {
      await tx.session.deleteMany({
        where: { userId },
      });
    }

    return updatedUser;
  });
}

/**
 * Get the current session. Returns null if not signed in or deactivated.
 * Bypasses cookie cache so deactivation, password changes, and phone verification
 * take effect immediately.
 */
export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });

  if (!session) return null;

  const user = session.user as typeof session.user & {
    isActive?: boolean;
    banned?: boolean | null;
    role?: string;
    mustChangePassword?: boolean;
    phone?: string | null;
    phoneVerifiedAt?: Date | null;
  };

  if (user.isActive === false || user.banned === true) {
    return null;
  }

  return session;
}

/**
 * Require an authenticated user. Redirects to /login in server components,
 * throws AuthError in server actions/route handlers.
 */
export async function requireUser(options?: { isServerAction?: boolean }) {
  const session = await getSession();

  if (!session) {
    if (options?.isServerAction) {
      throw new AuthError("UNAUTHENTICATED", "يجب تسجيل الدخول");
    }
    redirect("/login");
  }

  return session;
}

/**
 * Require specific role(s). Redirects in callers or throws AuthError.
 */
export async function requireRole(...roles: Role[]) {
  const session = await requireUser();
  const user = session.user as typeof session.user & {
    role?: string;
  };
  const userRole = (user.role || "VISITOR") as Role;

  if (!roles.includes(userRole)) {
    throw new AuthError("FORBIDDEN", "ليس لديك صلاحية للوصول");
  }

  return session;
}

/**
 * Server action variant of requireRole that throws instead of redirecting.
 */
export async function requireRoleAction(...roles: Role[]) {
  const session = await requireUser({ isServerAction: true });
  const user = session.user as typeof session.user & {
    role?: string;
  };
  const userRole = (user.role || "VISITOR") as Role;

  if (!roles.includes(userRole)) {
    throw new AuthError("FORBIDDEN", "ليس لديك صلاحية للوصول");
  }

  return session;
}

/**
 * Require phone to be verified. Throws AuthError if not.
 */
export async function requirePhoneVerified() {
  const session = await requireUser({ isServerAction: true });
  const user = session.user as typeof session.user & {
    phoneVerifiedAt?: Date | null;
  };

  if (!user.phoneVerifiedAt) {
    throw new AuthError("PHONE_NOT_VERIFIED", "يجب التحقق من رقم الهاتف أولاً");
  }

  return session;
}
