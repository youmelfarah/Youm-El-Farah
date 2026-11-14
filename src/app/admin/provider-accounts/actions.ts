"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { requireRoleAction, setUserActiveStatus } from "@/lib/auth-helpers";
import { randomBytes } from "crypto";

const createProviderSchema = z.object({
  name: z.string().trim().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100),
  email: z.string().trim().email("بريد إلكتروني غير صالح"),
  password: z
    .string()
    .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
    .max(128, "كلمة المرور طويلة جداً"),
});

const userIdSchema = z.object({
  userId: z.string().trim().min(1, "معرف المستخدم غير صالح"),
});

export async function createProviderAction(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ error?: string; temporaryPassword?: string }> {
  let session;
  try {
    session = await requireRoleAction("ADMIN");
  } catch {
    return { error: "ليس لديك صلاحية للوصول" };
  }

  const parsed = createProviderSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const email = parsed.data.email.toLowerCase();

  // Check if email is already taken
  const existing = await prisma.user.findUnique({
    where: { email },
  });
  if (existing) {
    return { error: "البريد الإلكتروني مستخدم بالفعل" };
  }

  try {
    // Use Better Auth's createUser API to ensure password hashing is compatible.
    // Database hooks enforce that admin-created accounts can only ever be PROVIDER.
    await auth.api.createUser({
      headers: await headers(),
      body: {
        email,
        password: parsed.data.password,
        name: parsed.data.name,
        role: "PROVIDER",
        data: {
          mustChangePassword: true,
          isActive: true,
          emailVerified: true,
        },
      },
    });

    // Ensure non-input additionalFields and audit log are persisted in one transaction
    await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { email },
        data: {
          role: "PROVIDER",
          mustChangePassword: true,
          emailVerified: true,
          isActive: true,
          banned: false,
          banReason: null,
          banExpires: null,
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "account.create",
          entityType: "User",
          entityId: u.id,
          details: {
            name: u.name,
            email: u.email,
            role: "PROVIDER",
          },
        },
      });
    });

    return { temporaryPassword: parsed.data.password };
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (message.includes("duplicate") || message.includes("unique")) {
      return { error: "البريد الإلكتروني مستخدم بالفعل" };
    }
    return { error: "حدث خطأ أثناء إنشاء الحساب" };
  }
}

export async function resetProviderPasswordAction(input: {
  userId: string;
}): Promise<{ error?: string; temporaryPassword?: string }> {
  let session;
  try {
    session = await requireRoleAction("ADMIN");
  } catch {
    return { error: "ليس لديك صلاحية للوصول" };
  }

  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "بيانات غير صالحة" };
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { role: true, email: true },
  });

  if (!user || user.role !== "PROVIDER") {
    return { error: "الحساب غير موجود" };
  }

  const tempPassword = generateStrongPassword();
  const requestHeaders = await headers();

  try {
    await auth.api.setUserPassword({
      headers: requestHeaders,
      body: {
        userId: parsed.data.userId,
        newPassword: tempPassword,
      },
    });

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: parsed.data.userId },
        data: { mustChangePassword: true },
      });

      const provider = await tx.provider.findUnique({
        where: { userId: parsed.data.userId },
        select: { id: true },
      });

      await tx.auditLog.create({
        data: {
          adminId: session.user.id,
          action: "account.reset_password",
          entityType: "User",
          entityId: parsed.data.userId,
          providerId: provider?.id ?? null,
          details: {
            email: user.email,
          },
        },
      });
    });

    await auth.api.revokeUserSessions({
      headers: requestHeaders,
      body: { userId: parsed.data.userId },
    });

    return { temporaryPassword: tempPassword };
  } catch {
    return { error: "حدث خطأ أثناء إعادة تعيين كلمة المرور" };
  }
}

export async function toggleProviderActiveAction(input: {
  userId: string;
}): Promise<{ error?: string; isActive?: boolean }> {
  let session;
  try {
    session = await requireRoleAction("ADMIN");
  } catch {
    return { error: "ليس لديك صلاحية للوصول" };
  }

  const parsed = userIdSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "بيانات غير صالحة" };
  }

  if (parsed.data.userId === session.user.id) {
    return { error: "لا يمكنك تعطيل حسابك الخاص" };
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { role: true, isActive: true, email: true },
  });

  if (!user || user.role !== "PROVIDER") {
    return { error: "الحساب غير موجود" };
  }

  const newIsActive = !user.isActive;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: parsed.data.userId },
      data: {
        isActive: newIsActive,
        banned: !newIsActive,
        banReason: newIsActive ? null : "Account deactivated by admin",
        banExpires: null,
      },
    });

    if (!newIsActive) {
      await tx.session.deleteMany({
        where: { userId: parsed.data.userId },
      });
    }

    const provider = await tx.provider.findUnique({
      where: { userId: parsed.data.userId },
      select: { id: true },
    });

    await tx.auditLog.create({
      data: {
        adminId: session.user.id,
        action: "account.toggle_active",
        entityType: "User",
        entityId: parsed.data.userId,
        providerId: provider?.id ?? null,
        details: {
          email: user.email,
          before: { isActive: user.isActive },
          after: { isActive: newIsActive },
        },
      },
    });
  });

  return { isActive: newIsActive };
}

export async function listProvidersAction(): Promise<{
  providers: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    mustChangePassword: boolean;
    createdAt: string;
  }[];
}> {
  try {
    await requireRoleAction("ADMIN");
  } catch {
    return { providers: [] };
  }

  const providers = await prisma.user.findMany({
    where: { role: "PROVIDER" },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    providers: providers.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

function generateStrongPassword(length: number = 16): string {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  const bytes = randomBytes(length);
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}
