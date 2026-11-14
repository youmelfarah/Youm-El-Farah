import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { toCairoDateString } from "@/lib/cairo-time";
import { formatArabicDateString } from "@/lib/calendar-dates";
import { AdminCard } from "@/components/admin/card";
import { AdminBadge } from "@/components/admin/badge";
import { AdminTable, AdminTableBody, AdminTableHead, AdminTd, AdminTh } from "@/components/admin/table";
import { AdminPagination } from "@/components/admin/pagination";
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
          select: { id: true, name: true, slug: true },
        },
      },
    }),
    prisma.provider.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-xl font-bold text-text sm:text-2xl">سجل النشاط (Audit Log)</h1>
        <p className="mt-1 text-xs text-text-muted">
          توثيق كامل لكافة الإجراءات والتعديلات الإدارية في النظام لضمان النزاهة والشفافية.
        </p>
      </div>

      {/* Filters */}
      <AdminCard className="p-4">
        <form method="GET" className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-text mb-1">
              نوع الإجراء
            </label>
            <select
              name="actionPrefix"
              defaultValue={actionPrefix}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">كل الإجراءات</option>
              <option value="provider">إجراءات مقدمي الخدمة (provider.*)</option>
              <option value="subscription">إجراءات الاشتراكات (subscription.*)</option>
              <option value="category">إجراءات الفئات (category.*)</option>
              <option value="account">إجراءات الحسابات (account.*)</option>
              <option value="provider.approve">اعتماد ملف (provider.approve)</option>
              <option value="provider.suspend">إيقاف حساب (provider.suspend)</option>
              <option value="provider.reactivate">إعادة تفعيل (provider.reactivate)</option>
              <option value="provider.limits_update">تعديل الحدود (provider.limits_update)</option>
              <option value="provider.notes_update">ملاحظات الإدارة (provider.notes_update)</option>
              <option value="subscription.create">تسجيل اشتراك (subscription.create)</option>
              <option value="subscription.cancel">إلغاء اشتراك (subscription.cancel)</option>
              <option value="category.create">إنشاء فئة (category.create)</option>
              <option value="category.update">تعديل فئة (category.update)</option>
              <option value="category.reorder">إعادة ترتيب فئة (category.reorder)</option>
              <option value="category.toggle">تفعيل/تعطيل فئة (category.toggle)</option>
              <option value="category.delete">حذف فئة (category.delete)</option>
              <option value="account.create">إنشاء حساب (account.create)</option>
              <option value="account.reset_password">إعادة تعيين كلمة مرور (account.reset_password)</option>
              <option value="account.toggle_active">تعطيل/تفعيل حساب (account.toggle_active)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1">
              مقدم الخدمة
            </label>
            <select
              name="providerId"
              defaultValue={providerId}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
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
            <button
              type="submit"
              className="w-full rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent-hover cursor-pointer"
            >
              تصفية السجل
            </button>
            <Link
              href="/admin/audit-log"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-muted hover:bg-surface-muted"
            >
              إلغاء
            </Link>
          </div>
        </form>
      </AdminCard>

      {/* Mobile View (Cards) */}
      <div className="space-y-3 md:hidden">
        {logs.length === 0 ? (
          <AdminCard className="p-6 text-center text-xs text-text-muted">
            لا توجد سجلات مطابقة للشروط.
          </AdminCard>
        ) : (
          logs.map((log) => (
            <AdminCard key={log.id} className="p-4 space-y-2 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-text">{formatActionLabel(log.action)}</span>
                <span className="text-[11px] text-text-muted">
                  {formatDateWithTime(log.createdAt)}
                </span>
              </div>

              <div className="text-text-muted space-y-1 border-y border-border py-2">
                <div>
                  المسؤول: <strong className="text-text">{log.admin.name}</strong> ({log.admin.email})
                </div>
                {log.provider && (
                  <div>
                    مقدم الخدمة:{" "}
                    <Link
                      href={`/admin/providers/${log.provider.id}`}
                      className="font-semibold text-accent hover:underline"
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
                  className="rounded bg-surface-muted p-2 font-mono text-[10px] text-text overflow-x-auto whitespace-pre-wrap break-all"
                >
                  {typeof log.details === "string"
                    ? log.details
                    : JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </AdminCard>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <AdminTable>
          <AdminTableHead>
            <tr>
              <AdminTh>التاريخ والوقت</AdminTh>
              <AdminTh>المسؤول</AdminTh>
              <AdminTh>الإجراء</AdminTh>
              <AdminTh>الكيان</AdminTh>
              <AdminTh>مقدم الخدمة</AdminTh>
              <AdminTh>التفاصيل</AdminTh>
            </tr>
          </AdminTableHead>
          <AdminTableBody>
            {logs.length === 0 ? (
              <tr>
                <AdminTd colSpan={6} className="py-8 text-center text-xs text-text-muted">
                  لا توجد سجلات مطابقة للشروط.
                </AdminTd>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-muted/50 align-top">
                  <AdminTd className="text-xs whitespace-nowrap text-text-muted">
                    {formatDateWithTime(log.createdAt)}
                  </AdminTd>
                  <AdminTd className="text-xs whitespace-nowrap">
                    <p className="font-semibold text-text">{log.admin.name}</p>
                    <p className="text-[10px] text-text-muted" dir="ltr">
                      {log.admin.email}
                    </p>
                  </AdminTd>
                  <AdminTd className="whitespace-nowrap">
                    <span className="font-mono text-xs font-semibold text-text">
                      {log.action}
                    </span>
                    <p className="text-[10px] text-text-muted">
                      {formatActionLabel(log.action)}
                    </p>
                  </AdminTd>
                  <AdminTd className="text-xs text-text-muted whitespace-nowrap">
                    <span className="font-mono">{log.entityType}</span>
                    <p className="text-[10px] font-mono truncate max-w-[120px]" dir="ltr">
                      {log.entityId}
                    </p>
                  </AdminTd>
                  <AdminTd className="text-xs">
                    {log.provider ? (
                      <Link
                        href={`/admin/providers/${log.provider.id}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {log.provider.name}
                      </Link>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </AdminTd>
                  <AdminTd className="max-w-xs">
                    {log.details ? (
                      <pre
                        dir="ltr"
                        className="rounded bg-surface-muted p-1.5 font-mono text-[10px] text-text overflow-x-auto whitespace-pre-wrap break-all max-h-24"
                      >
                        {typeof log.details === "string"
                          ? log.details
                          : JSON.stringify(log.details)}
                      </pre>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </AdminTd>
                </tr>
              ))
            )}
          </AdminTableBody>
        </AdminTable>
      </div>

      {/* Pagination */}
      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}

function formatDateWithTime(date: Date) {
  const cairoStr = toCairoDateString(date);
  const arabicDate = formatArabicDateString(cairoStr);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);

  const hour = parts.find((p) => p.type === "hour")?.value || "";
  const minute = parts.find((p) => p.type === "minute")?.value || "";
  const dayPeriod = parts.find((p) => p.type === "dayPeriod")?.value || "";
  const arabicPeriod = dayPeriod.toLowerCase() === "pm" ? "م" : "ص";

  return `${arabicDate} - ${hour}:${minute} ${arabicPeriod}`;
}

function formatActionLabel(action: string) {
  const map: Record<string, string> = {
    "provider.approve": "اعتماد الملف",
    "provider.suspend": "إيقاف الحساب",
    "provider.reactivate": "إعادة التفعيل",
    "provider.limits_update": "تعديل الحدود",
    "provider.notes_update": "تحديث ملاحظات الإدارة",
    "subscription.create": "تسجيل اشتراك",
    "subscription.cancel": "إلغاء اشتراك",
    "category.create": "إنشاء فئة جديدة",
    "category.update": "تعديل اسم الفئة",
    "category.reorder": "إعادة ترتيب الفئات",
    "category.toggle": "تغيير تفعيل الفئة",
    "category.delete": "حذف فئة",
    "account.create": "إنشاء حساب مقدم",
    "account.reset_password": "تعيين كلمة المرور",
    "account.toggle_active": "تغيير حالة الحساب",
  };
  return map[action] || action;
}
