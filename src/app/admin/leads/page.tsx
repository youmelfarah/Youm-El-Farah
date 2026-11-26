import Link from "next/link";
import { redirect } from "next/navigation";
import type { LeadStatus, Prisma } from "@prisma/client";
import { AuthError, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { toCairoDateString } from "@/lib/cairo-time";
import { formatArabicDateString, prismaDateToDateString } from "@/lib/calendar-dates";
import { LEAD_STATUS_LABELS_AR, LEAD_STATUS_VALUES } from "@/lib/lead-validation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  MobileCardList,
  MobileCardItem,
  MobileCardRow,
} from "@/components/ui/table";
import { DataPagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function AdminLeadsPage(props: {
  searchParams: Promise<{ status?: string; providerId?: string; page?: string }>;
}) {
  try {
    await requireRole("ADMIN");
  } catch (err) {
    if (err instanceof AuthError && err.code === "FORBIDDEN") {
      redirect("/unauthorized");
    }
    redirect("/login");
  }

  const sp = await props.searchParams;
  const statusFilter =
    sp.status && LEAD_STATUS_VALUES.includes(sp.status as LeadStatus)
      ? (sp.status as LeadStatus)
      : null;
  const providerFilter = sp.providerId?.trim() || "";
  const currentPage = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const where: Prisma.LeadWhereInput = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(providerFilter ? { providerId: providerFilter } : {}),
  };

  const [countsRaw, totalItems, leads, providersList] = await Promise.all([
    prisma.lead.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        status: true,
        weddingDate: true,
        createdAt: true,
        provider: { select: { id: true, name: true } },
        offer: { select: { title: true } },
      },
    }),
    prisma.provider.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const countsMap: Record<LeadStatus, number> = {
    NEW: 0,
    CONTACTED: 0,
    BOOKED: 0,
    DECLINED: 0,
    SPAM: 0,
  };
  let totalAll = 0;
  for (const row of countsRaw) {
    countsMap[row.status] = row._count._all;
    totalAll += row._count._all;
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">
          إحصائيات الطلبات (Leads)
        </h1>
        <p className="mt-1 text-xs text-text-muted">
          متابعة إجمالية لحركة طلبات عروض الأسعار على المنصة دون عرض البيانات الشخصية للزائرات.
        </p>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4">
            <span className="text-xs text-text-muted">الإجمالي</span>
            <p className="mt-1 font-latin text-2xl font-bold text-text">{totalAll}</p>
          </CardContent>
        </Card>
        {LEAD_STATUS_VALUES.map((st) => (
          <Card key={st}>
            <CardContent className="p-4">
              <span className="text-xs text-text-muted">
                {LEAD_STATUS_LABELS_AR[st]}
              </span>
              <p className="mt-1 font-latin text-2xl font-bold text-text">
                {countsMap[st]}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <form method="GET" action="/admin/leads" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            name="status"
            defaultValue={statusFilter ?? ""}
            className="flex h-11 w-full rounded-[4px] border border-border bg-surface-raised px-3 text-sm text-text"
          >
            <option value="">كل الحالات</option>
            {LEAD_STATUS_VALUES.map((st) => (
              <option key={st} value={st}>
                {LEAD_STATUS_LABELS_AR[st]}
              </option>
            ))}
          </select>

          <select
            name="providerId"
            defaultValue={providerFilter}
            className="flex h-11 w-full rounded-[4px] border border-border bg-surface-raised px-3 text-sm text-text"
          >
            <option value="">كل مقدمي الخدمة</option>
            {providersList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <Button type="submit" variant="primary" className="flex-1">
              تصفية
            </Button>
            {(statusFilter || providerFilter) && (
              <Button asChild variant="secondary">
                <Link href="/admin/leads">إعادة</Link>
              </Button>
            )}
          </div>
        </form>
      </Card>

      {leads.length === 0 ? (
        <EmptyState title="لا توجد طلبات مطابقة" />
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>مقدم الخدمة</TableHead>
                  <TableHead>الباقة</TableHead>
                  <TableHead>تاريخ الفرح</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الطلب</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-semibold">
                      <Link
                        href={`/admin/providers/${l.provider.id}`}
                        className="hover:underline"
                      >
                        {l.provider.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-text-muted">
                      {l.offer?.title ?? "استفسار عام"}
                    </TableCell>
                    <TableCell className="font-latin text-xs">
                      {l.weddingDate
                        ? formatArabicDateString(prismaDateToDateString(l.weddingDate))
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          l.status === "BOOKED"
                            ? "success"
                            : l.status === "NEW"
                            ? "accent"
                            : l.status === "SPAM" || l.status === "DECLINED"
                            ? "danger"
                            : "neutral"
                        }
                        size="sm"
                      >
                        {LEAD_STATUS_LABELS_AR[l.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-latin text-xs text-text-muted">
                      {formatArabicDateString(toCairoDateString(l.createdAt))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <MobileCardList>
            {leads.map((l) => (
              <MobileCardItem key={l.id}>
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/providers/${l.provider.id}`}
                    className="font-semibold text-text hover:underline"
                  >
                    {l.provider.name}
                  </Link>
                  <Badge variant="neutral" size="sm">
                    {LEAD_STATUS_LABELS_AR[l.status]}
                  </Badge>
                </div>
                <MobileCardRow label="الباقة">
                  {l.offer?.title ?? "استفسار عام"}
                </MobileCardRow>
                <MobileCardRow label="تاريخ الفرح">
                  {l.weddingDate
                    ? formatArabicDateString(prismaDateToDateString(l.weddingDate))
                    : "—"}
                </MobileCardRow>
                <MobileCardRow label="تاريخ الطلب">
                  {formatArabicDateString(toCairoDateString(l.createdAt))}
                </MobileCardRow>
              </MobileCardItem>
            ))}
          </MobileCardList>
        </>
      )}

      <DataPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
