import Link from "next/link";
import { redirect } from "next/navigation";
import { WarningCircle, ArrowLeft } from "@phosphor-icons/react/dist/ssr";
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
import { isPhoneVerificationRequired } from "@/lib/review-eligibility";
import { formatMoney } from "@/lib/format-money";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">نظرة عامة</h1>
        <p className="mt-1 text-xs text-text-muted">
          إحصائيات المنصة، حالة مقدمي الخدمة والاشتراكات، ومتابعة الإيرادات.
        </p>
      </div>

      {/* Warning Alert if approved providers have no active sub */}
      {approvedWithoutSubCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[4px] border border-warning/40 bg-warning-muted p-4 text-warning">
          <div className="flex items-center gap-3">
            <WarningCircle className="h-5 w-5 shrink-0" weight="bold" />
            <div>
              <p className="text-sm font-semibold text-text">
                تنبيه: {approvedWithoutSubCount} مقدم خدمة معتمد ولكن غير ظاهر للعامة!
              </p>
              <p className="text-xs text-text-muted">
                تم اعتماد ملفاتهم ولكن ليس لديهم اشتراك فعّال يغطي الوقت الحالي.
              </p>
            </div>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link href="/admin/providers?status=APPROVED&subState=EXPIRED">
              عرض القائمة
            </Link>
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-text-muted">إجمالي المقدمين</p>
          <p className="mt-1 font-display text-2xl font-semibold text-text">{totalProviders}</p>
          <Link
            href="/admin/providers"
            className="mt-2 inline-flex items-center gap-1 text-xs text-accent-text hover:underline"
          >
            عرض الكل <ArrowLeft className="h-3 w-3" />
          </Link>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-text-muted">قيد المراجعة</p>
          <p className="mt-1 font-display text-2xl font-semibold text-warning">
            {pendingProvidersCount}
          </p>
          <Link
            href="/admin/providers?status=PENDING"
            className="mt-2 inline-flex items-center gap-1 text-xs text-accent-text hover:underline"
          >
            مراجعة الطلبات <ArrowLeft className="h-3 w-3" />
          </Link>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-text-muted">اشتراكات فعّالة</p>
          <p className="mt-1 font-display text-2xl font-semibold text-success">{activeCount}</p>
          <Link
            href="/admin/subscriptions?state=ACTIVE"
            className="mt-2 inline-flex items-center gap-1 text-xs text-accent-text hover:underline"
          >
            عرض الفعّالة <ArrowLeft className="h-3 w-3" />
          </Link>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-text-muted">تنتهي خلال 30 يوماً</p>
          <p className="mt-1 font-display text-2xl font-semibold text-warning">{expiringCount}</p>
          <Link
            href="/admin/subscriptions?state=EXPIRING"
            className="mt-2 inline-flex items-center gap-1 text-xs text-accent-text hover:underline"
          >
            متابعة التجديد <ArrowLeft className="h-3 w-3" />
          </Link>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-text-muted">اشتراكات منتهية</p>
          <p className="mt-1 font-display text-2xl font-semibold text-danger">{expiredCount}</p>
          <Link
            href="/admin/subscriptions?state=EXPIRED"
            className="mt-2 inline-flex items-center gap-1 text-xs text-accent-text hover:underline"
          >
            عرض المنتهية <ArrowLeft className="h-3 w-3" />
          </Link>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-text-muted">معتمدون بلا اشتراك</p>
          <p className="mt-1 font-display text-2xl font-semibold text-text">
            {approvedWithoutSubCount}
          </p>
          <span className="mt-2 block text-xs text-text-muted">غير ظاهرين للزوار</span>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-text-muted">إيرادات هذا الشهر</p>
          <p className="mt-1 font-display text-xl font-semibold text-text">
            {formatMoney(revenueMonth)}
          </p>
          <span className="mt-2 block text-xs text-text-muted">بتوقيت القاهرة</span>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-text-muted">إيرادات هذا العام / الإجمالي</p>
          <p className="mt-1 font-display text-base font-semibold text-text">
            {formatMoney(revenueYear)}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            الإجمالي: {formatMoney(revenueTotal)}
          </p>
        </Card>
      </div>

      {/* Top 5 Lists */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Pending Approval */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>بانتظار المراجعة</CardTitle>
              <Link
                href="/admin/providers?status=PENDING"
                className="text-xs font-medium text-accent-text hover:underline"
              >
                عرض الكل
              </Link>
            </div>
            <CardDescription>أحدث 5 طلبات انضمام</CardDescription>
          </CardHeader>
          <CardContent>
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
                        className="text-sm font-semibold text-text hover:text-accent-text"
                      >
                        {p.name}
                      </Link>
                      <p className="text-xs text-text-muted">
                        {DISTRICT_LABELS[p.district]} •{" "}
                        {formatArabicDateString(toCairoDateString(p.createdAt))}
                      </p>
                    </div>
                    <Badge variant="warning">قيد المراجعة</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Expiring Soonest */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>الأقرب انتهاءً</CardTitle>
              <Link
                href="/admin/subscriptions?state=EXPIRING"
                className="text-xs font-medium text-accent-text hover:underline"
              >
                عرض الكل
              </Link>
            </div>
            <CardDescription>الاشتراكات التي ستنتهي قريباً</CardDescription>
          </CardHeader>
          <CardContent>
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
                          className="text-sm font-semibold text-text hover:text-accent-text"
                        >
                          {sub.provider.name}
                        </Link>
                        <p className="text-xs text-text-muted">
                          ينتهي: {formatArabicDateString(lastDay)}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-warning">
                        {days > 0 ? `متبقي ${days} يوم` : "ينتهي اليوم"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recently Expired */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>انتهت مؤخراً</CardTitle>
              <Link
                href="/admin/subscriptions?state=EXPIRED"
                className="text-xs font-medium text-accent-text hover:underline"
              >
                عرض الكل
              </Link>
            </div>
            <CardDescription>اشتراكات انتهت حديثاً للتواصل</CardDescription>
          </CardHeader>
          <CardContent>
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
                          className="text-sm font-semibold text-text hover:text-accent-text"
                        >
                          {sub.provider.name}
                        </Link>
                        <p className="text-xs text-text-muted">
                          انتهى: {formatArabicDateString(lastDay)}
                        </p>
                      </div>
                      <Badge variant="danger">منتهي</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Status & Feature Flags Card */}
      <Card>
        <CardHeader>
          <CardTitle>حالة النظام والإعدادات</CardTitle>
          <CardDescription>
            مؤشرات تفعيل الميزات والتكاملات الخارجية في البيئة الحالية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            <div className="rounded-[4px] border border-border bg-surface-muted/50 p-3 flex items-center justify-between gap-2">
              <span className="text-text-muted">تأكيد الهاتف للتقييم</span>
              <Badge variant={isPhoneVerificationRequired() ? "success" : "neutral"} size="sm">
                {isPhoneVerificationRequired() ? "مفعّل" : "معطّل"}
              </Badge>
            </div>
            <div className="rounded-[4px] border border-border bg-surface-muted/50 p-3 flex items-center justify-between gap-2">
              <span className="text-text-muted">مزود SMS</span>
              <Badge variant="neutral" size="sm" className="font-latin">
                {process.env.SMS_PROVIDER || "console"}
              </Badge>
            </div>
            <div className="rounded-[4px] border border-border bg-surface-muted/50 p-3 flex items-center justify-between gap-2">
              <span className="text-text-muted">Webhook الطلبات</span>
              <Badge variant={process.env.LEADS_WEBHOOK_URL ? "success" : "neutral"} size="sm">
                {process.env.LEADS_WEBHOOK_URL ? "مفعّل" : "غير مضبوط"}
              </Badge>
            </div>
            <div className="rounded-[4px] border border-border bg-surface-muted/50 p-3 flex items-center justify-between gap-2">
              <span className="text-text-muted">Cloudinary</span>
              <Badge variant={process.env.CLOUDINARY_CLOUD_NAME ? "success" : "warning"} size="sm">
                {process.env.CLOUDINARY_CLOUD_NAME ? "مفعّل" : "غير مضبوط"}
              </Badge>
            </div>
            <div className="rounded-[4px] border border-border bg-surface-muted/50 p-3 flex items-center justify-between gap-2">
              <span className="text-text-muted">Google OAuth</span>
              <Badge variant={process.env.GOOGLE_CLIENT_ID ? "success" : "warning"} size="sm">
                {process.env.GOOGLE_CLIENT_ID ? "مفعّل" : "غير مضبوط"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
