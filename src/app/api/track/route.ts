import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCairoTodayString, dateStringToPrismaDate } from "@/lib/calendar-dates";
import { visibleProviderWhere } from "@/lib/provider-visibility";

const trackBodySchema = z.object({
  providerId: z.string().min(1),
  type: z.enum(["view", "whatsapp", "call"]),
});

// Bot user agents pattern
const BOT_REGEX = /bot|crawler|spider|crawling|slurp|facebookexternalhit|whatsapp|headless|preview|search|curl|wget|python|httpclient|axios/i;

// In-memory rate limiting: 60 requests per minute per IP.
// Note: This is an in-memory sliding window cache scoped per Node.js server process.
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up expired rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (entry.resetAt <= now) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt <= now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 1000 });
    return true;
  }
  if (entry.count >= 60) {
    return false;
  }
  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  // 1. Ignore bots & crawlers
  const userAgent = req.headers.get("user-agent") || "";
  if (BOT_REGEX.test(userAgent)) {
    return NextResponse.json({ ok: true, ignored: "bot" });
  }

  // 2. Ignore prefetch requests
  const purpose = req.headers.get("purpose") || req.headers.get("sec-purpose");
  if (purpose === "prefetch") {
    return NextResponse.json({ ok: true, ignored: "prefetch" });
  }

  // 3. Rate limit per IP (store NO IP in database or persistent logs)
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  // 4. Validate body
  let bodyJson;
  try {
    bodyJson = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = trackBodySchema.safeParse(bodyJson);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { providerId, type } = parsed.data;

  // 5. De-duplicate per browser with a 30-minute cookie
  const cookieName = `trk_${providerId}_${type}`;
  if (req.cookies.has(cookieName)) {
    return NextResponse.json({ ok: true, deduplicated: true });
  }

  // 6. Verify provider is currently visible (status = APPROVED and active subscription)
  const provider = await prisma.provider.findFirst({
    where: {
      id: providerId,
      ...visibleProviderWhere(),
    },
    select: { id: true },
  });

  if (!provider) {
    return NextResponse.json({ error: "Provider not visible" }, { status: 404 });
  }

  // 7. Upsert ProviderDailyStat for today's Cairo calendar date with an atomic increment
  const cairoTodayStr = getCairoTodayString();
  const cairoDate = dateStringToPrismaDate(cairoTodayStr);

  await prisma.providerDailyStat.upsert({
    where: {
      providerId_date: {
        providerId,
        date: cairoDate,
      },
    },
    update: {
      views: type === "view" ? { increment: 1 } : undefined,
      whatsappClicks: type === "whatsapp" ? { increment: 1 } : undefined,
      callClicks: type === "call" ? { increment: 1 } : undefined,
    },
    create: {
      providerId,
      date: cairoDate,
      views: type === "view" ? 1 : 0,
      whatsappClicks: type === "whatsapp" ? 1 : 0,
      callClicks: type === "call" ? 1 : 0,
    },
  });

  // 8. Set short-lived deduplication cookie on the response (30 minutes)
  const res = NextResponse.json({ ok: true, tracked: type });
  res.cookies.set(cookieName, "1", {
    maxAge: 30 * 60, // 30 minutes in seconds
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });

  return res;
}
