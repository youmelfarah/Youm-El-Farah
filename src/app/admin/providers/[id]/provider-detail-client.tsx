"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminButton } from "@/components/ui/button";
import { AdminCard, AdminCardHeader } from "@/components/ui/card";
import { AdminInput, AdminSelect, AdminTextarea } from "@/components/ui/input";
import { AdminBadge } from "@/components/ui/badge";
import { AdminTable, AdminTableBody, AdminTableHead, AdminTd, AdminTh } from "@/components/ui/table";
import { WhatsAppReminderButton } from "@/components/admin/whatsapp-reminder-button";
import { ABSOLUTE_MAX, DEFAULT_LIMITS } from "@/lib/limits";
import { formatArabicDateString } from "@/lib/calendar-dates";
import {
  approveProviderAction,
  cancelProviderSubscriptionAction,
  createProviderSubscriptionAction,
  reactivateProviderAction,
  suspendProviderAction,
  updateProviderLimitsAction,
  updateProviderNotesAction,
} from "../actions";
import {
  resetProviderPasswordAction,
  toggleProviderActiveAction,
} from "@/app/admin/provider-accounts/actions";
import { SubscriptionState } from "@/lib/subscription";
import { PaymentMethod, ProviderStatus } from "@prisma/client";

interface ProviderDetailProps {
  provider: {
    id: string;
    slug: string;
    name: string;
    bio: string | null;
    districtLabel: string;
    address: string | null;
    phone: string | null;
    whatsapp: string | null;
    instagramUrl: string | null;
    facebookUrl: string | null;
    logoUrl: string | null;
    coverUrl: string | null;
    status: ProviderStatus;
    maxOffers: number | null;
    maxImages: number | null;
    maxVideos: number | null;
    adminNotes: string | null;
    averageRating: number;
    reviewCount: number;
    createdAtFormatted: string;
    categories: Array<{ id: string; nameAr: string; isPrimary: boolean }>;
    counts: {
      offers: number;
      images: number;
      videos: number;
      blockedDates: number;
    };
    user: {
      id: string;
      email: string;
      isActive: boolean;
      mustChangePassword: boolean;
    };
    subscriptionSummary: {
      state: SubscriptionState;
      startsAtDateStr: string | null;
      lastCoveredDayDateStr: string | null;
      lastCoveredDayFormatted: string | null;
      daysRemaining: number | null;
      activeSubscriptionId: string | null;
      suggestedStartDate: string;
    };
    subscriptionsHistory: Array<{
      id: string;
      status: string;
      startsAtFormatted: string;
      lastCoveredDayFormatted: string;
      amountPaid: number | null;
      paymentMethod: string | null;
      paymentNote: string | null;
      planName: string | null;
      createdByName: string;
      createdAtFormatted: string;
    }>;
    recentActivity: Array<{
      id: string;
      action: string;
      adminName: string;
      createdAtFormatted: string;
      details: any;
    }>;
  };
}

