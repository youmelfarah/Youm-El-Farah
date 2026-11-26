"use server";

import { revalidatePath } from "next/cache";
import type { LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireOwnedProviderAction } from "@/lib/provider-dashboard";
import { updateLeadStatusSchema } from "@/lib/lead-validation";

export async function updateProviderLeadAction(input: {
  leadId: string;
  status: LeadStatus;
  providerNote?: string | null;
}): Promise<{ ok?: boolean; error?: string }> {
  const authResult = await requireOwnedProviderAction();
  if (!authResult.ok) {
    return { error: authResult.error };
  }

  const parsed = updateLeadStatusSchema.safeParse({
    leadId: input.leadId,
    status: input.status,
    providerNote: input.providerNote ?? null,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" };
  }

  const lead = await prisma.lead.findUnique({
    where: { id: parsed.data.leadId },
    select: { id: true, providerId: true },
  });

  if (!lead || lead.providerId !== authResult.provider.id) {
    return { error: "الطلب غير موجود" };
  }

  try {
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        status: parsed.data.status,
        providerNote: parsed.data.providerNote,
      },
    });
  } catch {
    return { error: "تعذر تحديث حالة الطلب" };
  }

  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
  revalidatePath("/account");
  revalidatePath("/admin/leads");
  return { ok: true };
}
