import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  cairoStartOfDay,
  daysUntil,
  getLastCoveredDateString,
  toCairoDateString,
} from "@/lib/cairo-time";
import { formatArabicDateString } from "@/lib/calendar-dates";
import { getSubscriptionState, SubscriptionState } from "@/lib/subscription";
import { AdminCard } from "@/components/admin/card";
import { AdminBadge } from "@/components/admin/badge";
import { AdminTable, AdminTableBody, AdminTableHead, AdminTd, AdminTh } from "@/components/admin/table";
import { AdminPagination } from "@/components/admin/pagination";
import { WhatsAppReminderButton } from "@/components/admin/whatsapp-reminder-button";
import { PaymentMethod, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

interface SearchParams {
  state?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: string;
}

const PAGE_SIZE = 20;

export default async function AdminSubscriptionsPage(props: {
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
  const stateFilter = searchParams.state?.trim() || "";
  const paymentMethodFilter = searchParams.paymentMethod?.trim() || "";
  const dateFrom = searchParams.dateFrom?.trim() || "";
  const dateTo = searchParams.dateTo?.trim() || "";
  const currentPage = Math.max(1, Number(searchParams.page) || 1);

  const where: Prisma.SubscriptionWhereInput = {};

  if (
    paymentMethodFilter &&
    ["CASH", "INSTAPAY", "VODAFONE_CASH", "OTHER"].includes(paymentMethodFilter)
  ) {
    where.paymentMethod = paymentMethodFilter as PaymentMethod;
  }

  if (dateFrom) {
    where.endsAt = {
      ...((where.endsAt as Prisma.DateTimeFilter) || {}),
      gte: cairoStartOfDay(dateFrom),
    };
  }

  if (dateTo) {
    where.endsAt = {
      ...((where.endsAt as Prisma.DateTimeFilter) || {}),
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
          phone: true,
          whatsapp: true,
          subscriptions: {
            select: { id: true, status: true, startsAt: true, endsAt: true },
          },
        },
      },
    },
    orderBy: {
      endsAt: "asc", // soonest ending first by default
    },
  });

  const now = new Date();

  // Map with derived states
  let items = subscriptions.map((sub) => {
    const provState = getSubscriptionState(sub.provider.subscriptions, now);
    const lastDayStr = getLastCoveredDateString(sub.endsAt);
    const remainingDays = daysUntil(sub.endsAt, now);

    return {
      id: sub.id,
      providerId: sub.provider.id,
      providerName: sub.provider.name,
      phone: sub.provider.phone,
      whatsapp: sub.provider.whatsapp,
      status: sub.status,
      provState,
      startsAtDateStr: toCairoDateString(sub.startsAt),
      lastCoveredDayDateStr: lastDayStr,
      lastCoveredDayFormatted: formatArabicDateString(lastDayStr),
      endsAt: sub.endsAt,
      remainingDays,
      amountPaid: sub.amountPaid,
      paymentMethod: sub.paymentMethod,
      createdAtFormatted: formatArabicDateString(toCairoDateString(sub.createdAt)),
    };
  });

  // Filter by state if provided
  if (stateFilter) {
    items = items.filter((item) => item.provState === stateFilter);
  }

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  const paginatedItems = items.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Build export query string
  const exportParams = new URLSearchParams();
  if (stateFilter) exportParams.set("state", stateFilter);
  if (paymentMethodFilter) exportParams.set("paymentMethod", paymentMethodFilter);
  if (dateFrom) exportParams.set("dateFrom", dateFrom);
  if (dateTo) exportParams.set("dateTo", dateTo);
  const exportUrl = `/api/admin/subscriptions/export?${exportParams.toString()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text sm:text-2xl">الاشتراكات</h1>
          <p className="mt-1 text-xs text-text-muted">
            متابعة تواريخ انتهاء الاشتراكات، المدفوعات وتذكيرات التجديد.
          </p>
        </div>
        <a
          href={exportUrl}
          download="subscriptions.csv"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-xs font-semibold text-text shadow-xs transition hover:bg-surface-muted"
        >
          <span>📥</span>
          <span>تصدير CSV</span>
        </a>
      </div>

      {/* Filter Bar */}
      <AdminCard className="p-4">
        <form method="GET" className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <div>
            <label className="block text-xs font-medium text-text mb-1">حالة الاشتراك</label>
            <select
              name="state"
              defaultValue={stateFilter}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">كل الحالات</option>
              <option value="ACTIVE">نشط</option>
              <option value="EXPIRING">أوشك على الانتهاء</option>
              <option value="EXPIRED">منتهي</option>
              <option value="FUTURE">مستقبلي</option>
              <option value="CANCELLED">ملغي</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1">طريقة الدفع</label>
            <select
              name="paymentMethod"
              defaultValue={paymentMethodFilter}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">كل الطرق</option>
              <option value="CASH">نقداً (كاش)</option>
              <option value="INSTAPAY">إنستاباي</option>
              <option value="VODAFONE_CASH">فودافون كاش</option>
              <option value="OTHER">أخرى</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1">تاريخ الانتهاء من</label>
            <input
              type="date"
              name="dateFrom"
              defaultValue={dateFrom}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text mb-1">تاريخ الانتهاء إلى</label>
            <input
              type="date"
              name="dateTo"
              defaultValue={dateTo}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="flex items-end gap-2 sm:col-span-2 md:col-span-4 lg:col-span-1">
            <button
              type="submit"
              className="w-full rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white hover:bg-accent-hover cursor-pointer"
            >
              تصفية
            </button>
            <Link
              href="/admin/subscriptions"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-text-muted hover:bg-surface-muted"
            >
              إلغاء
            </Link>
          </div>
        </form>
      </AdminCard>

      {/* Mobile View (Cards) */}
      <div className="space-y-3 md:hidden">
        {paginatedItems.length === 0 ? (
          <AdminCard className="p-6 text-center text-xs text-text-muted">
            لا توجد اشتراكات مطابقة للشروط.
          </AdminCard>
        ) : (
          paginatedItems.map((item) => (
            <AdminCard key={item.id} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/admin/providers/${item.providerId}`}
                  className="font-bold text-text hover:text-accent text-sm"
                >
                  {item.providerName}
                </Link>
                {renderStateBadge(item.provState)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-y border-border py-2 text-text">
                <div>
                  <span className="text-text-muted">ينتهي يوم: </span>
                  <span className="font-bold">{item.lastCoveredDayFormatted}</span>
                </div>
                <div>
                  <span className="text-text-muted">الأيام المتبقية: </span>
                  <span className="font-semibold text-warning">
                    {item.remainingDays > 0 ? `${item.remainingDays} يوم` : "منتهي"}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">المبلغ: </span>
                  <span className="font-bold">
                    {item.amountPaid !== null ? `${item.amountPaid} ج.م` : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">طريقة الدفع: </span>
                  <span>{formatPaymentMethod(item.paymentMethod)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                {(item.provState === "EXPIRING" || item.provState === "EXPIRED") && (
                  <WhatsAppReminderButton
                    phoneOrWhatsapp={item.whatsapp || item.phone}
                    providerName={item.providerName}
                    lastCoveredDateFormatted={item.lastCoveredDayFormatted}
                    state={item.provState}
                    variant="sm"
                  />
                )}
                <Link
                  href={`/admin/providers/${item.providerId}`}
                  className="mr-auto font-medium text-accent hover:underline"
                >
                  تفاصيل المقدم ←
                </Link>
              </div>
            </AdminCard>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <AdminTable>
          <AdminTableHead>
            <tr>
              <AdminTh>مقدم الخدمة</AdminTh>
              <AdminTh>الحالة</AdminTh>
              <AdminTh>آخر يوم مشمول</AdminTh>
              <AdminTh>الأيام المتبقية</AdminTh>
              <AdminTh>المبلغ</AdminTh>
              <AdminTh>طريقة الدفع</AdminTh>
              <AdminTh>تذكير واتساب</AdminTh>
              <AdminTh>إجراءات</AdminTh>
            </tr>
          </AdminTableHead>
          <AdminTableBody>
            {paginatedItems.length === 0 ? (
              <tr>
                <AdminTd colSpan={8} className="py-8 text-center text-xs text-text-muted">
                  لا توجد اشتراكات مطابقة للشروط.
                </AdminTd>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr key={item.id} className="hover:bg-surface-muted/50">
                  <AdminTd>
                    <Link
                      href={`/admin/providers/${item.providerId}`}
                      className="font-semibold text-text hover:text-accent"
                    >
                      {item.providerName}
                    </Link>
                  </AdminTd>
                  <AdminTd>{renderStateBadge(item.provState)}</AdminTd>
                  <AdminTd className="text-xs font-medium">
                    {item.lastCoveredDayFormatted}
                  </AdminTd>
                  <AdminTd>
                    {item.remainingDays > 0 ? (
                      <span
                        className={`text-xs font-bold ${
                          item.remainingDays <= 30 ? "text-warning" : "text-success"
                        }`}
                      >
                        {item.remainingDays} يوم
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-danger">منتهي</span>
                    )}
                  </AdminTd>
                  <AdminTd className="text-xs font-bold text-text">
                    {item.amountPaid !== null ? `${item.amountPaid} ج.م` : "-"}
                  </AdminTd>
                  <AdminTd className="text-xs">{formatPaymentMethod(item.paymentMethod)}</AdminTd>
                  <AdminTd>
                    {(item.provState === "EXPIRING" || item.provState === "EXPIRED") ? (
                      <WhatsAppReminderButton
                        phoneOrWhatsapp={item.whatsapp || item.phone}
                        providerName={item.providerName}
                        lastCoveredDateFormatted={item.lastCoveredDayFormatted}
                        state={item.provState}
                        variant="sm"
                      />
                    ) : (
                      <span className="text-xs text-text-muted">-</span>
                    )}
                  </AdminTd>
                  <AdminTd>
                    <Link
                      href={`/admin/providers/${item.providerId}`}
                      className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-surface-muted"
                    >
                      عرض الملف
                    </Link>
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

function renderStateBadge(state: SubscriptionState) {
  if (state === "ACTIVE") return <AdminBadge variant="success">نشط</AdminBadge>;
  if (state === "EXPIRING") return <AdminBadge variant="warning">أوشك على الانتهاء</AdminBadge>;
  if (state === "EXPIRED") return <AdminBadge variant="danger">منتهي</AdminBadge>;
  if (state === "FUTURE") return <AdminBadge variant="accent">مستقبلي</AdminBadge>;
  if (state === "CANCELLED") return <AdminBadge variant="neutral">ملغي</AdminBadge>;
  return <AdminBadge variant="neutral">بدون اشتراك</AdminBadge>;
}

function formatPaymentMethod(method: string | null) {
  if (method === "CASH") return "نقداً";
  if (method === "INSTAPAY") return "إنستاباي";
  if (method === "VODAFONE_CASH") return "فودافون كاش";
  if (method === "OTHER") return "أخرى";
  return "-";
}
