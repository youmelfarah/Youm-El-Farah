import { NextRequest, NextResponse } from "next/server";
import { AuthError, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  cairoStartOfDay,
  getLastCoveredDateString,
  toCairoDateString,
} from "@/lib/cairo-time";
import { formatArabicDateString } from "@/lib/calendar-dates";
import { getSubscriptionState, SubscriptionState } from "@/lib/subscription";
import { PaymentMethod, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function escapeCsvField(field: string | number | null | undefined): string {
  if (field === null || field === undefined) return "";
  const str = String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    await requireRole("ADMIN");
  } catch (err) {
    if (err instanceof AuthError && err.code === "FORBIDDEN") {
      return new NextResponse("Forbidden", { status: 403 });
    }
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const stateFilter = searchParams.get("state")?.trim() || "";
  const paymentMethodFilter = searchParams.get("paymentMethod")?.trim() || "";
  const dateFrom = searchParams.get("dateFrom")?.trim() || "";
  const dateTo = searchParams.get("dateTo")?.trim() || "";

  const where: Prisma.SubscriptionWhereInput = {};

  if (paymentMethodFilter && ["CASH", "INSTAPAY", "VODAFONE_CASH", "OTHER"].includes(paymentMethodFilter)) {
    where.paymentMethod = paymentMethodFilter as PaymentMethod;
  }

  if (dateFrom) {
    where.endsAt = {
      ...(where.endsAt as Prisma.DateTimeFilter || {}),
      gte: cairoStartOfDay(dateFrom),
    };
  }

  if (dateTo) {
    where.endsAt = {
      ...(where.endsAt as Prisma.DateTimeFilter || {}),
      lte: cairoStartOfDay(dateTo),
    };
  }

  const subscriptions = await prisma.subscription.findMany({
    where,
    include: {
      provider: {
        select: {
          id: true,
          name: true,
          subscriptions: {
            select: { id: true, status: true, startsAt: true, endsAt: true },
          },
        },
      },
      createdBy: {
        select: { name: true },
      },
    },
    orderBy: { endsAt: "asc" },
  });

  const now = new Date();

  // Filter by derived state if specified
  let filtered = subscriptions.map((sub) => {
    const provState = getSubscriptionState(sub.provider.subscriptions, now);
    return {
      sub,
      provState,
    };
  });

  if (stateFilter) {
    filtered = filtered.filter((item) => item.provState === stateFilter);
  }

  const stateLabels: Record<SubscriptionState, string> = {
    ACTIVE: "نشط",
    EXPIRING: "أوشك على الانتهاء",
    EXPIRED: "منتهي",
    FUTURE: "مستقبلي",
    CANCELLED: "ملغي",
    NONE: "بدون اشتراك",
  };

  const methodLabels: Record<string, string> = {
    CASH: "نقداً",
    INSTAPAY: "إنستاباي",
    VODAFONE_CASH: "فودافون كاش",
    OTHER: "أخرى",
  };

  const BOM = "\uFEFF";
  const headers = [
    "مقدم الخدمة",
    "حالة الاشتراك",
    "تاريخ البدء",
    "آخر يوم مشمول",
    "المبلغ بالجنيه",
    "طريقة الدفع",
    "ملاحظة الدفع",
    "تاريخ التسجيل",
  ];

  const rows = filtered.map(({ sub, provState }) => {
    const providerName = sub.provider.name;
    const stateStr = stateLabels[provState] || provState;
    const startStr = toCairoDateString(sub.startsAt);
    const lastDayStr = getLastCoveredDateString(sub.endsAt);
    const amountStr = sub.amountPaid !== null ? String(sub.amountPaid) : "";
    const methodStr = sub.paymentMethod ? methodLabels[sub.paymentMethod] || sub.paymentMethod : "";
    const noteStr = sub.paymentNote || "";
    const createdStr = formatArabicDateString(toCairoDateString(sub.createdAt));

    return [
      escapeCsvField(providerName),
      escapeCsvField(stateStr),
      escapeCsvField(startStr),
      escapeCsvField(lastDayStr),
      escapeCsvField(amountStr),
      escapeCsvField(methodStr),
      escapeCsvField(noteStr),
      escapeCsvField(createdStr),
    ].join(",");
  });

  const csvContent = BOM + [headers.join(","), ...rows].join("\r\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="subscriptions.csv"',
    },
  });
}
