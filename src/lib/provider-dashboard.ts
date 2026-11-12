import { redirect } from "next/navigation";
import type { Provider } from "@prisma/client";
import {
  AuthError,
  getSession,
  requireRole,
  requireRoleAction,
} from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

/**
 * Server Component guard for /dashboard pages.
 * Calls requireRole("PROVIDER") and handles role/password redirects cleanly.
 */
export async function requireProviderPage() {
  let session;
  try {
    session = await requireRole("PROVIDER");
  } catch (err) {
    if (err instanceof AuthError && err.code === "FORBIDDEN") {
      const current = await getSession();
      const role = (current?.user as { role?: string } | undefined)?.role;
      if (role === "ADMIN") {
        redirect("/admin");
      }
      redirect("/unauthorized");
    }
    throw err;
  }

  const user = session.user as typeof session.user & {
    mustChangePassword?: boolean;
  };
  if (user.mustChangePassword) {
    redirect("/account/change-password");
  }

  return session;
}

/**
 * Loads the authenticated provider's own Provider record for sub-pages.
 * Redirects to /dashboard if onboarding is not completed yet.
 */
export async function requireOwnedProviderPage() {
  const session = await requireProviderPage();
  const provider = await prisma.provider.findUnique({
    where: { userId: session.user.id },
  });

  if (!provider) {
    redirect("/dashboard");
  }

  return { session, provider };
}

export type OwnedProviderActionResult =
  | { ok: true; userId: string; provider: Provider }
  | { ok: false; error: string };

/**
 * Server Action guard: requires PROVIDER role, verifies Provider ownership via session.user.id,
 * and rejects all mutations when provider status is SUSPENDED.
 */
export async function requireOwnedProviderAction(): Promise<OwnedProviderActionResult> {
  let session;
  try {
    session = await requireRoleAction("PROVIDER");
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false, error: err.message };
    }
    return { ok: false, error: "غير مصرح لك بهذا الإجراء" };
  }

  const provider = await prisma.provider.findUnique({
    where: { userId: session.user.id },
  });

  if (!provider) {
    return { ok: false, error: "يجب إكمال بيانات التسجيل أولاً" };
  }

  if (provider.status === "SUSPENDED") {
    return { ok: false, error: "تم إيقاف حسابك، تواصل مع الإدارة" };
  }

  return { ok: true, userId: session.user.id, provider };
}

