"use server";

import { revalidatePath } from "next/cache";
import { AuthError, requireRoleAction } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { visibleProviderWhere } from "@/lib/provider-visibility";
import { dateStringToPrismaDate } from "@/lib/calendar-dates";
import { createLeadSchema } from "@/lib/lead-validation";
import { RATE_LIMITS, sinceWindowDate } from "@/lib/rate-limit";
import { sendLeadCreatedWebhook } from "@/lib/lead-webhook";

export async function submitLeadAction(input: {
  providerId: string;
  name: string;
  phone: string;
  weddingDate?: string | null;
  offerId?: string | null;
  message?: string | null;
  website?: string;
}): Promise<{
  ok?: boolean;
  error?: string;
  code?: string;
  message?: string;
}> {
  let session;
  try {
    session = await requireRoleAction("VISITOR");
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        error:
          err.code === "UNAUTHENTICATED"
            ? "سجّلي دخولك بجوجل علشان تكملي"
            : "طلبات عروض الأسعار متاحة لحسابات الزائرات فقط",
        code: err.code,
      };
    }
    return { error: "يجب تسجيل الدخول أولاً", code: "UNAUTHENTICATED" };
  }

  const parsed = createLeadSchema().safeParse({
    providerId: input.providerId,
    name: input.name,
    phone: input.phone,
    weddingDate: input.weddingDate ?? null,
    offerId: input.offerId ?? null,
    message: input.message ?? null,
    website: input.website ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات الطلب غير صالحة" };
  }

  const provider = await prisma.provider.findFirst({
    where: {
      id: parsed.data.providerId,
      ...visibleProviderWhere(),
    },
    select: {
      id: true,
      slug: true,
      name: true,
      userId: true,
    },
  });

  if (!provider) {
    return { error: "مقدم الخدمة غير متاح حالياً" };
  }

  if (provider.userId === session.user.id) {
    return { error: "لا يمكنك إرسال طلب عرض سعر لحسابك الخاص" };
  }

  let validatedOffer: { id: string; title: string } | null = null;
  if (parsed.data.offerId) {
    validatedOffer = await prisma.offer.findFirst({
      where: {
        id: parsed.data.offerId,
        providerId: provider.id,
        isActive: true,
      },
      select: { id: true, title: true },
    });
    if (!validatedOffer) {
      return { error: "الباقة المختارة غير متاحة حالياً" };
    }
  }

  const since24h = sinceWindowDate(RATE_LIMITS.LEAD_SUBMISSION_24H.windowMs);
  const [totalLeads24h, providerLeads24h] = await Promise.all([
    prisma.lead.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: since24h },
      },
    }),
    prisma.lead.count({
      where: {
        userId: session.user.id,
        providerId: provider.id,
        createdAt: { gte: since24h },
      },
    }),
  ]);

  if (providerLeads24h >= RATE_LIMITS.LEAD_PER_PROVIDER_24H.max) {
    return {
      error: "لقد أرسلتِ طلباً لمقدم الخدمة هذا خلال آخر 24 ساعة.",
    };
  }

  if (totalLeads24h >= RATE_LIMITS.LEAD_SUBMISSION_24H.max) {
    return {
      error: `وصلتِ للحد الأقصى للطلبات اليومية (${RATE_LIMITS.LEAD_SUBMISSION_24H.max} طلبات خلال 24 ساعة).`,
    };
  }

  const createdLead = await prisma.lead.create({
    data: {
      providerId: provider.id,
      userId: session.user.id,
      name: parsed.data.name,
      phone: parsed.data.phone,
      weddingDate: parsed.data.weddingDate
        ? dateStringToPrismaDate(parsed.data.weddingDate)
        : null,
      offerId: validatedOffer?.id ?? null,
      message: parsed.data.message,
      status: "NEW",
    },
    select: {
      id: true,
      createdAt: true,
    },
  });

  // Non-blocking outbound webhook
  void sendLeadCreatedWebhook({
    event: "lead.created",
    leadId: createdLead.id,
    providerId: provider.id,
    providerSlug: provider.slug,
    providerName: provider.name,
    offerId: validatedOffer?.id ?? null,
    offerTitle: validatedOffer?.title ?? null,
    weddingDate: parsed.data.weddingDate,
    createdAt: createdLead.createdAt.toISOString(),
  });

  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
  revalidatePath("/account");
  revalidatePath("/admin/leads");

  return {
    ok: true,
    message: `وصل طلبك لـ ${provider.name}. هيتواصلوا معاكِ على الرقم اللي كتبتيه.`,
  };
}
