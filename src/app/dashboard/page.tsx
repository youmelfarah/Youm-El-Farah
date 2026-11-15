import Link from "next/link";
import { CheckCircle, Circle, ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { requireProviderPage } from "@/lib/provider-dashboard";
import { getProviderLimits } from "@/lib/limits";
import { DISTRICT_LABELS } from "@/lib/districts";
import { getProviderStatsSummary } from "@/lib/provider-stats";
import { OnboardingForm } from "./onboarding-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProviderStatsCard } from "@/components/dashboard/provider-stats-card";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireProviderPage();

  const provider = await prisma.provider.findUnique({
    where: { userId: session.user.id },
    include: {
      categories: true,
    },
  });

  if (!provider) {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { nameAr: "asc" }],
      select: { id: true, nameAr: true },
    });

    return (
      <OnboardingForm
        categories={categories}
        defaultName={session.user.name || ""}
      />
    );
  }

  const now = new Date();
  const [offerCount, imageCount, videoCount, activeSubscription, stats] =
    await Promise.all([
      prisma.offer.count({ where: { providerId: provider.id } }),
      prisma.media.count({ where: { providerId: provider.id, type: "IMAGE" } }),
      prisma.media.count({ where: { providerId: provider.id, type: "VIDEO" } }),
      prisma.subscription.findFirst({
        where: {
          providerId: provider.id,
          status: "ACTIVE",
          startsAt: { lte: now },
          endsAt: { gt: now },
        },
        orderBy: { endsAt: "desc" },
      }),
      getProviderStatsSummary(provider.id),
    ]);

  const limits = getProviderLimits(provider);
  const isVisible =
    provider.status === "APPROVED" && Boolean(activeSubscription);

  let visibilityMessage: string;
  if (isVisible) {
    visibilityMessage = "ملفك ظاهر حالياً للزوار في نتائج البحث ودليل الخدمات.";
  } else if (provider.status === "SUSPENDED") {
    visibilityMessage =
      "ملفك غير ظاهر للزوار لأن الحساب موقوف. يرجى التواصل مع الإدارة.";
  } else if (provider.status === "PENDING" && !activeSubscription) {
    visibilityMessage =
      "ملفك غير ظاهر للزوار لأن حسابك قيد المراجعة ولا يوجد اشتراك فعّال حالياً.";
  } else if (provider.status === "PENDING") {
    visibilityMessage =
      "ملفك غير ظاهر للزوار لأن حسابك لا يزال قيد المراجعة والاعتماد من الإدارة.";
  } else {
    visibilityMessage =
      "ملفك غير ظاهر للزوار لعدم وجود اشتراك فعّال حالياً.";
  }

  const checklistItems = [
    {
      label: "اسم النشاط التجاري",
      done: Boolean(provider.name.trim()),
      href: "/dashboard/profile",
    },
    {
      label: "النبذة التعريفية للخدمات",
      done: Boolean(provider.bio && provider.bio.trim().length > 0),
      href: "/dashboard/profile",
    },
    {
      label: "المركز / المدينة",
      done: Boolean(provider.district),
      href: "/dashboard/profile",
    },
    {
      label: "تصنيف واحد على الأقل",
      done: provider.categories.length >= 1,
      href: "/dashboard/profile",
    },
    {
      label: "وسيلة تواصل (هاتف أو واتساب)",
      done: Boolean(provider.phone || provider.whatsapp),
      href: "/dashboard/profile",
    },
    {
      label: "صورة الشعار أو الغلاف",
      done: Boolean(provider.logoUrl),
      href: "/dashboard/profile",
    },
    {
      label: "3 صور في المعرض على الأقل",
      done: imageCount >= 3,
      href: "/dashboard/gallery",
    },
    {
      label: "عرض أو باقة واحدة على الأقل",
      done: offerCount >= 1,
      href: "/dashboard/offers",
    },
  ];

  const completedCount = checklistItems.filter((item) => item.done).length;

  return (
    <div className="space-y-6">
      {/* Provider Header Card */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
                {provider.name}
              </h1>
              <p className="mt-1 text-xs text-text-muted">
                {DISTRICT_LABELS[provider.district]} •{" "}
                <span dir="ltr" className="font-mono font-latin">
                  {provider.slug}
                </span>
              </p>
            </div>
            {provider.status === "APPROVED" && <Badge variant="success">معتمد</Badge>}
            {provider.status === "PENDING" && <Badge variant="warning">قيد المراجعة</Badge>}
            {provider.status === "SUSPENDED" && <Badge variant="danger">موقوف</Badge>}
          </div>

          <div
            className={`mt-5 rounded-[4px] border p-4 text-xs ${
              isVisible
                ? "border-success/30 bg-success-muted text-success"
                : "border-border bg-surface-muted text-text-muted"
            }`}
          >
            <p className="font-semibold text-text">
              {isVisible ? "الحالة على المنصة: ظاهر للزوار" : "الحالة على المنصة: غير ظاهر للعامة"}
            </p>
            <p className="mt-1 leading-relaxed">{visibilityMessage}</p>
          </div>
        </CardContent>
      </Card>

      {/* 30-Day Activity & Engagement Stats */}
      <ProviderStatsCard stats={stats} />

      {/* Subscription Card */}
      <Card>
        <CardHeader>
          <CardTitle>حالة الاشتراك والباقة</CardTitle>
          <CardDescription>متابعة فترة التغطية وتاريخ التجديد</CardDescription>
        </CardHeader>
        <CardContent>
          {activeSubscription ? (
            <div className="space-y-1.5 text-xs text-text">
              <p>
                الاشتراك فعّال حتى:{" "}
                <strong className="font-latin text-sm text-text">
                  {activeSubscription.endsAt.toLocaleDateString("en-US", {
                    timeZone: "Africa/Cairo",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </strong>
              </p>
              {activeSubscription.planName && (
                <p className="text-text-muted">
                  الباقة المسجلة: {activeSubscription.planName}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-text-muted font-medium">
                لا يوجد اشتراك فعّال حالياً يغطي هذا النشاط.
              </p>
              <Badge variant="warning" size="sm">
                غير مشترك
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage & Limits */}
      <Card>
        <CardHeader>
          <CardTitle>الاستخدام والحدود المتاحة</CardTitle>
          <CardDescription>السعة المسموحة حسب باقة الاشتراك الحالية</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              href="/dashboard/offers"
              className="rounded-[4px] border border-border bg-surface-raised p-4 transition-colors hover:border-border-strong hover:bg-surface-muted"
            >
              <span className="text-xs text-text-muted">العروض والباقات</span>
              <p className="mt-1 font-latin text-lg font-semibold text-text">
                {offerCount} / {limits.offers}
              </p>
            </Link>
            <Link
              href="/dashboard/gallery"
              className="rounded-[4px] border border-border bg-surface-raised p-4 transition-colors hover:border-border-strong hover:bg-surface-muted"
            >
              <span className="text-xs text-text-muted">معرض الصور</span>
              <p className="mt-1 font-latin text-lg font-semibold text-text">
                {imageCount} / {limits.images}
              </p>
            </Link>
            <Link
              href="/dashboard/gallery"
              className="rounded-[4px] border border-border bg-surface-raised p-4 transition-colors hover:border-border-strong hover:bg-surface-muted"
            >
              <span className="text-xs text-text-muted">مقاطع الفيديو</span>
              <p className="mt-1 font-latin text-lg font-semibold text-text">
                {videoCount} / {limits.videos}
              </p>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Profile Completion Checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>اكتمال الملف التعريفي</CardTitle>
            <span className="font-latin text-xs font-semibold text-text">
              {completedCount} / {checklistItems.length}
            </span>
          </div>
          <CardDescription>
            قائمة إرشادية لمساعدتكِ على تجهيز ملف جذاب وجاهز للزوار.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border/60">
            {checklistItems.map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between gap-3 py-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  {item.done ? (
                    <CheckCircle className="h-4 w-4 text-success shrink-0" weight="fill" />
                  ) : (
                    <Circle className="h-4 w-4 text-text-muted/40 shrink-0" weight="regular" />
                  )}
                  <span className={item.done ? "text-text" : "font-medium text-text-muted"}>
                    {item.label}
                  </span>
                </div>
                {!item.done && (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={item.href} className="inline-flex items-center gap-1 text-accent-text">
                      <span>إكمال</span>
                      <ArrowLeft className="h-3 w-3" />
                    </Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
