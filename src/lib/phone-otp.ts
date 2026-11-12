import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendOtpSms } from "@/lib/sms";
import { normalizeEgyptianPhone } from "@/lib/validation";

const OTP_TTL_SECONDS = 300; // 5 minutes
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 5;

interface StoredOtpPayload {
  phone: string;
  codeHash: string;
  attempts: number;
  sentAt: number;
}

function getOtpIdentifier(userId: string): string {
  return `phone-otp:${userId}`;
}

function getOtpSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET?.trim();
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("BETTER_AUTH_SECRET is required for phone OTP verification");
  }
  return "dev-phone-otp-fallback-secret";
}

function hashOtpCode(userId: string, phone: string, code: string): string {
  return createHmac("sha256", getOtpSecret())
    .update(`${userId}:${phone}:${code}`)
    .digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length === 0 || bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

function parsePayload(raw: string): StoredOtpPayload | null {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredOtpPayload>;
    if (
      typeof parsed.phone === "string" &&
      typeof parsed.codeHash === "string" &&
      typeof parsed.attempts === "number" &&
      typeof parsed.sentAt === "number"
    ) {
      return {
        phone: parsed.phone,
        codeHash: parsed.codeHash,
        attempts: parsed.attempts,
        sentAt: parsed.sentAt,
      };
    }
  } catch {
    // ignore invalid payload
  }
  return null;
}

export type PhoneOtpResult<T = Record<string, never>> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status: number };

export async function requestPhoneOtp(params: {
  userId: string;
  rawPhone: string;
}): Promise<PhoneOtpResult<{ phone: string; expiresInSeconds: number }>> {
  const normalizedPhone = normalizeEgyptianPhone(params.rawPhone);
  if (!normalizedPhone) {
    return {
      ok: false,
      error:
        "رقم الهاتف غير صحيح. أدخل رقم موبايل مصري يبدأ بـ 01 أو +20 (مثل 01012345678)",
      status: 400,
    };
  }

  const existingOwner = await prisma.user.findUnique({
    where: { phone: normalizedPhone },
    select: { id: true },
  });
  if (existingOwner && existingOwner.id !== params.userId) {
    return {
      ok: false,
      error: "رقم الهاتف مسجل بالفعل لحساب آخر",
      status: 409,
    };
  }

  const identifier = getOtpIdentifier(params.userId);
  const existingVerification = await prisma.verification.findFirst({
    where: { identifier },
    orderBy: { createdAt: "desc" },
  });

  if (existingVerification) {
    const payload = parsePayload(existingVerification.value);
    if (
      payload &&
      Date.now() - payload.sentAt < RESEND_COOLDOWN_SECONDS * 1000
    ) {
      return {
        ok: false,
        error: "يرجى الانتظار دقيقة واحدة قبل طلب رمز تحقق جديد",
        status: 429,
      };
    }
  }

  const code = randomInt(100000, 1000000).toString();
  const payload: StoredOtpPayload = {
    phone: normalizedPhone,
    codeHash: hashOtpCode(params.userId, normalizedPhone, code),
    attempts: 0,
    sentAt: Date.now(),
  };

  await prisma.$transaction(async (tx) => {
    await tx.verification.deleteMany({
      where: { identifier },
    });
    await tx.verification.create({
      data: {
        identifier,
        value: JSON.stringify(payload),
        expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
      },
    });
  });

  try {
    await sendOtpSms(normalizedPhone, code);
  } catch {
    await prisma.verification.deleteMany({ where: { identifier } });
    return {
      ok: false,
      error: "تعذر إرسال رسالة التحقق حالياً. يرجى المحاولة لاحقاً.",
      status: 502,
    };
  }

  return {
    ok: true,
    phone: normalizedPhone,
    expiresInSeconds: OTP_TTL_SECONDS,
  };
}

export async function verifyPhoneOtp(params: {
  userId: string;
  rawPhone: string;
  code: string;
}): Promise<PhoneOtpResult<{ phone: string }>> {
  const normalizedPhone = normalizeEgyptianPhone(params.rawPhone);
  if (!normalizedPhone) {
    return {
      ok: false,
      error:
        "رقم الهاتف غير صحيح. أدخل رقم موبايل مصري يبدأ بـ 01 أو +20 (مثل 01012345678)",
      status: 400,
    };
  }

  const cleanCode = params.code.trim();
  if (!/^\d{6}$/.test(cleanCode)) {
    return {
      ok: false,
      error: "رمز التحقق يجب أن يتكون من 6 أرقام",
      status: 400,
    };
  }

  const identifier = getOtpIdentifier(params.userId);
  const record = await prisma.verification.findFirst({
    where: { identifier },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt <= new Date()) {
    if (record) {
      await prisma.verification.deleteMany({ where: { identifier } });
    }
    return {
      ok: false,
      error: "انتهت صلاحية رمز التحقق أو لم يتم إرساله",
      status: 400,
    };
  }

  const payload = parsePayload(record.value);
  if (!payload || payload.phone !== normalizedPhone) {
    return {
      ok: false,
      error: "رمز التحقق غير مطابق لرقم الهاتف",
      status: 400,
    };
  }

  if (payload.attempts >= MAX_ATTEMPTS) {
    await prisma.verification.deleteMany({ where: { identifier } });
    return {
      ok: false,
      error: "تم تجاوز الحد الأقصى للمحاولات. يرجى طلب رمز جديد.",
      status: 429,
    };
  }

  const expectedHash = hashOtpCode(params.userId, normalizedPhone, cleanCode);
  if (!safeEqualHex(payload.codeHash, expectedHash)) {
    const nextAttempts = payload.attempts + 1;
    if (nextAttempts >= MAX_ATTEMPTS) {
      await prisma.verification.deleteMany({ where: { identifier } });
      return {
        ok: false,
        error: "تم تجاوز الحد الأقصى للمحاولات. يرجى طلب رمز جديد.",
        status: 429,
      };
    }

    await prisma.verification.update({
      where: { id: record.id },
      data: {
        value: JSON.stringify({
          ...payload,
          attempts: nextAttempts,
        }),
      },
    });

    return {
      ok: false,
      error: "رمز التحقق غير صحيح",
      status: 400,
    };
  }

  const existingOwner = await prisma.user.findUnique({
    where: { phone: normalizedPhone },
    select: { id: true },
  });
  if (existingOwner && existingOwner.id !== params.userId) {
    return {
      ok: false,
      error: "رقم الهاتف مسجل بالفعل لحساب آخر",
      status: 409,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.verification.deleteMany({ where: { identifier } });
    await tx.user.update({
      where: { id: params.userId },
      data: {
        phone: normalizedPhone,
        phoneVerifiedAt: new Date(),
      },
    });
  });

  return { ok: true, phone: normalizedPhone };
}

