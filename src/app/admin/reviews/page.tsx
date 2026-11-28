import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma, ReviewStatus } from "@prisma/client";
import { AuthError, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { formatReviewerDisplayName } from "@/lib/display-name";
import { toCairoDateString } from "@/lib/cairo-time";
import { formatArabicDateString } from "@/lib/calendar-dates";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataPagination } from "@/components/ui/pagination";
import {
  AdminReviewsClient,
  type AdminReportRow,
  type AdminReviewRow,
} from "./reviews-client";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

interface SearchParams {
  tab?: string;
  providerId?: string;
  rating?: string;
  search?: string;
  page?: string;
}

export default async function AdminReviewsPage(props: {
  searchParams: Promise<SearchParams>;
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
  const tab: "pending" | "approved" | "rejected" | "reports" =
    sp.tab === "approved" || sp.tab === "rejected" || sp.tab === "reports"
      ? sp.tab
      : "pending";

  const providerFilter = sp.providerId?.trim() || "";
  const ratingNum = sp.rating ? Number.parseInt(sp.rating, 10) : NaN;
  const ratingFilter =
    Number.isInteger(ratingNum) && ratingNum >= 1 && ratingNum <= 5
      ? ratingNum
      : null;
  const search = sp.search?.trim() || "";
  const currentPage = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const [
    pendingCount,
    approvedCount,
    rejectedCount,
    openReportsCount,
    providersList,
  ] = await Promise.all([
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.review.count({ where: { status: "APPROVED" } }),
    prisma.review.count({ where: { status: "REJECTED" } }),
    prisma.reviewReport
      ? prisma.reviewReport.count({ where: { resolvedAt: null } })
      : Promise.resolve(0),
    prisma.provider.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  let reviews: AdminReviewRow[] = [];
  let reports: AdminReportRow[] = [];
  let totalItems = 0;

  if (tab === "reports") {
    const reportWhere: Prisma.ReviewReportWhereInput = {};
    if (providerFilter || ratingFilter || search) {
      reportWhere.review = {
        ...(providerFilter ? { providerId: providerFilter } : {}),
        ...(ratingFilter ? { rating: ratingFilter } : {}),
        ...(search
          ? {
              OR: [
                { comment: { contains: search, mode: "insensitive" } },
                { provider: { name: { contains: search, mode: "insensitive" } } },
                { user: { name: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      };
    }

    totalItems = prisma.reviewReport
      ? await prisma.reviewReport.count({ where: reportWhere })
      : 0;
    const rawReports = prisma.reviewReport
      ? await prisma.reviewReport.findMany({
          where: reportWhere,
          orderBy: [{ resolvedAt: "asc" }, { createdAt: "desc" }],
          skip: (currentPage - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          select: {
            id: true,
            reason: true,
            createdAt: true,
            resolvedAt: true,
            reporter: { select: { name: true } },
            review: {
              select: {
                id: true,
                rating: true,
                comment: true,
                status: true,
                providerReply: true,
                providerReplyHidden: true,
                provider: { select: { name: true, slug: true } },
                user: { select: { name: true } },
              },
            },
          },
        })
      : [];

    reports = rawReports.map((rep) => ({
      id: rep.id,
      reason: rep.reason,
      createdAtLabel: formatArabicDateString(toCairoDateString(rep.createdAt)),
      resolvedAtLabel: rep.resolvedAt
        ? formatArabicDateString(toCairoDateString(rep.resolvedAt))
        : null,
      reporterDisplayName: formatReviewerDisplayName(rep.reporter.name),
      review: {
        id: rep.review.id,
        providerName: rep.review.provider.name,
        providerSlug: rep.review.provider.slug,
        authorDisplayName: formatReviewerDisplayName(rep.review.user.name),
        rating: rep.review.rating,
        comment: rep.review.comment,
        status: rep.review.status,
        providerReply: rep.review.providerReply,
        providerReplyHidden: rep.review.providerReplyHidden,
      },
    }));
  } else {
    const statusMap: Record<"pending" | "approved" | "rejected", ReviewStatus> = {
      pending: "PENDING",
      approved: "APPROVED",
      rejected: "REJECTED",
    };

    const where: Prisma.ReviewWhereInput = {
      status: statusMap[tab],
      ...(providerFilter ? { providerId: providerFilter } : {}),
      ...(ratingFilter ? { rating: ratingFilter } : {}),
      ...(search
        ? {
            OR: [
              { comment: { contains: search, mode: "insensitive" } },
              { provider: { name: { contains: search, mode: "insensitive" } } },
              { user: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    totalItems = await prisma.review.count({ where });
    const rawReviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        providerId: true,
        rating: true,
        comment: true,
        status: true,
        moderationNote: true,
        providerReply: true,
        providerReplyHidden: true,
        createdAt: true,
        provider: { select: { name: true, slug: true } },
        user: { select: { name: true } },
        reports: {
          where: { resolvedAt: null },
          select: { id: true },
        },
      },
    });

    reviews = rawReviews.map((r) => ({
      id: r.id,
      providerId: r.providerId,
      providerName: r.provider.name,
      providerSlug: r.provider.slug,
      authorDisplayName: formatReviewerDisplayName(r.user.name),
      rating: r.rating,
      comment: r.comment,
      status: r.status,
      moderationNote: r.moderationNote,
      providerReply: r.providerReply,
      providerReplyHidden: r.providerReplyHidden,
      createdAtLabel: formatArabicDateString(toCairoDateString(r.createdAt)),
      unresolvedReportsCount: r.reports.length,
    }));
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const tabs = [
    { id: "pending", label: "بانتظار المراجعة", count: pendingCount },
    { id: "approved", label: "المعتمدة", count: approvedCount },
    { id: "rejected", label: "المرفوضة", count: rejectedCount },
    { id: "reports", label: "البلاغات", count: openReportsCount },
  ] as const;

  const buildTabHref = (nextTab: string) => {
    const p = new URLSearchParams();
    p.set("tab", nextTab);
    if (providerFilter) p.set("providerId", providerFilter);
    if (ratingFilter) p.set("rating", String(ratingFilter));
    if (search) p.set("search", search);
    return `/admin/reviews?${p.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-text">
          مراجعة التقييمات والبلاغات
        </h1>
        <p className="mt-1 text-xs text-text-muted">
          جميع التقييمات تمر بالاعتماد قبل النشر. كل إجراء يُحدث التقييم العام ويُسجل في سجل التدقيق.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <Link
              key={t.id}
              href={buildTabHref(t.id)}
              className={cn(
                "inline-flex min-h-[40px] items-center gap-2 rounded-[4px] border px-3.5 py-2 text-xs font-medium transition-colors",
                active
                  ? "border-text bg-text text-text-inverse"
                  : "border-border bg-surface-raised text-text hover:bg-surface-muted"
              )}
            >
              <span>{t.label}</span>
              <Badge
                variant={active ? "accent" : "neutral"}
                size="sm"
                className="font-latin"
              >
                {t.count}
              </Badge>
            </Link>
          );
        })}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <form method="GET" action="/admin/reviews" className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input type="hidden" name="tab" value={tab} />
          <Input
            name="search"
            defaultValue={search}
            placeholder="بحث باسم المقدم أو النص..."
          />
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
          <select
            name="rating"
            defaultValue={ratingFilter ? String(ratingFilter) : ""}
            className="flex h-11 w-full rounded-[4px] border border-border bg-surface-raised px-3 text-sm text-text"
          >
            <option value="">كل التقييمات</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={String(r)}>
                {r} نجوم
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="primary" className="flex-1">
              تصفية
            </Button>
            {(providerFilter || ratingFilter || search) && (
              <Button asChild variant="secondary">
                <Link href={`/admin/reviews?tab=${tab}`}>إعادة</Link>
              </Button>
            )}
          </div>
        </form>
      </Card>

      <AdminReviewsClient tab={tab} reviews={reviews} reports={reports} />

      <DataPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
