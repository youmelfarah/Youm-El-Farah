import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireUser } from "@/lib/auth-helpers";
import { verifyPhoneOtp } from "@/lib/phone-otp";

const verifyOtpBodySchema = z.object({
  phone: z.string().trim().min(1, "رقم الهاتف مطلوب"),
  code: z.string().trim().min(1, "رمز التحقق مطلوب"),
});

export async function POST(request: Request) {
  let session;
  try {
    session = await requireUser({ isServerAction: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  const parsed = verifyOtpBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 }
    );
  }

  const result = await verifyPhoneOtp({
    userId: session.user.id,
    rawPhone: parsed.data.phone,
    code: parsed.data.code,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    phone: result.phone,
  });
}

