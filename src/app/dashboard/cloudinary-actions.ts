"use server";

import { z } from "zod";
import {
  createSignedImageUploadPayload,
  type SignedImageUploadPayload,
} from "@/lib/cloudinary";
import { getProviderLimits } from "@/lib/limits";
import { prisma } from "@/lib/prisma";
import { requireOwnedProviderAction } from "@/lib/provider-dashboard";

const signatureRequestSchema = z.object({
  target: z.enum(["logo", "cover", "gallery"]),
});

export async function getCloudinaryUploadSignatureAction(input: {
  target: "logo" | "cover" | "gallery";
}): Promise<{ error?: string; data?: SignedImageUploadPayload }> {
  const authResult = await requireOwnedProviderAction();
  if (!authResult.ok) {
    return { error: authResult.error };
  }

  const parsed = signatureRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "نوع الرفع غير صالح" };
  }

  if (parsed.data.target === "gallery") {
    const limits = getProviderLimits(authResult.provider);
    const currentImageCount = await prisma.media.count({
      where: { providerId: authResult.provider.id, type: "IMAGE" },
    });
    if (currentImageCount >= limits.images) {
      return {
        error: `وصلت إلى الحد الأقصى للصور المسموح بها (${limits.images})`,
      };
    }
  }

  try {
    const payload = createSignedImageUploadPayload(authResult.provider.id);
    return { data: payload };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "تعذر تجهيز توقيع الرفع إلى Cloudinary",
    };
  }
}

