import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { toCairoDateString } from "@/lib/cairo-time";
import { formatArabicDateString } from "@/lib/calendar-dates";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  MobileCardList,
  MobileCardItem,
} from "@/components/ui/table";
import { DataPagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface SearchParams {
  actionPrefix?: string;
  providerId?: string;
  page?: string;
}

export default async function AdminAuditLogPage(props: {
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

  const searchParams = await props.searchParams;
  const actionPrefix = searchParams.actionPrefix?.trim() || "";
  const providerId = searchParams.providerId?.trim() || "";
  const currentPage = Math.max(1, Number(searchParams.page) || 1);

  const where: Prisma.AuditLogWhereInput = {};

  if (actionPrefix) {
    where.action = { startsWith: actionPrefix };
  }

  if (providerId) {
    where.providerId = providerId;
  }

  const [totalItems, logs, providersList] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        admin: {
          select: { id: true, name: true, email: true },
        },
        provider: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.provider.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  function formatDateWithTime(date: Date) {
    const cairoDate = toCairoDateString(date);
    const time = date.toLocaleTimeString("en-US", {
      timeZone: "Africa/Cairo",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return `${formatArabicDateString(cairoDate)} - ${time}`;
  }

  function formatActionLabel(action: string) {
    switch (action) {
      case "PROVIDER_APPROVE":
        return "اعتماد مقدم خدمة";
      case "PROVIDER_REJECT":
        return "رفض مقدم خدمة";
      case "PROVIDER_SUSPEND":
        return "إيقاف مؤقت";
      case "PROVIDER_UNSUSPEND":
        return "إلغاء الإيقاف";
      case "PROVIDER_EDIT":
        return "تعديل بيانات";
      case "SUBSCRIPTION_GRANT":
        return "منح اشتراك";
      case "SUBSCRIPTION_CANCEL":
        return "إلغاء اشتراك";
      case "CATEGORY_CREATE":
        return "إضافة فئة";
      case "CATEGORY_EDIT":
        return "تعديل فئة";
      case "CATEGORY_DELETE":
        return "حذف فئة";
      case "PROVIDER_CREATE":
        return "إنشاء حساب مقدم";
      case "PROVIDER_TOGGLE_ACTIVE":
        return "تغيير حالة الحساب";
      case "PROVIDER_RESET_PASSWORD":
        return "إعادة تعيين كلمة المرور";
      default:
        return action;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">سجل النشاط الإداري</h1>
          <p className="mt-1 text-xs text-text-muted">
            سجل غير قابل للتعديل لجميع العمليات الإدارية الحساسة على المنصة.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <form
          method="GET"
          action="/admin/audit-log"
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-text">
              نوع الإجراء
            </label>
            <select
              name="actionPrefix"
              defaultValue={actionPrefix}
              className="h-11 w-full rounded-[4px] border border-border bg-surface-raised px-3 py-2 text-xs text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">كل الإجراءات</option>
              <option value="PROVIDER_">عمليات مقدمي الخدمة (PROVIDER_*)</option>
              <option value="SUBSCRIPTION_">عمليات الاشتراكات (SUBSCRIPTION_*)</option>
              <option value="CATEGORY_">عمليات الفئات (CATEGORY_*)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-text">
              مقدم الخدمة
            </label>
            <select
              name="providerId"
              defaultValue={providerId}
              className="h-11 w-full rounded-[4px] border border-border bg-surface-raised px-3 py-2 text-xs text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">كل المقدمين</option>
              {providersList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
            >
              تصفية السجل
            </Button>
            <Button
              asChild
              variant="secondary"
            >
              <Link href="/admin/audit-log">
                إلغاء
              </Link>
            </Button>
          </div>
        </form>
      </Card>

      {/* Mobile View (Cards) */}
      <MobileCardList>
        {logs.length === 0 ? (
          <Card className="p-6 text-center text-xs text-text-muted">
            لا توجد سجلات مطابقة للشروط.
          </Card>
        ) : (
          logs.map((log) => (
            <MobileCardItem key={log.id}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-text">{formatActionLabel(log.action)}</span>
                <span className="text-[11px] text-text-muted font-latin">
                  {formatDateWithTime(log.createdAt)}
                </span>
              </div>

              <div className="text-text-muted space-y-1 border-y border-border py-2 text-xs">
                <div>
                  المسؤول: <strong className="text-text">{log.admin.name}</strong> ({log.admin.email})
                </div>
                {log.provider && (
                  <div>
                    مقدم الخدمة:{" "}
                    <Link
                      href={`/admin/providers/${log.provider.id}`}
                      className="font-semibold text-accent-text hover:underline"
                    >
                      {log.provider.name}
                    </Link>
                  </div>
                )}
                <div>
                  الكيان: <span className="font-mono">{log.entityType}</span> ({log.entityId})
                </div>
              </div>

              {log.details && (
                <pre
                  dir="ltr"
                  className="rounded-[2px] bg-surface-muted p-2 font-mono text-[10px] text-text overflow-x-auto whitespace-pre-wrap break-all"
                >
                  {typeof log.details === "string"
                    ? log.details
                    : JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </MobileCardItem>
          ))
        )}
      </MobileCardList>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>التاريخ والوقت</TableHead>
              <TableHead>المسؤول</TableHead>
              <TableHead>الإجراء</TableHead>
              <TableHead>الكيان</TableHead>
              <TableHead>مقدم الخدمة</TableHead>
              <TableHead>التفاصيل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-xs text-text-muted">
                  لا توجد سجلات مطابقة للشروط.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="align-top">
                  <TableCell className="text-xs whitespace-nowrap text-text-muted font-latin">
                    {formatDateWithTime(log.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap">
                    <p className="font-semibold text-text">{log.admin.name}</p>
                    <p className="text-[10px] text-text-muted font-latin" dir="ltr">
                      {log.admin.email}
                    </p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span className="font-mono text-xs font-semibold text-text">
                      {log.action}
                    </span>
                    <p className="text-[10px] text-text-muted">
                      {formatActionLabel(log.action)}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs text-text-muted whitespace-nowrap">
                    <span className="font-mono">{log.entityType}</span>
                    <p className="text-[10px] font-mono truncate max-w-[120px]" dir="ltr">
                      {log.entityId}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs">
                    {log.provider ? (
                      <Link
                        href={`/admin/providers/${log.provider.id}`}
                        className="font-semibold text-accent-text hover:underline"
                      >
                        {log.provider.name}
                      </Link>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-md">
                    {log.details ? (
                      <pre
                        dir="ltr"
                        className="max-h-24 overflow-auto rounded-[2px] bg-surface-muted p-2 font-mono text-[10px] text-text leading-tight"
                      >
                        {typeof log.details === "string"
                          ? log.details
                          : JSON.stringify(log.details, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