export function ProviderDetailClient({ provider }: ProviderDetailProps) {
  const router = useRouter();

  // Status Actions state
  const [statusLoading, setStatusLoading] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [statusError, setStatusError] = useState("");

  // Limits state
  const [maxOffers, setMaxOffers] = useState<string>(
    provider.maxOffers !== null ? String(provider.maxOffers) : ""
  );
  const [maxImages, setMaxImages] = useState<string>(
    provider.maxImages !== null ? String(provider.maxImages) : ""
  );
  const [maxVideos, setMaxVideos] = useState<string>(
    provider.maxVideos !== null ? String(provider.maxVideos) : ""
  );
  const [limitsLoading, setLimitsLoading] = useState(false);
  const [limitsSuccess, setLimitsSuccess] = useState(false);
  const [limitsError, setLimitsError] = useState("");

  // Admin notes state
  const [adminNotes, setAdminNotes] = useState(provider.adminNotes || "");
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesSuccess, setNotesSuccess] = useState(false);
  const [notesError, setNotesError] = useState("");

  // Subscription form state
  const [durationPreset, setDurationPreset] = useState<"6" | "12" | "custom">("12");
  const [subStartDate, setSubStartDate] = useState(
    provider.subscriptionSummary.suggestedStartDate
  );
  const [customEndDate, setCustomEndDate] = useState("");
  const [amountPaid, setAmountPaid] = useState<string>("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [paymentNote, setPaymentNote] = useState("");
  const [planName, setPlanName] = useState("");
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState("");
  const [subSuccess, setSubSuccess] = useState(false);

  // Cancel subscription state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Account actions state
  const [accountIsActive, setAccountIsActive] = useState(provider.user.isActive);
  const [accountLoading, setAccountLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [accountError, setAccountError] = useState("");

  // 1. Status Handlers
  async function handleApprove() {
    setStatusLoading(true);
    setStatusError("");
    const res = await approveProviderAction({ providerId: provider.id });
    setStatusLoading(false);
    if (res.error) setStatusError(res.error);
    else router.refresh();
  }

  async function handleSuspend() {
    setStatusLoading(true);
    setStatusError("");
    const res = await suspendProviderAction({
      providerId: provider.id,
      reason: suspendReason,
    });
    setStatusLoading(false);
    setShowSuspendModal(false);
    if (res.error) setStatusError(res.error);
    else router.refresh();
  }

  async function handleReactivate() {
    setStatusLoading(true);
    setStatusError("");
    const res = await reactivateProviderAction({ providerId: provider.id });
    setStatusLoading(false);
    if (res.error) setStatusError(res.error);
    else router.refresh();
  }

  // 2. Limits Handler
  async function handleSaveLimits(e: React.FormEvent) {
    e.preventDefault();
    setLimitsLoading(true);
    setLimitsError("");
    setLimitsSuccess(false);

    const offersVal = maxOffers.trim() === "" ? null : Number(maxOffers);
    const imagesVal = maxImages.trim() === "" ? null : Number(maxImages);
    const videosVal = maxVideos.trim() === "" ? null : Number(maxVideos);

    const res = await updateProviderLimitsAction({
      providerId: provider.id,
      maxOffers: offersVal,
      maxImages: imagesVal,
      maxVideos: videosVal,
    });
    setLimitsLoading(false);
    if (res.error) {
      setLimitsError(res.error);
    } else {
      setLimitsSuccess(true);
      setTimeout(() => setLimitsSuccess(false), 3000);
      router.refresh();
    }
  }

  // 3. Notes Handler
  async function handleSaveNotes(e: React.FormEvent) {
    e.preventDefault();
    setNotesLoading(true);
    setNotesError("");
    setNotesSuccess(false);

    const res = await updateProviderNotesAction({
      providerId: provider.id,
      adminNotes,
    });
    setNotesLoading(false);
    if (res.error) {
      setNotesError(res.error);
    } else {
      setNotesSuccess(true);
      setTimeout(() => setNotesSuccess(false), 3000);
      router.refresh();
    }
  }

  // 4. Subscription Handler
  async function handleCreateSubscription(e: React.FormEvent) {
    e.preventDefault();
    setSubLoading(true);
    setSubError("");
    setSubSuccess(false);

    const parsedAmount = Number(amountPaid);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      setSubError("يرجى إدخال مبلغ صحيح");
      setSubLoading(false);
      return;
    }

    const payload: any = {
      providerId: provider.id,
      startDate: subStartDate || undefined,
      amountPaid: parsedAmount,
      paymentMethod,
      paymentNote: paymentNote.trim() || undefined,
      planName: planName.trim() || undefined,
    };

    if (durationPreset === "custom") {
      if (!customEndDate) {
        setSubError("يرجى تحديد تاريخ انتهاء الاشتراك");
        setSubLoading(false);
        return;
      }
      payload.endDate = customEndDate;
    } else {
      payload.months = Number(durationPreset);
    }

    const res = await createProviderSubscriptionAction(payload);
    setSubLoading(false);
    if (res.error) {
      setSubError(res.error);
    } else {
      setSubSuccess(true);
      setTimeout(() => setSubSuccess(false), 3000);
      router.refresh();
    }
  }

  async function handleCancelSubscription() {
    if (!provider.subscriptionSummary.activeSubscriptionId) return;
    setCancelLoading(true);
    setCancelError("");

    const res = await cancelProviderSubscriptionAction({
      subscriptionId: provider.subscriptionSummary.activeSubscriptionId,
      reason: cancelReason,
    });
    setCancelLoading(false);
    setShowCancelModal(false);
    if (res.error) {
      setCancelError(res.error);
    } else {
      router.refresh();
    }
  }

  // 5. Account Handlers
  async function handleToggleAccountActive() {
    setAccountLoading(true);
    setAccountError("");
    const res = await toggleProviderActiveAction({ userId: provider.user.id });
    setAccountLoading(false);
    if (res.error) {
      setAccountError(res.error);
    } else if (res.isActive !== undefined) {
      setAccountIsActive(res.isActive);
      router.refresh();
    }
  }

  async function handleResetPassword() {
    setAccountLoading(true);
    setAccountError("");
    setTempPassword(null);
    const res = await resetProviderPasswordAction({ userId: provider.user.id });
    setAccountLoading(false);
    if (res.error) {
      setAccountError(res.error);
    } else if (res.temporaryPassword) {
      setTempPassword(res.temporaryPassword);
    }
  }

  // Limits warning check
  const offersBelowUsage =
    maxOffers.trim() !== "" && Number(maxOffers) < provider.counts.offers;
  const imagesBelowUsage =
    maxImages.trim() !== "" && Number(maxImages) < provider.counts.images;
  const videosBelowUsage =
    maxVideos.trim() !== "" && Number(maxVideos) < provider.counts.videos;
  const showLimitsWarning = offersBelowUsage || imagesBelowUsage || videosBelowUsage;

  const isVisible =
    provider.status === "APPROVED" &&
    (provider.subscriptionSummary.state === "ACTIVE" ||
      provider.subscriptionSummary.state === "EXPIRING");

  let visibilityText: string;
  if (isVisible) {
    visibilityText = "ملف هذا المقدم ظاهر للعامة في نتائج البحث والتصنيفات.";
  } else if (provider.status === "SUSPENDED") {
    visibilityText = "غير ظاهر للعامة لأن الحساب موقوف من قبل الإدارة.";
  } else if (provider.status === "PENDING") {
    visibilityText = "غير ظاهر للعامة لأن الحساب لا يزال قيد المراجعة ولم يتم اعتماده بعد.";
  } else {
    visibilityText = "غير ظاهر للعامة لعدم وجود اشتراك فعّال يغطي الوقت الحالي.";
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
            <Link href="/admin/providers" className="hover:text-accent">
              مقدمو الخدمة
            </Link>
            <span>/</span>
            <span className="text-text font-medium">{provider.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-text sm:text-2xl">{provider.name}</h1>
            {provider.status === "APPROVED" && <AdminBadge variant="success">معتمد</AdminBadge>}
            {provider.status === "PENDING" && <AdminBadge variant="warning">قيد المراجعة</AdminBadge>}
            {provider.status === "SUSPENDED" && <AdminBadge variant="danger">موقوف</AdminBadge>}
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {provider.status === "PENDING" && (
            <AdminButton
              variant="success"
              onClick={handleApprove}
              disabled={statusLoading}
            >
              {statusLoading ? "جاري الاعتماد..." : "اعتماد الحساب ✓"}
            </AdminButton>
          )}

          {provider.status === "APPROVED" && (
            <AdminButton
              variant="outline-danger"
              onClick={() => setShowSuspendModal(true)}
              disabled={statusLoading}
            >
              إيقاف الحساب ✕
            </AdminButton>
          )}

          {provider.status === "SUSPENDED" && (
            <AdminButton
              variant="primary"
              onClick={handleReactivate}
              disabled={statusLoading}
            >
              {statusLoading ? "جاري التفعيل..." : "إعادة تفعيل الحساب ↻"}
            </AdminButton>
          )}

          {/* WhatsApp Reminder if Expiring / Expired */}
          {(provider.subscriptionSummary.state === "EXPIRING" ||
            provider.subscriptionSummary.state === "EXPIRED") && (
            <WhatsAppReminderButton
              phoneOrWhatsapp={provider.whatsapp || provider.phone}
              providerName={provider.name}
              lastCoveredDateFormatted={
                provider.subscriptionSummary.lastCoveredDayFormatted || "تاريخ انتهاء الاشتراك"
              }
              state={provider.subscriptionSummary.state}
              variant="md"
            />
          )}
        </div>
      </div>

      {statusError && (
        <div className="rounded-lg border border-danger bg-danger-muted p-3 text-xs text-danger">
          {statusError}
        </div>
      )}

      {/* Visibility Status Card */}
      <div
        className={`rounded-xl border p-4 text-xs ${
          isVisible
            ? "border-success bg-success-muted text-success"
            : "border-warning bg-warning-muted text-warning"
        }`}
      >
        <p className="font-bold text-sm">
          {isVisible ? "الحالة على الموقع: ظاهر للعامة" : "الحالة على الموقع: غير ظاهر للعامة"}
        </p>
        <p className="mt-1 text-text">{visibilityText}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 cols on desktop) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile Summary (Read-only) */}
          <AdminCard>
            <AdminCardHeader title="الملف التعريفي" subtitle="بيانات النشاط ووسائل التواصل" />
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-text-muted">الاسم التجاري: </span>
                  <span className="font-bold text-text">{provider.name}</span>
                </div>
                <div>
                  <span className="text-text-muted">المعرف (slug): </span>
                  <span dir="ltr" className="font-mono font-medium text-text">
                    {provider.slug}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">المركز: </span>
                  <span className="font-medium text-text">{provider.districtLabel}</span>
                </div>
                <div>
                  <span className="text-text-muted">العنوان: </span>
                  <span className="font-medium text-text">{provider.address || "غير محدد"}</span>
                </div>
                <div>
                  <span className="text-text-muted">رقم الهاتف: </span>
                  <span dir="ltr" className="font-mono text-text">
                    {provider.phone || "غير مسجل"}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">واتساب: </span>
                  <span dir="ltr" className="font-mono text-text">
                    {provider.whatsapp || "غير مسجل"}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">إنستغرام: </span>
                  {provider.instagramUrl ? (
                    <a
                      href={provider.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline truncate inline-block max-w-[200px]"
                      dir="ltr"
                    >
                      {provider.instagramUrl}
                    </a>
                  ) : (
                    "غير مسجل"
                  )}
                </div>
                <div>
                  <span className="text-text-muted">فيسبوك: </span>
                  {provider.facebookUrl ? (
                    <a
                      href={provider.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline truncate inline-block max-w-[200px]"
                      dir="ltr"
                    >
                      {provider.facebookUrl}
                    </a>
                  ) : (
                    "غير مسجل"
                  )}
                </div>
              </div>

              {/* Categories */}
              <div className="border-t border-border pt-3">
                <span className="text-text-muted block mb-1.5">التصنيفات:</span>
                <div className="flex flex-wrap gap-1.5">
                  {provider.categories.map((c) => (
                    <span
                      key={c.id}
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${
                        c.isPrimary
                          ? "border-accent bg-accent/10 text-accent font-bold"
                          : "border-border bg-surface-muted text-text"
                      }`}
                    >
                      {c.nameAr} {c.isPrimary && "(رئيسي)"}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bio */}
              {provider.bio && (
                <div className="border-t border-border pt-3">
                  <span className="text-text-muted block mb-1">النبذة التعريفية:</span>
                  <p className="rounded-lg bg-surface-muted p-3 text-text leading-relaxed whitespace-pre-wrap">
                    {provider.bio}
                  </p>
                </div>
              )}

              {/* Stats & Counts */}
              <div className="grid grid-cols-2 gap-3 border-t border-border pt-3 sm:grid-cols-4">
                <div className="rounded-lg border border-border bg-surface-muted p-2.5 text-center">
                  <p className="text-[11px] text-text-muted">العروض</p>
                  <p className="text-base font-bold text-text mt-0.5">
                    {provider.counts.offers}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface-muted p-2.5 text-center">
                  <p className="text-[11px] text-text-muted">الصور</p>
                  <p className="text-base font-bold text-text mt-0.5">
                    {provider.counts.images}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface-muted p-2.5 text-center">
                  <p className="text-[11px] text-text-muted">الفيديوهات</p>
                  <p className="text-base font-bold text-text mt-0.5">
                    {provider.counts.videos}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-surface-muted p-2.5 text-center">
                  <p className="text-[11px] text-text-muted">الأيام المحجوزة</p>
                  <p className="text-base font-bold text-text mt-0.5">
                    {provider.counts.blockedDates}
                  </p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4 border-t border-border pt-3 text-text">
                <div>
                  <span className="text-text-muted">التقييم العام: </span>
                  <span className="font-bold">
                    ★ {provider.averageRating > 0 ? provider.averageRating.toFixed(1) : "لا يوجد تقييمات"}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">عدد المراجعات: </span>
                  <span className="font-bold">{provider.reviewCount}</span>
                </div>
              </div>
            </div>
          </AdminCard>

          {/* Subscriptions Section */}
          <AdminCard>
            <AdminCardHeader
              title="الاشتراكات والظهور"
              subtitle="إدارة اشتراك هذا المقدم وتسجيل المدفوعات"
            />
            <div className="space-y-4">
              {/* Current Subscription Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-muted p-3.5">
                <div>
                  <p className="text-xs text-text-muted">الحالة الحالية للاشتراك</p>
                  <div className="flex items-center gap-2 mt-1">
                    {renderSubBadge(provider.subscriptionSummary.state)}
                    {provider.subscriptionSummary.lastCoveredDayFormatted && (
                      <span className="text-xs text-text">
                        ينتهي يوم:{" "}
                        <span className="font-bold">
                          {provider.subscriptionSummary.lastCoveredDayFormatted}
                        </span>
                      </span>
                    )}
                  </div>
                  {provider.subscriptionSummary.daysRemaining !== null && (
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {provider.subscriptionSummary.daysRemaining > 0
                        ? `متبقي ${provider.subscriptionSummary.daysRemaining} يوماً`
                        : "منتهي"}
                    </p>
                  )}
                </div>

                {provider.subscriptionSummary.activeSubscriptionId && (
                  <AdminButton
                    variant="outline-danger"
                    size="sm"
                    onClick={() => setShowCancelModal(true)}
                  >
                    إلغاء الاشتراك الحالي
                  </AdminButton>
                )}
              </div>

              {/* Create / Renew Form */}
              <form onSubmit={handleCreateSubscription} className="rounded-lg border border-border p-4 space-y-4 bg-surface">
                <h3 className="text-sm font-bold text-text">
                  {provider.subscriptionSummary.activeSubscriptionId
                    ? "تجديد الاشتراك (يُضاف تلقائياً بعد انتهاء الحالي)"
                    : "إضافة اشتراك جديد"}
                </h3>

                {subError && (
                  <p className="rounded-lg border border-danger bg-danger-muted p-2 text-xs text-danger">
                    {subError}
                  </p>
                )}
                {subSuccess && (
                  <p className="rounded-lg border border-success bg-success-muted p-2 text-xs text-success">
                    تم تسجيل الاشتراك بنجاح!
                  </p>
                )}

                {/* Duration Presets */}
                <div>
                  <label className="block text-xs font-medium text-text mb-1.5">
                    مدة الاشتراك
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDurationPreset("6")}
                      className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition cursor-pointer ${
                        durationPreset === "6"
                          ? "border-accent bg-accent text-white"
                          : "border-border bg-surface-muted text-text hover:bg-surface"
                      }`}
                    >
                      6 أشهر
                    </button>
                    <button
                      type="button"
                      onClick={() => setDurationPreset("12")}
                      className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition cursor-pointer ${
                        durationPreset === "12"
                          ? "border-accent bg-accent text-white"
                          : "border-border bg-surface-muted text-text hover:bg-surface"
                      }`}
                    >
                      12 شهر (سنة)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDurationPreset("custom")}
                      className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition cursor-pointer ${
                        durationPreset === "custom"
                          ? "border-accent bg-accent text-white"
                          : "border-border bg-surface-muted text-text hover:bg-surface"
                      }`}
                    >
                      تاريخ مخصص
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <AdminInput
                    label="تاريخ البدء"
                    type="date"
                    value={subStartDate}
                    onChange={(e) => setSubStartDate(e.target.value)}
                    helpText="افتراضياً: يبدأ فوراً أو بعد انتهاء الاشتراك الحالي"
                    required
                  />

                  {durationPreset === "custom" && (
                    <AdminInput
                      label="تاريخ الانتهاء المخصص (حتى 00:00 لهذا التاريخ)"
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      required
                    />
                  )}

                  <AdminInput
                    label="المبلغ المدفوع (بالجنيه المصري)"
                    type="number"
                    min={0}
                    max={10000000}
                    step={1}
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    required
                  />

                  <AdminSelect
                    label="طريقة الدفع"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  >
                    <option value="CASH">نقداً (كاش)</option>
                    <option value="INSTAPAY">إنستاباي (InstaPay)</option>
                    <option value="VODAFONE_CASH">فودافون كاش</option>
                    <option value="OTHER">أخرى</option>
                  </AdminSelect>

                  <AdminInput
                    label="اسم الباقة (اختياري)"
                    placeholder="مثال: الباقة السنوية"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                  />

                  <AdminInput
                    label="ملاحظات الدفع (اختياري)"
                    placeholder="رقم الحوالة، تاريخ الاستلام..."
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                  />
                </div>

                <AdminButton type="submit" disabled={subLoading} className="w-full sm:w-auto">
                  {subLoading ? "جاري الحفظ..." : "تسجيل الاشتراك"}
                </AdminButton>
              </form>

              {/* Subscriptions History Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-text">سجل الاشتراكات السابقة</h4>
                <AdminTable>
                  <AdminTableHead>
                    <tr>
                      <AdminTh>البدء</AdminTh>
                      <AdminTh>آخر يوم مشمول</AdminTh>
                      <AdminTh>المبلغ</AdminTh>
                      <AdminTh>الطريقة</AdminTh>
                      <AdminTh>ملاحظة</AdminTh>
                      <AdminTh>المسؤول</AdminTh>
                      <AdminTh>الحالة</AdminTh>
                    </tr>
                  </AdminTableHead>
                  <AdminTableBody>
                    {provider.subscriptionsHistory.length === 0 ? (
                      <tr>
                        <AdminTd colSpan={7} className="text-center text-xs text-text-muted py-4">
                          لا توجد اشتراكات مسجلة لهذا المقدم.
                        </AdminTd>
                      </tr>
                    ) : (
                      provider.subscriptionsHistory.map((s) => (
                        <tr key={s.id}>
                          <AdminTd className="text-xs">{s.startsAtFormatted}</AdminTd>
                          <AdminTd className="text-xs font-semibold">{s.lastCoveredDayFormatted}</AdminTd>
                          <AdminTd className="text-xs font-bold">
                            {s.amountPaid !== null ? `${s.amountPaid} ج.م` : "-"}
                          </AdminTd>
                          <AdminTd className="text-xs">{formatPaymentMethod(s.paymentMethod)}</AdminTd>
                          <AdminTd className="text-xs text-text-muted">{s.paymentNote || "-"}</AdminTd>
                          <AdminTd className="text-xs text-text-muted">{s.createdByName}</AdminTd>
                          <AdminTd>{renderHistorySubStatus(s.status)}</AdminTd>
                        </tr>
                      ))
                    )}
                  </AdminTableBody>
                </AdminTable>
              </div>
            </div>
          </AdminCard>
        </div>

        {/* Right Column: Limits, Admin Notes, Linked Account, Activity */}
        <div className="space-y-6">
          {/* Limits Editor */}
          <AdminCard>
            <AdminCardHeader
              title="حدود الحساب"
              subtitle="الحد الأقصى للعروض والصور والفيديوهات"
            />
            <form onSubmit={handleSaveLimits} className="space-y-3">
              {limitsError && (
                <p className="rounded-lg border border-danger bg-danger-muted p-2 text-xs text-danger">
                  {limitsError}
                </p>
              )}
              {limitsSuccess && (
                <p className="rounded-lg border border-success bg-success-muted p-2 text-xs text-success">
                  تم حفظ الحدود بنجاح!
                </p>
              )}
              {showLimitsWarning && (
                <div className="rounded-lg border border-warning bg-warning-muted p-2.5 text-xs text-warning">
                  ⚠️ تنبيه: تقليل الحد عن الاستخدام الحالي لن يحذف المحتوى الموجود، لكنه سيمنع المقدم من إضافة المزيد.
                </div>
              )}

              <div>
                <AdminInput
                  label={`حد العروض (الافتراضي: ${DEFAULT_LIMITS.offers}، الأقصى: ${ABSOLUTE_MAX.offers})`}
                  type="number"
                  min={0}
                  max={ABSOLUTE_MAX.offers}
                  placeholder={`الافتراضي (${DEFAULT_LIMITS.offers})`}
                  value={maxOffers}
                  onChange={(e) => setMaxOffers(e.target.value)}
                  helpText={`المستخدم حالياً: ${provider.counts.offers} عروض`}
                />
              </div>

              <div>
                <AdminInput
                  label={`حد الصور (الافتراضي: ${DEFAULT_LIMITS.images}، الأقصى: ${ABSOLUTE_MAX.images})`}
                  type="number"
                  min={0}
                  max={ABSOLUTE_MAX.images}
                  placeholder={`الافتراضي (${DEFAULT_LIMITS.images})`}
                  value={maxImages}
                  onChange={(e) => setMaxImages(e.target.value)}
                  helpText={`المستخدم حالياً: ${provider.counts.images} صور`}
                />
              </div>

              <div>
                <AdminInput
                  label={`حد الفيديوهات (الافتراضي: ${DEFAULT_LIMITS.videos}، الأقصى: ${ABSOLUTE_MAX.videos})`}
                  type="number"
                  min={0}
                  max={ABSOLUTE_MAX.videos}
                  placeholder={`الافتراضي (${DEFAULT_LIMITS.videos})`}
                  value={maxVideos}
                  onChange={(e) => setMaxVideos(e.target.value)}
                  helpText={`المستخدم حالياً: ${provider.counts.videos} فيديوهات`}
                />
              </div>

              <AdminButton type="submit" disabled={limitsLoading} size="sm" className="w-full">
                {limitsLoading ? "جاري الحفظ..." : "حفظ الحدود"}
              </AdminButton>
            </form>
          </AdminCard>

          {/* Admin Notes Editor */}
          <AdminCard>
            <AdminCardHeader
              title="ملاحظات الإدارة"
              subtitle="ملاحظات سرية خاصة بالإدارة فقط (لن تظهر للمقدم أو الزوار)"
            />
            <form onSubmit={handleSaveNotes} className="space-y-3">
              {notesError && (
                <p className="rounded-lg border border-danger bg-danger-muted p-2 text-xs text-danger">
                  {notesError}
                </p>
              )}
              {notesSuccess && (
                <p className="rounded-lg border border-success bg-success-muted p-2 text-xs text-success">
                  تم حفظ الملاحظات بنجاح!
                </p>
              )}

              <AdminTextarea
                rows={4}
                maxLength={2000}
                placeholder="أضف ملاحظات خاصة حول مقدم الخدمة..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                helpText={`${adminNotes.length} / 2000 حرف`}
              />

              <AdminButton type="submit" disabled={notesLoading} size="sm" className="w-full">
                {notesLoading ? "جاري الحفظ..." : "حفظ الملاحظات"}
              </AdminButton>
            </form>
          </AdminCard>

          {/* Linked Account Section */}
          <AdminCard>
            <AdminCardHeader
              title="حساب المستخدم المرتبط"
              subtitle="إدارة حساب تسجيل الدخول الخاص بالمقدم"
            />
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-text-muted">البريد الإلكتروني: </span>
                <span dir="ltr" className="font-semibold text-text">
                  {provider.user.email}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-text-muted">حالة الحساب: </span>
                {accountIsActive ? (
                  <AdminBadge variant="success">نشط</AdminBadge>
                ) : (
                  <AdminBadge variant="danger">معطل</AdminBadge>
                )}
                {provider.user.mustChangePassword && (
                  <AdminBadge variant="warning">يجب تغيير كلمة المرور</AdminBadge>
                )}
              </div>

              {accountError && (
                <p className="rounded-lg border border-danger bg-danger-muted p-2 text-xs text-danger">
                  {accountError}
                </p>
              )}

              {tempPassword && (
                <div className="rounded-lg border border-accent bg-accent/10 p-3 text-text">
                  <p className="font-bold text-accent">كلمة المرور المؤقتة الجديدة:</p>
                  <p dir="ltr" className="font-mono text-sm font-bold select-all my-1">
                    {tempPassword}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    تم نسخها تلقائياً. سيلزم المقدم تغييرها عند أول تسجيل دخول.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={handleResetPassword}
                  disabled={accountLoading}
                >
                  إعادة تعيين كلمة المرور
                </AdminButton>

                <AdminButton
                  variant={accountIsActive ? "outline-danger" : "primary"}
                  size="sm"
                  onClick={handleToggleAccountActive}
                  disabled={accountLoading}
                >
                  {accountIsActive ? "تعطيل الحساب" : "تفعيل الحساب"}
                </AdminButton>

                <Link
                  href="/admin/provider-accounts"
                  className="text-center text-xs text-accent hover:underline pt-1"
                >
                  فتح صفحة إدارة الحسابات ←
                </Link>
              </div>
            </div>
          </AdminCard>

          {/* Activity Log (Last 20) */}
          <AdminCard>
            <AdminCardHeader
              title="سجل نشاط هذا المقدم"
              subtitle="آخر 20 إجراء تم تنفيذه على هذا الملف"
            />
            <div className="space-y-2">
              {provider.recentActivity.length === 0 ? (
                <p className="text-center text-xs text-text-muted py-3">
                  لا توجد سجلات بعد.
                </p>
              ) : (
                <ul className="divide-y divide-border text-xs max-h-80 overflow-y-auto">
                  {provider.recentActivity.map((log) => (
                    <li key={log.id} className="py-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-text">{formatActionLabel(log.action)}</span>
                        <span className="text-[10px] text-text-muted">
                          {log.createdAtFormatted}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted">
                        بواسطة: {log.adminName}
                      </p>
                      {log.details && (
                        <p className="text-[10px] font-mono bg-surface-muted p-1 rounded text-text truncate" dir="ltr">
                          {typeof log.details === "string"
                            ? log.details
                            : JSON.stringify(log.details)}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </AdminCard>
        </div>
      </div>

      {/* Suspend Reason Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface border border-border p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-text">إيقاف حساب مقدم الخدمة</h3>
            <p className="text-xs text-text-muted">
              سيؤدي هذا الإجراء إلى حجب ملف المقدم عن الظهور للزوار على الفور.
            </p>
            <AdminTextarea
              label="سبب الإيقاف (اختياري، يسجل في سجل النشاط)"
              placeholder="مثال: مخالفة شروط الاستخدام..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={() => setShowSuspendModal(false)}
              >
                إلغاء
              </AdminButton>
              <AdminButton
                variant="danger"
                size="sm"
                onClick={handleSuspend}
                disabled={statusLoading}
              >
                {statusLoading ? "جاري الإيقاف..." : "تأكيد الإيقاف"}
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface border border-border p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-text">إلغاء الاشتراك الحالي</h3>
            <p className="text-xs text-text-muted">
              سيتم تغيير حالة الاشتراك إلى &quot;ملغي&quot; وإيقاف ظهوره للعامة فوراً مع الاحتفاظ بسجل العملية.
            </p>
            {cancelError && (
              <p className="rounded-lg border border-danger bg-danger-muted p-2 text-xs text-danger">
                {cancelError}
              </p>
            )}
            <AdminTextarea
              label="سبب الإلغاء (اختياري)"
              placeholder="مثال: بناء على طلب المقدم أو استرداد المبلغ..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={() => setShowCancelModal(false)}
              >
                تراجع
              </AdminButton>
              <AdminButton
                variant="danger"
                size="sm"
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
              >
                {cancelLoading ? "جاري الإلغاء..." : "تأكيد إلغاء الاشتراك"}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderSubBadge(state: SubscriptionState) {
  if (state === "ACTIVE") return <AdminBadge variant="success">نشط</AdminBadge>;
  if (state === "EXPIRING") return <AdminBadge variant="warning">أوشك على الانتهاء</AdminBadge>;
  if (state === "EXPIRED") return <AdminBadge variant="danger">منتهي</AdminBadge>;
  if (state === "FUTURE") return <AdminBadge variant="accent">مستقبلي</AdminBadge>;
  if (state === "CANCELLED") return <AdminBadge variant="neutral">ملغي</AdminBadge>;
  return <AdminBadge variant="neutral">بدون اشتراك</AdminBadge>;
}

function renderHistorySubStatus(status: string) {
  if (status === "ACTIVE") return <AdminBadge variant="success">نشط</AdminBadge>;
  if (status === "CANCELLED") return <AdminBadge variant="neutral">ملغي</AdminBadge>;
  if (status === "EXPIRED") return <AdminBadge variant="danger">منتهي</AdminBadge>;
  return <AdminBadge variant="neutral">{status}</AdminBadge>;
}

function formatPaymentMethod(method: string | null) {
  if (method === "CASH") return "نقداً";
  if (method === "INSTAPAY") return "إنستاباي";
  if (method === "VODAFONE_CASH") return "فودافون كاش";
  if (method === "OTHER") return "أخرى";
  return "-";
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
    "account.create": "إنشاء الحساب",
    "account.reset_password": "تعيين كلمة المرور",
    "account.toggle_active": "تغيير حالة الحساب",
  };
  return map[action] || action;
}
