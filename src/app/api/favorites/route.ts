import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { visibleProviderWhere } from "@/lib/provider-visibility";
import { favoriteToggleLimiter, RATE_LIMITS } from "@/lib/rate-limit";

const toggleSchema = z.object({
  providerId: z.string().trim().min(1, "مقدم الخدمة غير محدد"),
});

export async function GET() {
  const session = await getSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session?.user?.id || role !== "VISITOR") {
    return NextResponse.json({ providerIds: [] });
  }

  const rows = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    select: { providerId: true },
  });

  return NextResponse.json({
    providerIds: rows.map((r) => r.providerId),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "سجّلي دخولك بجوجل علشان تكملي", code: "UNAUTHENTICATED" },
      { status: 401 }
    );
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "VISITOR") {
    return NextResponse.json(
      { error: "المفضلة متاحة لحسابات الزائرات فقط", code: "FORBIDDEN" },
      { status: 403 }
    );
  }

  const limit = favoriteToggleLimiter.check(
    session.user.id,
    RATE_LIMITS.FAVORITE_TOGGLE_24H.max,
    RATE_LIMITS.FAVORITE_TOGGLE_24H.windowMs
  );
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "تم تجاوز الحد اليومي لتحديث المفضلة. حاولي لاحقاً." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "بيانات غير صالحة" },
      { status: 400 }
    );
  }

  const { providerId } = parsed.data;
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_providerId: {
        userId: session.user.id,
        providerId,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: {
        userId_providerId: {
          userId: session.user.id,
          providerId,
        },
      },
    });
    revalidatePath("/account/favorites");
    revalidatePath("/account");
    return NextResponse.json({ ok: true, favorited: false });
  }

  // Only visible providers can be newly favorited
  const provider = await prisma.provider.findFirst({
    where: {
      id: providerId,
      ...visibleProviderWhere(),
    },
    select: { id: true },
  });

  if (!provider) {
    return NextResponse.json(
      { error: "مقدم الخدمة غير متاح حالياً" },
      { status: 404 }
    );
  }

  await prisma.favorite.create({
    data: {
      userId: session.user.id,
      providerId: provider.id,
    },
  });

  revalidatePath("/account/favorites");
  revalidatePath("/account");
  return NextResponse.json({ ok: true, favorited: true });
}
