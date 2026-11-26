import Link from "next/link";
import type { LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireProviderPage } from "@/lib/provider-dashboard";
import { toCairoDateString } from "@/lib/cairo-time";
import { formatArabicDateString, prismaDateToDateString } from "@/lib/calendar-dates";
import { LEAD_STATUS_LABELS_AR, LEAD_STATUS_VALUES } from "@/lib/lead-validation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DashboardLeadsClient,
  type DashboardLeadItem,
} from "./leads-client";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export default async function DashboardLeadsPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [session, sp] = await Promise.all([
    requireProviderPage(),
    props.searchParams,
  ]);

  const provider = await prisma.provider.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!provider) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-text-muted">
          يرجى إكمال بيانات ملفك التعريفي أولاً لعرض الطلبات الواردة.
        </CardContent>
      </Card>
    );
  }

  const statusFilter =
    sp.status && LEAD_STATUS_VALUES.includes(sp.status as LeadStatus)
      ? (sp.status as LeadStatus)
      : null;

  const [countsRaw, leadsRaw] = await Promise.all([
    prisma.lead.groupBy({
      by: ["status"],
      where: { providerId: provider.id },
      _count: { _all: true },
    }),
    prisma.lead.findMany({
      where: {
        providerId: provider.id,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        phone: true,
        weddingDate: true,
        message: true,
        status: true,
        providerNote: true,
        createdAt: true,
        offer: { select: { title: true } },
      },
    }),
  ]);

  const countsMap: Record<LeadStatus, number> = {
    NEW: 0,
    CONTACTED: 0,
    BOOKED: 0,
    DECLINED: 0,
    SPAM: 0,
  };
  let totalCount = 0;
  for (const row of countsRaw) {
    countsMap[row.status] = row._count._all;
    totalCount += row._count._all;
  }

  const items: DashboardLeadItem[] = leadsRaw.map((l) => {
    const wdStr = l.weddingDate ? prismaDateToDateString(l.weddingDate) : null;
    return {
      id: l.id,
      name: l.name,
      phone: l.phone,
      weddingDateStr: wdStr,
      weddingDateLabel: wdStr ? formatArabicDateString(wdStr) : null,
      offerTitle: l.offer?.title ?? null,
      message: l.message,
      status: l.status,
      providerNote: l.providerNote,
      createdAtLabel: formatArabicDateString(toCairoDateString(l.createdAt)),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">
          الطلبات الواردة (عروض الأسعار)
        </h1>
        <p className="mt-1 text-xs text-text-muted">
          تابعي طلبات العرائس وتواصلي معهن مباشرة لتأكيد الحجوزات.
        </p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <Link
          href="/dashboard/leads"
          className={cn(
            "inline-flex min-h-[40px] items-center gap-2 rounded-[4px] border px-3.5 py-2 text-xs font-medium transition-colors",
            !statusFilter
              ? "border-text bg-text text-text-inverse"
              : "border-border bg-surface-raised text-text hover:bg-surface-muted"
          )}
        >
          <span>الكل</span>
          <Badge variant={!statusFilter ? "accent" : "neutral"} size="sm" className="font-latin">
            {totalCount}
          </Badge>
        </Link>

        {LEAD_STATUS_VALUES.map((st) => {
          const active = statusFilter === st;
          return (
            <Link
              key={st}
              href={`/dashboard/leads?status=${st}`}
              className={cn(
                "inline-flex min-h-[40px] items-center gap-2 rounded-[4px] border px-3.5 py-2 text-xs font-medium transition-colors",
                active
                  ? "border-text bg-text text-text-inverse"
                  : "border-border bg-surface-raised text-text hover:bg-surface-muted"
              )}
            >
              <span>{LEAD_STATUS_LABELS_AR[st]}</span>
              <Badge variant={active ? "accent" : "neutral"} size="sm" className="font-latin">
                {countsMap[st]}
              </Badge>
            </Link>
          );
        })}
      </div>

      <DashboardLeadsClient leads={items} />
    </div>
  );
}
