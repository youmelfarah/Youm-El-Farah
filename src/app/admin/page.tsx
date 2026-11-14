import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  addMonthsCairo,
  cairoStartOfDay,
  daysUntil,
  getLastCoveredDateString,
  toCairoDateString,
} from "@/lib/cairo-time";
import { formatArabicDateString } from "@/lib/calendar-dates";
import { DISTRICT_LABELS } from "@/lib/districts";
import { getSubscriptionState } from "@/lib/subscription";
import { AdminCard, AdminCardHeader } from "@/components/admin/card";
import { AdminBadge } from "@/components/admin/badge";

export const dynamic = "force-dynamic";

export default async function AdminDashboardOverviewPage() {
  try {
    await requireRole("ADMIN");
  } catch (err) {
    if (err instanceof AuthError && err.code === "FORBIDDEN") {
      redirect("/unauthorized");
    }
    redirect("/login");
  }

  const now = new Date();
  const todayStr = toCairoDateString(now);
  const [currentYear, currentMonth] = todayStr.split("-").map(Number);
  const monthStartStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
  const nextMonthStartStr = addMonthsCairo(monthStartStr, 1);
  const yearStartStr = `${currentYear}-01-01`;
  const nextYearStartStr = `${currentYear + 1}-01-01`;

  const startOfMonth = cairoStartOfDay(monthStartStr);
  const startOfNextMonth = cairoStartOfDay(nextMonthStartStr);
  const startOfYear = cairoStartOfDay(yearStartStr);
  const startOfNextYear = cairoStartOfDay(nextYearStartStr);

  const [
    totalProviders,
    pendingProvidersCount,
    providersWithSubs,
    revenueMonthAgg,
    revenueYearAgg,
    revenueTotalAgg,
    pendingList,
    expiringSoonestSubs,
    recentlyExpiredSubs,
  ] = await Promise.all([
    prisma.provider.count(),
    prisma.provider.count({ where: { status: "PENDING" } }),
    prisma.provider.findMany({
      select: {
        id: true,
        status: true,
        subscriptions: {
          select: {
            id: true,
            status: true,
            startsAt: true,
            endsAt: true,
          },
        },
      },
    }),
    prisma.subscription.aggregate({
      _sum: { amountPaid: true },
      where: {
        createdAt: { gte: startOfMonth, lt: startOfNextMonth },
      },
    }),
    prisma.subscription.aggregate({
      _sum: { amountPaid: true },
      where: {
        createdAt: { gte: startOfYear, lt: startOfNextYear },
      },
    }),
    prisma.subscription.aggregate({
      _sum: { amountPaid: true },
    }),
    prisma.provider.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true,
        district: true,
        createdAt: true,
      },
    }),
    prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        startsAt: { lte: now },
        endsAt: { gt: now },
      },
      orderBy: { endsAt: "asc" },
      take: 5,
      select: {
        id: true,
        endsAt: true,
        provider: {
          select: {
            id: true,
            name: true,
            district: true,
          },
        },
      },
    }),
    prisma.subscription.findMany({
      where: {
        status: "ACTIVE",
        endsAt: { lte: now },
      },
      orderBy: { endsAt: "desc" },
      take: 5,
      select: {
        id: true,
        endsAt: true,
        provider: {
          select: {
            id: true,
            name: true,
            district: true,
          },
        },
      },
    }),
  ]);

  let activeCount = 0;
  let expiringCount = 0;
  let expiredCount = 0;
  let approvedWithoutSubCount = 0;

  for (const prov of providersWithSubs) {
    const state = getSubscriptionState(prov.subscriptions, now);
    if (state === "ACTIVE") activeCount++;
    else if (state === "EXPIRING") expiringCount++;
    else if (state === "EXPIRED") expiredCount++;

    if (
      prov.status === "APPROVED" &&
      state !== "ACTIVE" &&
      state !== "EXPIRING"
    ) {
      approvedWithoutSubCount++;
    }
  }

  const revenueMonth = revenueMonthAgg._sum.amountPaid ?? 0;
  const revenueYear = revenueYearAgg._sum.amountPaid ?? 0;
  const revenueTotal = revenueTotalAgg._sum.amountPaid ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text sm:text-2xl">نظرة عامة</h1>
        <p className="mt-1 text-xs text-text-muted">
          إحصائيات المنصة، حالة مقدمي الخدمة والاشتراكات، ومتابعة الإيرادات.
        </p>
      </div>

      {/* Warning Alert if approved providers have no active sub */}
      {approvedWithoutSubCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-warning bg-warning-muted p-4 text-warning">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm font-bold">
                تنبيه: {approvedWithoutSubCount} مقدم خدمة معتمد ولكن غير ظاهر للعامة!
              </p>
              <p className="text-xs text-text-muted">
                تم اعتماد ملفاتهم ولكن ليس لديهم اشتراك فعّال يغطي الوقت الحالي.
              </p>
            </div>
          </div>
          <Link
            href="/admin/providers?status=APPROVED&subState=EXPIRED"
            className="rounded-lg bg-surface px-3 py-1.5 text-xs font-semibold text-text border border-border shadow-xs hover:bg-surface-muted"
          >
            عرض القائمة
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <AdminCard className="p-4">
          <p className="text-xs text-text-muted">إجمالي المقدمين</p>
          <p className="mt-1 text-2xl font-black text-text">{totalProviders}</p>
          <Link
            href="/admin/providers"
            className="mt-2 block text-xs text-accent hover:underline"
          >
            عرض الكل ←
          </Link>
        </AdminCard>

        <AdminCard className="p-4">
          <p className="text-xs text-text-muted">قيد المراجعة</p>
          <p className="mt-1 text-2xl font-black text-warning">
            {pendingProvidersCount}
          </p>
          <Link
            href="/admin/providers?status=PENDING"
            className="mt-2 block text-xs text-accent hover:underline"
          >
            مراجعة الطلبات ←
          </Link>
        </AdminCard>

        <AdminCard className="p-4">
          <p className="text-xs text-text-muted">اشتراكات فعّالة</p>
          <p className="mt-1 text-2xl font-black text-success">{activeCount}</p>
          <Link
            href="/admin/subscriptions?state=ACTIVE"
            className="mt-2 block text-xs text-accent hover:underline"
          >
            عرض الفعّالة ←
          </Link>
        </AdminCard>

        <AdminCard className="p-4">
          <p className="text-xs text-text-muted">تنتهي خلال 30 يوماً</p>
          <p className="mt-1 text-2xl font-black text-warning">{expiringCount}</p>
          <Link
            href="/admin/subscriptions?state=EXPIRING"
            className="mt-2 block text-xs text-accent hover:underline"
          >
            متابعة التجديد ←
          </Link>
        </AdminCard>

        <AdminCard className="p-4">
          <p className="text-xs text-text-muted">اشتراكات منتهية</p>
          <p className="mt-1 text-2xl font-black text-danger">{expiredCount}</p>
          <Link
            href="/admin/subscriptions?state=EXPIRED"
            className="mt-2 block text-xs text-accent hover:underline"
          >
            عرض المنتهية ←
          </Link>
        </AdminCard>

        <AdminCard className="p-4">
          <p className="text-xs text-text-muted">معتمدون بلا اشتراك</p>
          <p className="mt-1 text-2xl font-black text-text">
            {approvedWithoutSubCount}
          </p>
          <span className="mt-2 block text-xs text-text-muted">غير ظاهرين للزوار</span>
        </AdminCard>

        <AdminCard className="p-4">
          <p className="text-xs text-text-muted">إيرادات هذا الشهر</p>
          <p className="mt-1 text-xl font-black text-text">
            {revenueMonth.toLocaleString("ar-EG")} <span className="text-xs font-normal">ج.م</span>
          </p>
          <span className="mt-2 block text-xs text-text-muted">بتوقيت القاهرة</span>
        </AdminCard>

        <AdminCard className="p-4">
          <p className="text-xs text-text-muted">إيرادات هذا العام / الإجمالي</p>
          <p className="mt-1 text-base font-bold text-text">
            {revenueYear.toLocaleString("ar-EG")} <span className="text-xs font-normal">ج.م</span>
          </p>
          <p className="mt-1 text-xs text-text-muted">
            الإجمالي: {revenueTotal.toLocaleString("ar-EG")} ج.م
          </p>
        </AdminCard>
      </div>

      {/* Top 5 Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pending Approval */}
        <AdminCard className="p-4 sm:p-5">
          <AdminCardHeader
            title="بانتظار المراجعة"
            subtitle="أحدث 5 طلبات انضمام"
            action={
              <Link
                href="/admin/providers?status=PENDING"
                className="text-xs font-medium text-accent hover:underline"
              >
                عرض الكل
              </Link>
            }
          />
          {pendingList.length === 0 ? (
            <p className="py-4 text-center text-xs text-text-muted">
              لا توجد طلبات جديدة بانتظار المراجعة.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {pendingList.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <Link
                      href={`/admin/providers/${p.id}`}
                      className="text-sm font-semibold text-text hover:text-accent"
                    >
                      {p.name}
                    </Link>
                    <p className="text-xs text-text-muted">
                      {DISTRICT_LABELS[p.district]} •{" "}
                      {formatArabicDateString(toCairoDateString(p.createdAt))}
                    </p>
                  </div>
                  <AdminBadge variant="warning">قيد المراجعة</AdminBadge>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        {/* Expiring Soonest */}
        <AdminCard className="p-4 sm:p-5">
          <AdminCardHeader
            title="الأقرب انتهاءً"
            subtitle="الاشتراكات التي ستنتهي قريباً"
            action={
              <Link
                href="/admin/subscriptions?state=EXPIRING"
                className="text-xs font-medium text-accent hover:underline"
              >
                عرض الكل
              </Link>
            }
          />
          {expiringSoonestSubs.length === 0 ? (
            <p className="py-4 text-center text-xs text-text-muted">
              لا توجد اشتراكات فعّالة حالياً.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {expiringSoonestSubs.map((sub) => {
                const days = daysUntil(sub.endsAt, now);
                const lastDay = getLastCoveredDateString(sub.endsAt);
                return (
                  <li key={sub.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <Link
                        href={`/admin/providers/${sub.provider.id}`}
                        className="text-sm font-semibold text-text hover:text-accent"
                      >
                        {sub.provider.name}
                      </Link>
                      <p className="text-xs text-text-muted">
                        ينتهي: {formatArabicDateString(lastDay)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-warning">
                      {days > 0 ? `متبقي ${days} يوم` : "ينتهي اليوم"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminCard>

        {/* Recently Expired */}
        <AdminCard className="p-4 sm:p-5">
          <AdminCardHeader
            title="انتهت مؤخراً"
            subtitle="اشتراكات انتهت حديثاً للتواصل"
            action={
              <Link
                href="/admin/subscriptions?state=EXPIRED"
                className="text-xs font-medium text-accent hover:underline"
              >
                عرض الكل
              </Link>
            }
          />
          {recentlyExpiredSubs.length === 0 ? (
            <p className="py-4 text-center text-xs text-text-muted">
              لا توجد اشتراكات منتهية.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recentlyExpiredSubs.map((sub) => {
                const lastDay = getLastCoveredDateString(sub.endsAt);
                return (
                  <li key={sub.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <Link
                        href={`/admin/providers/${sub.provider.id}`}
                        className="text-sm font-semibold text-text hover:text-accent"
                      >
                        {sub.provider.name}
                      </Link>
                      <p className="text-xs text-text-muted">
                        انتهى: {formatArabicDateString(lastDay)}
                      </p>
                    </div>
                    <AdminBadge variant="danger">منتهي</AdminBadge>
                  </li>
                );
              })}
            </ul>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
