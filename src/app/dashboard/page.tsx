import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireProviderPage } from "@/lib/provider-dashboard";
import { getProviderLimits } from "@/lib/limits";
import { DISTRICT_LABELS } from "@/lib/districts";
import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<
  "PENDING" | "APPROVED" | "SUSPENDED",
  { label: string; className: string }
> = {
  PENDING: {
    label: "قيد المراجعة",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  APPROVED: {
    label: "معتمد",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  SUSPENDED: {
    label: "موقوف",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

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
  const [offerCount, imageCount, videoCount, activeSubscription] =
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
    ]);

  const limits = getProviderLimits(provider);
  const badge = STATUS_BADGE[provider.status];
  const isVisible =
    provider.status === "APPROVED" && Boolean(activeSubscription);

  let visibilityMessage: string;
  if (isVisible) {
    visibilityMessage = "ملفك ظاهر حالياً للزوار في نتائج البحث.";
  } else if (provider.status === "SUSPENDED") {
    visibilityMessage =
      "ملفك غير ظاهر للزوار لأن الحساب موقوف. تواصل مع الإدارة.";
  } else if (provider.status === "PENDING" && !activeSubscription) {
    visibilityMessage =
      "ملفك غير ظاهر للزوار لأن حسابك قيد المراجعة ولا يوجد اشتراك فعّال حالياً.";
  } else if (provider.status === "PENDING") {
    visibilityMessage =
      "ملفك غير ظاهر للزوار لأن حسابك لا يزال قيد المراجعة من الإدارة.";
  } else {
    visibilityMessage =
      "ملفك غير ظاهر للزوار لعدم وجود اشتراك فعّال حالياً.";
  }

  const checklistItems = [
    {
      label: "اسم النشاط",
      done: Boolean(provider.name.trim()),
      href: "/dashboard/profile",
    },
    {
      label: "النبذة التعريفية",
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
      label: "صورة الشعار",
      done: Boolean(provider.logoUrl),
      href: "/dashboard/profile",
    },
    {
      label: "3 صور في المعرض على الأقل",
      done: imageCount >= 3,
      href: "/dashboard/gallery",
    },
    {
      label: "عرض واحد على الأقل",
      done: offerCount >= 1,
      href: "/dashboard/offers",
    },
  ];

  const completedCount = checklistItems.filter((item) => item.done).length;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{provider.name}</h1>
            <p className="text-xs text-gray-500">
              {DISTRICT_LABELS[provider.district]} •{" "}
              <span dir="ltr" className="font-mono">
                {provider.slug}
              </span>
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>

        <div
          className={`mt-4 rounded-lg border p-3 text-sm ${
            isVisible
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-gray-200 bg-gray-50 text-gray-700"
          }`}
        >
          <p className="font-semibold">
            {isVisible ? "الحالة على الموقع: ظاهر للزوار" : "الحالة على الموقع: غير ظاهر"}
          </p>
          <p className="mt-1 text-xs">{visibilityMessage}</p>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900">حالة الاشتراك</h2>
        {activeSubscription ? (
          <div className="mt-2 space-y-1 text-sm text-gray-700">
            <p>
              الاشتراك فعّال حتى:{" "}
              <span className="font-semibold text-green-700">
                {activeSubscription.endsAt.toLocaleDateString("ar-EG", {
                  timeZone: "Africa/Cairo",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </p>
            {activeSubscription.planName && (
              <p className="text-xs text-gray-500">
                الباقة: {activeSubscription.planName}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm font-medium text-gray-600">
            لا يوجد اشتراك فعّال
          </p>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900">الاستخدام والحدود المتاحة</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/dashboard/offers"
            className="rounded-lg border border-gray-200 p-3 transition hover:border-blue-300 hover:bg-blue-50/40"
          >
            <p className="text-xs text-gray-500">العروض</p>
            <p className="mt-1 text-base font-bold text-gray-900">
              استخدمت {offerCount} من {limits.offers}
            </p>
          </Link>
          <Link
            href="/dashboard/gallery"
            className="rounded-lg border border-gray-200 p-3 transition hover:border-blue-300 hover:bg-blue-50/40"
          >
            <p className="text-xs text-gray-500">الصور</p>
            <p className="mt-1 text-base font-bold text-gray-900">
              استخدمت {imageCount} من {limits.images}
            </p>
          </Link>
          <Link
            href="/dashboard/gallery"
            className="rounded-lg border border-gray-200 p-3 transition hover:border-blue-300 hover:bg-blue-50/40"
          >
            <p className="text-xs text-gray-500">الفيديوهات</p>
            <p className="mt-1 text-base font-bold text-gray-900">
              استخدمت {videoCount} من {limits.videos}
            </p>
          </Link>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-gray-900">اكتمال الملف الشخصي</h2>
          <span className="text-xs font-semibold text-gray-600">
            {completedCount} من {checklistItems.length}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          قائمة إرشادية لمساعدتك على تجهيز ملف جذاب للزوار.
        </p>

        <ul className="mt-3 divide-y divide-gray-100">
          {checklistItems.map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between gap-2 py-2.5 text-sm"
            >
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                    item.done
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {item.done ? "✓" : "○"}
                </span>
                <span className={item.done ? "text-gray-700" : "font-medium text-gray-900"}>
                  {item.label}
                </span>
              </div>
              {!item.done && (
                <Link
                  href={item.href}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  إكمال
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
