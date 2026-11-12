import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
  APIError,
  createAuthMiddleware,
  getAuthoritativeSessionFromCtx,
} from "better-auth/api";
import { admin } from "better-auth/plugins";
import { ac, authRoles } from "@/lib/auth-permissions";
import { prisma } from "@/lib/prisma";

const VALID_ROLES = new Set(["ADMIN", "PROVIDER", "VISITOR"]);

function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = email?.trim().toLowerCase();
  return trimmed || null;
}

function isAdminEmailMatch(email: string | null | undefined): boolean {
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL);
  const candidate = normalizeEmail(email);
  return Boolean(adminEmail && candidate && candidate === adminEmail);
}

function isVerifiedAdminIdentity(
  email: string | null | undefined,
  emailVerified: boolean | null | undefined
): boolean {
  return isAdminEmailMatch(email) && emailVerified === true;
}

function extractTargetUserId(
  context: {
    body?: unknown;
    context?: { session?: { user?: { id?: string } } | null };
  } | null
): string | null {
  const body = context?.body as { userId?: unknown } | undefined;
  if (body && typeof body.userId === "string" && body.userId.length > 0) {
    return body.userId;
  }
  const sessionUserId = context?.context?.session?.user?.id;
  if (typeof sessionUserId === "string" && sessionUserId.length > 0) {
    return sessionUserId;
  }
  return null;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: process.env.BETTER_AUTH_URL
    ? [process.env.BETTER_AUTH_URL]
    : [],

  disabledPaths: ["/admin/impersonate-user", "/admin/stop-impersonating"],

  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "VISITOR",
        input: false,
      },
      mustChangePassword: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
      phone: {
        type: "string",
        required: false,
        input: false,
      },
      phoneVerifiedAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },

  advanced: {
    cookiePrefix: "youm-el-farah",
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: "memory",
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 5,
      },
      "/sign-in/social": {
        window: 60,
        max: 10,
      },
    },
  },

  plugins: [
    admin({
      defaultRole: "VISITOR",
      adminRoles: ["ADMIN"],
      ac,
      roles: authRoles,
      allowImpersonatingAdmins: false,
      bannedUserMessage: "تم تعطيل هذا الحساب",
    }),
  ],

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (
        ctx.path === "/admin/impersonate-user" ||
        ctx.path === "/admin/stop-impersonating"
      ) {
        throw APIError.from("NOT_FOUND", {
          message: "Not Found",
          code: "ENDPOINT_DISABLED",
        });
      }

      if (ctx.path.startsWith("/admin")) {
        const session = await getAuthoritativeSessionFromCtx(ctx);
        if (!session?.session) {
          throw APIError.from("UNAUTHORIZED", {
            message: "Unauthorized",
            code: "UNAUTHORIZED",
          });
        }

        const sessionUser = session.user as {
          role?: string;
          isActive?: boolean;
          banned?: boolean | null;
        };

        if (
          sessionUser.role !== "ADMIN" ||
          sessionUser.isActive === false ||
          sessionUser.banned
        ) {
          throw APIError.from("FORBIDDEN", {
            message: "Forbidden",
            code: "FORBIDDEN",
          });
        }
      }
    }),
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          if (ctx?.path === "/admin/create-user") {
            if (user.role !== undefined && user.role !== "PROVIDER") {
              throw APIError.from("FORBIDDEN", {
                message: "Admin-created accounts must only ever be PROVIDER",
                code: "FORBIDDEN",
              });
            }
            if (isAdminEmailMatch(user.email)) {
              throw APIError.from("FORBIDDEN", {
                message: "Cannot create ADMIN account via admin endpoint",
                code: "FORBIDDEN",
              });
            }
            return {
              data: {
                ...user,
                role: "PROVIDER",
                isActive: true,
                banned: false,
                banReason: null,
                banExpires: null,
              },
            };
          }

          if (isVerifiedAdminIdentity(user.email, user.emailVerified)) {
            return {
              data: {
                ...user,
                role: "ADMIN",
                emailVerified: true,
                isActive: true,
                banned: false,
                banReason: null,
                banExpires: null,
              },
            };
          }

          // All other self-registered accounts (e.g. Google OAuth) become VISITOR
          return {
            data: {
              ...user,
              role: "VISITOR",
              isActive: true,
              banned: false,
              banReason: null,
              banExpires: null,
              mustChangePassword: false,
            },
          };
        },
      },
      update: {
        before: async (data, ctx) => {
          const nextData: Record<string, unknown> = { ...data };
          const targetUserId = extractTargetUserId(ctx);
          const targetUser = targetUserId
            ? await prisma.user.findUnique({
                where: { id: targetUserId },
                select: {
                  email: true,
                  emailVerified: true,
                  role: true,
                },
              })
            : null;

          if (data.role !== undefined) {
            if (typeof data.role !== "string" || !VALID_ROLES.has(data.role)) {
              throw APIError.from("BAD_REQUEST", {
                message: "Invalid role value",
                code: "INVALID_ROLE",
              });
            }

            if (data.role === "ADMIN") {
              const effectiveEmail =
                typeof data.email === "string" ? data.email : targetUser?.email;
              const effectiveVerified =
                typeof data.emailVerified === "boolean"
                  ? data.emailVerified
                  : targetUser?.emailVerified;

              if (!isVerifiedAdminIdentity(effectiveEmail, effectiveVerified)) {
                throw APIError.from("FORBIDDEN", {
                  message:
                    "Only the verified ADMIN_EMAIL user can hold the ADMIN role",
                  code: "FORBIDDEN",
                });
              }
            }
          }

          // Prevent demoting verification/changing email of an active ADMIN away from ADMIN_EMAIL
          const effectiveRole =
            typeof data.role === "string" ? data.role : targetUser?.role;
          if (
            effectiveRole === "ADMIN" &&
            (data.email !== undefined || data.emailVerified !== undefined)
          ) {
            const effectiveEmail =
              typeof data.email === "string" ? data.email : targetUser?.email;
            const effectiveVerified =
              typeof data.emailVerified === "boolean"
                ? data.emailVerified
                : targetUser?.emailVerified;
            if (!isVerifiedAdminIdentity(effectiveEmail, effectiveVerified)) {
              throw APIError.from("FORBIDDEN", {
                message: "ADMIN user must remain verified with ADMIN_EMAIL",
                code: "FORBIDDEN",
              });
            }
          }

          // Keep isActive and banned/banReason/banExpires strictly in sync
          if (typeof data.isActive === "boolean") {
            nextData.banned = !data.isActive;
            nextData.banReason = data.isActive
              ? null
              : typeof data.banReason === "string"
                ? data.banReason
                : "Account deactivated by admin";
            nextData.banExpires = null;
          } else if (typeof data.banned === "boolean") {
            nextData.isActive = !data.banned;
            nextData.banReason = data.banned
              ? typeof data.banReason === "string"
                ? data.banReason
                : "Account deactivated by admin"
              : null;
            nextData.banExpires = null;
          }

          return { data: nextData };
        },
        after: async (user) => {
          const u = user as {
            id?: string;
            isActive?: boolean;
            banned?: boolean | null;
          };
          if (u?.id && (u.isActive === false || u.banned === true)) {
            await prisma.session.deleteMany({
              where: { userId: u.id },
            });
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { isActive: true, banned: true },
          });
          if (!user || !user.isActive || user.banned) {
            throw APIError.from("FORBIDDEN", {
              message: "تم تعطيل هذا الحساب",
              code: "ACCOUNT_DEACTIVATED",
            });
          }
          return { data: session };
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
