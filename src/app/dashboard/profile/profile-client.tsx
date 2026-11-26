"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadSimple, Trash, Check, WarningCircle, Plus, X } from "@phosphor-icons/react";
import { getCloudinaryUploadSignatureAction } from "@/app/dashboard/cloudinary-actions";
import {
  uploadFileDirectToCloudinary,
  validateImageFileClient,
} from "@/lib/cloudinary-client";
import { resolveCloudinaryDisplayUrl } from "@/lib/cloudinary-url";
import { DISTRICT_OPTIONS } from "@/lib/districts";
import {
  createDefaultOpeningHours,
  WEEKDAY_KEYS,
  WEEKDAY_LABELS_AR,
  type OpeningHours,
} from "@/lib/opening-hours";
import {
  FAQ_MAX_ANSWER_LENGTH,
  FAQ_MAX_ITEMS,
  FAQ_MAX_QUESTION_LENGTH,
  HIGHLIGHT_MAX_LENGTH,
  HIGHLIGHTS_MAX_ITEMS,
  type FaqItem,
} from "@/lib/faq-schema";
import {
  deleteProviderImageAction,
  saveProviderImageAction,
  updateProfileAction,
} from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

interface CategoryItem {
  id: string;
  nameAr: string;
}

interface ProfileClientProps {
  isSuspended: boolean;
  cloudName: string;
  provider: {
    slug: string;
    name: string;
    bio: string;
    district: string;
    address: string;
    phone: string;
    whatsapp: string;
    instagramUrl: string;
    facebookUrl: string;
    mapsUrl: string;
    highlights: string[];
    openingHours: OpeningHours | null;
    faqs: FaqItem[];
    logoUrl: string | null;
    logoPublicId: string | null;
    coverUrl: string | null;
    coverPublicId: string | null;
    categoryIds: string[];
    primaryCategoryId: string;
  };
  categories: CategoryItem[];
}

export function ProfileClient({
  isSuspended,
  cloudName,
  provider,
  categories,
}: ProfileClientProps) {
  const router = useRouter();

  const [name, setName] = useState(provider.name);
  const [bio, setBio] = useState(provider.bio);
  const [district, setDistrict] = useState(provider.district);
  const [address, setAddress] = useState(provider.address);
  const [phone, setPhone] = useState(provider.phone);
  const [whatsapp, setWhatsapp] = useState(provider.whatsapp);
  const [instagramUrl, setInstagramUrl] = useState(provider.instagramUrl);
  const [facebookUrl, setFacebookUrl] = useState(provider.facebookUrl);
  const [mapsUrl, setMapsUrl] = useState(provider.mapsUrl);
  const [highlights, setHighlights] = useState<string[]>(provider.highlights);
  const [newHighlight, setNewHighlight] = useState("");
  const [openingHoursEnabled, setOpeningHoursEnabled] = useState(
    Boolean(provider.openingHours)
  );
  const [openingHours, setOpeningHours] = useState<OpeningHours>(
    provider.openingHours ?? createDefaultOpeningHours()
  );
  const [faqs, setFaqs] = useState<FaqItem[]>(provider.faqs);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    provider.categoryIds
  );
  const [primaryCategoryId, setPrimaryCategoryId] = useState(
    provider.primaryCategoryId
  );

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const [logoState, setLogoState] = useState({
    url: provider.logoUrl,
    publicId: provider.logoPublicId,
  });
  const [coverState, setCoverState] = useState({
    url: provider.coverUrl,
    publicId: provider.coverPublicId,
  });

  const toggleCategory = (catId: string) => {
    if (isSuspended) return;
    setSaveError("");
    setSaveSuccess("");

    if (selectedCategoryIds.includes(catId)) {
      if (selectedCategoryIds.length === 1) {
        setSaveError("يجب أن يبقى تصنيف واحد على الأقل.");
        return;
      }
      const next = selectedCategoryIds.filter((id) => id !== catId);
      setSelectedCategoryIds(next);
      if (primaryCategoryId === catId) {
        setPrimaryCategoryId(next[0]);
      }
    } else {
      if (selectedCategoryIds.length >= 3) {
        setSaveError("يمكنك اختيار 3 تصنيفات كحد أقصى.");
        return;
      }
      setSelectedCategoryIds((prev) => [...prev, catId]);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuspended) return;

    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    const res = await updateProfileAction({
      name,
      bio,
      district,
      address,
      phone,
      whatsapp,
      instagramUrl,
      facebookUrl,
      mapsUrl,
      highlights,
      openingHours: openingHoursEnabled ? openingHours : null,
      faqs,
      categoryIds: selectedCategoryIds,
      primaryCategoryId,
    });

    setSaving(false);
    if (res.error) {
      setSaveError(res.error);
    } else {
      setSaveSuccess("تم حفظ التعديلات بنجاح.");
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Uploaders */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <SingleImageUploader
          title="شعار النشاط (Logo)"
          hint="صورة مربعة واضحة تظهر بجوار اسمك في الدليل (PNG أو JPG أو WebP حتى 5MB)"
          kind="logo"
          preset="thumb"
          cloudName={cloudName}
          publicId={logoState.publicId}
          fallbackUrl={logoState.url}
          isSuspended={isSuspended}
          onUploaded={(next) => setLogoState(next)}
          onDeleted={() => setLogoState({ url: null, publicId: null })}
        />

        <SingleImageUploader
          title="صورة الغلاف (Cover Banner)"
          hint="صورة أفقية عريضة تظهر أعلى صفحة ملفك التعريفي (حتى 5MB)"
          kind="cover"
          preset="cover"
          cloudName={cloudName}
          publicId={coverState.publicId}
          fallbackUrl={coverState.url}
          isSuspended={isSuspended}
          onUploaded={(next) => setCoverState(next)}
          onDeleted={() => setCoverState({ url: null, publicId: null })}
        />
      </div>

      {/* Main Profile Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>البيانات الأساسية للملف التعريفي</CardTitle>
          <CardDescription>
            المعلومات التي ستظهر للعرائس والزوار عند استعراض صفحتك في الدليل.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div>
              <span className="block text-xs font-medium text-text-muted mb-1">
                الرابط الدائم لصفحتك (Slug)
              </span>
              <div
                dir="ltr"
                className="rounded-[4px] border border-border bg-surface-muted px-3.5 py-2.5 font-mono text-xs text-text-muted"
              >
                /providers/{provider.slug}
              </div>
            </div>

            <Field label="اسم النشاط أو مقدم الخدمة" htmlFor="profile-name" required>
              <Input
                id="profile-name"
                type="text"
                required
                minLength={2}
                maxLength={80}
                disabled={isSuspended}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>

            <Field
              label="النبذة التعريفية"
              htmlFor="profile-bio"
              helpText="اكتبي نبذة جذابة توضح خبرتك والخدمات التي تتميزين بها."
            >
              <Textarea
                id="profile-bio"
                rows={4}
                maxLength={2000}
                disabled={isSuspended}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="تفاصيل الخدمات، سنوات الخبرة، ما يميزك عن غيرك..."
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="المركز / المدينة" htmlFor="profile-district" required>
                <select
                  id="profile-district"
                  required
                  disabled={isSuspended}
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="flex h-11 w-full rounded-[4px] border border-border bg-surface-raised px-3.5 py-2 text-sm text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {DISTRICT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="العنوان التفصيلي" htmlFor="profile-address">
                <Input
                  id="profile-address"
                  type="text"
                  maxLength={200}
                  disabled={isSuspended}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="مثال: شارع عبد السلام عارف، برج..."
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="رقم الهاتف (أرقام غربية 0-9)" htmlFor="profile-phone">
                <Input
                  id="profile-phone"
                  type="tel"
                  disabled={isSuspended}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  dir="ltr"
                />
              </Field>

              <Field label="رقم الواتساب" htmlFor="profile-whatsapp">
                <Input
                  id="profile-whatsapp"
                  type="tel"
                  disabled={isSuspended}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="01012345678"
                  dir="ltr"
                />
              </Field>
            </div>
            <p className="text-xs text-text-muted">
              يجب إدخال رقم الهاتف أو رقم الواتساب على الأقل (يُحفظ بصيغة +20XXXXXXXXXX).
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="رابط إنستجرام" htmlFor="profile-instagram">
                <Input
                  id="profile-instagram"
                  type="url"
                  disabled={isSuspended}
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://www.instagram.com/username"
                  dir="ltr"
                />
              </Field>

              <Field label="رابط فيسبوك" htmlFor="profile-facebook">
                <Input
                  id="profile-facebook"
                  type="url"
                  disabled={isSuspended}
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://www.facebook.com/page"
                  dir="ltr"
                />
              </Field>
            </div>

            <Field
              label="رابط الموقع على خرائط جوجل (اختياري)"
              htmlFor="profile-maps-url"
              helpText="يُقبل روابط google.com/maps أو maps.app.goo.gl أو goo.gl/maps"
            >
              <Input
                id="profile-maps-url"
                type="url"
                disabled={isSuspended}
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                placeholder="https://maps.app.goo.gl/..."
                dir="ltr"
              />
            </Field>

            {/* Quick Highlights */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-text">
                  المميزات السريعة (حتى {HIGHLIGHTS_MAX_ITEMS} نقاط)
                </span>
                <span className="font-latin text-xs text-text-muted">
                  {highlights.length} / {HIGHLIGHTS_MAX_ITEMS}
                </span>
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  disabled={isSuspended || highlights.length >= HIGHLIGHTS_MAX_ITEMS}
                  maxLength={HIGHLIGHT_MAX_LENGTH}
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  placeholder="مثال: باركينج خاص، تكييف مركزي، فريق نسائي..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const clean = newHighlight.trim();
                      if (clean.length >= 2 && !highlights.includes(clean) && highlights.length < HIGHLIGHTS_MAX_ITEMS) {
                        setHighlights((prev) => [...prev, clean]);
                        setNewHighlight("");
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  disabled={isSuspended || highlights.length >= HIGHLIGHTS_MAX_ITEMS || newHighlight.trim().length < 2}
                  onClick={() => {
                    const clean = newHighlight.trim();
                    if (clean.length >= 2 && !highlights.includes(clean)) {
                      setHighlights((prev) => [...prev, clean]);
                      setNewHighlight("");
                    }
                  }}
                  className="shrink-0 gap-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>إضافة</span>
                </Button>
              </div>

              {highlights.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {highlights.map((item) => (
                    <Badge key={item} variant="neutral" className="gap-1.5 py-1.5">
                      <span>{item}</span>
                      <button
                        type="button"
                        disabled={isSuspended}
                        onClick={() =>
                          setHighlights((prev) => prev.filter((x) => x !== item))
                        }
                        aria-label={`إزالة ${item}`}
                        className="text-text-muted hover:text-danger cursor-pointer"
                      >
                        <X className="h-3 w-3" weight="bold" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Opening Hours */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="block text-xs font-semibold text-text">
                    مواعيد العمل الأسبوعية (اختياري)
                  </span>
                  <span className="text-[11px] text-text-muted">
                    فعّلي الجدول لعرض أوقات الاستقبال والعمل على صفحتك.
                  </span>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-text">
                  <input
                    type="checkbox"
                    disabled={isSuspended}
                    checked={openingHoursEnabled}
                    onChange={(e) => setOpeningHoursEnabled(e.target.checked)}
                    className="h-4 w-4 rounded-[2px] border-border"
                  />
                  <span>عرض مواعيد العمل</span>
                </label>
              </div>

              {openingHoursEnabled && (
                <div className="space-y-2 rounded-[4px] border border-border bg-surface-muted/40 p-3">
                  {WEEKDAY_KEYS.map((day) => {
                    const entry = openingHours[day];
                    return (
                      <div
                        key={day}
                        className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2 last:border-b-0 last:pb-0 text-xs"
                      >
                        <label className="flex min-w-[110px] cursor-pointer items-center gap-2 font-medium text-text">
                          <input
                            type="checkbox"
                            disabled={isSuspended}
                            checked={entry.isOpen}
                            onChange={(e) =>
                              setOpeningHours((prev) => ({
                                ...prev,
                                [day]: e.target.checked
                                  ? {
                                      isOpen: true,
                                      open: prev[day].open || "10:00",
                                      close: prev[day].close || "22:00",
                                    }
                                  : { isOpen: false, open: null, close: null },
                              }))
                            }
                            className="h-4 w-4 rounded-[2px] border-border"
                          />
                          <span>{WEEKDAY_LABELS_AR[day]}</span>
                        </label>

                        {entry.isOpen ? (
                          <div className="flex items-center gap-2" dir="ltr">
                            <input
                              type="time"
                              disabled={isSuspended}
                              value={entry.open ?? "10:00"}
                              onChange={(e) =>
                                setOpeningHours((prev) => ({
                                  ...prev,
                                  [day]: {
                                    ...prev[day],
                                    isOpen: true,
                                    open: e.target.value,
                                  },
                                }))
                              }
                              className="h-9 rounded-[4px] border border-border bg-surface-raised px-2 font-latin text-xs text-text"
                            />
                            <span className="text-text-muted">→</span>
                            <input
                              type="time"
                              disabled={isSuspended}
                              value={entry.close ?? "22:00"}
                              onChange={(e) =>
                                setOpeningHours((prev) => ({
                                  ...prev,
                                  [day]: {
                                    ...prev[day],
                                    isOpen: true,
                                    close: e.target.value,
                                  },
                                }))
                              }
                              className="h-9 rounded-[4px] border border-border bg-surface-raised px-2 font-latin text-xs text-text"
                            />
                          </div>
                        ) : (
                          <span className="text-text-muted">مغلق</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* FAQs Editor */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="block text-xs font-semibold text-text">
                    الأسئلة الشائعة (حتى {FAQ_MAX_ITEMS} أسئلة)
                  </span>
                  <span className="text-[11px] text-text-muted">
                    أجيبي عن أكثر استفسارات العرائس شيوعاً لتسريع قرار الحجز.
                  </span>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={isSuspended || faqs.length >= FAQ_MAX_ITEMS}
                  onClick={() =>
                    setFaqs((prev) => [...prev, { question: "", answer: "" }])
                  }
                  className="gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>إضافة سؤال</span>
                </Button>
              </div>

              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="space-y-2 rounded-[4px] border border-border bg-surface-muted/40 p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-latin text-xs font-semibold text-text-muted">
                      #{idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isSuspended}
                      onClick={() =>
                        setFaqs((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="h-8 px-2 text-xs text-danger hover:bg-danger-muted hover:text-danger"
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Input
                    type="text"
                    disabled={isSuspended}
                    maxLength={FAQ_MAX_QUESTION_LENGTH}
                    placeholder="السؤال (مثال: هل السعر يشمل البوفيه أم القاعة فقط؟)"
                    value={faq.question}
                    onChange={(e) =>
                      setFaqs((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, question: e.target.value } : item
                        )
                      )
                    }
                  />
                  <Textarea
                    disabled={isSuspended}
                    maxLength={FAQ_MAX_ANSWER_LENGTH}
                    placeholder="الإجابة الواضحة..."
                    value={faq.answer}
                    onChange={(e) =>
                      setFaqs((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, answer: e.target.value } : item
                        )
                      )
                    }
                  />
                </div>
              ))}
            </div>

            {/* Categories Selection */}
            <div className="space-y-2 border-t border-border pt-4">
              <span className="block text-xs font-semibold text-text">
                التصنيفات (اختاري من 1 إلى 3 وحددي تصنيفاً رئيسياً واحداً) *
              </span>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {categories.map((cat) => {
                  const checked = selectedCategoryIds.includes(cat.id);
                  const isPrimary = primaryCategoryId === cat.id;
                  return (
                    <div
                      key={cat.id}
                      className={cn(
                        "flex items-center justify-between rounded-[4px] border p-3 text-xs transition-colors",
                        checked
                          ? "border-text bg-surface-muted font-medium text-text"
                          : "border-border bg-surface-raised text-text-muted"
                      )}
                    >
                      <label className="flex flex-1 cursor-pointer items-center gap-2.5">
                        <input
                          type="checkbox"
                          disabled={isSuspended}
                          checked={checked}
                          onChange={() => toggleCategory(cat.id)}
                          className="h-4 w-4 rounded-[2px] border-border text-text focus:ring-ring"
                        />
                        <span>{cat.nameAr}</span>
                      </label>

                      {checked && (
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-accent-text">
                          <input
                            type="radio"
                            name="primaryCategory"
                            disabled={isSuspended}
                            checked={isPrimary}
                            onChange={() => setPrimaryCategoryId(cat.id)}
                          />
                          <span>رئيسي</span>
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {saveError && (
              <div className="rounded-[4px] border border-danger/30 bg-danger-muted p-3 text-xs text-danger">
                {saveError}
              </div>
            )}

            {saveSuccess && (
              <div className="rounded-[4px] border border-success/30 bg-success-muted p-3 text-xs text-success">
                {saveSuccess}
              </div>
            )}

            <Button
              type="submit"
              loading={saving}
              disabled={isSuspended}
              variant="primary"
              className="w-full"
            >
              حفظ التغييرات
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SingleImageUploader({
  title,
  hint,
  kind,
  preset,
  cloudName,
  publicId,
  fallbackUrl,
  isSuspended,
  onUploaded,
  onDeleted,
}: {
  title: string;
  hint: string;
  kind: "logo" | "cover";
  preset: "thumb" | "cover";
  cloudName: string;
  publicId: string | null;
  fallbackUrl: string | null;
  isSuspended: boolean;
  onUploaded: (next: { url: string; publicId: string }) => void;
  onDeleted: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const displayUrl =
    previewUrl ||
    resolveCloudinaryDisplayUrl({
      publicId,
      fallbackUrl,
      preset,
      cloudName,
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || isSuspended) return;

    setError("");
    const validationError = validateImageFileClient(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploading(true);
    setProgress(0);

    try {
      const sigResult = await getCloudinaryUploadSignatureAction({
        target: kind,
      });
      if (sigResult.error || !sigResult.data) {
        throw new Error(sigResult.error ?? "تعذر تجهيز الرفع");
      }

      const uploaded = await uploadFileDirectToCloudinary(
        file,
        sigResult.data,
        setProgress
      );

      const saveResult = await saveProviderImageAction({
        kind,
        publicId: uploaded.publicId,
      });
      if (saveResult.error || !saveResult.secureUrl || !saveResult.publicId) {
        throw new Error(saveResult.error ?? "فشل حفظ الصورة");
      }

      onUploaded({
        url: saveResult.secureUrl,
        publicId: saveResult.publicId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء رفع الصورة");
    } finally {
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async () => {
    if (isSuspended || (!publicId && !fallbackUrl)) return;
    setDeleting(true);
    setError("");
    const res = await deleteProviderImageAction({ kind });
    setDeleting(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    onDeleted();
  };

  return (
    <Card className="p-5">
      <CardHeader className="p-0 pb-3 mb-3 border-b border-border/60">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-xs">{hint}</CardDescription>
      </CardHeader>

      <div className="overflow-hidden rounded-[2px] border border-dashed border-border bg-surface-muted">
        {displayUrl ? (
          previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayUrl}
              alt={title}
              className={
                kind === "logo"
                  ? "mx-auto h-36 w-36 object-cover"
                  : "h-36 w-full object-cover"
              }
            />
          ) : (
            <Image
              src={displayUrl}
              alt={title}
              width={kind === "logo" ? 200 : 1200}
              height={kind === "logo" ? 200 : 480}
              className={
                kind === "logo"
                  ? "mx-auto h-36 w-36 object-cover"
                  : "h-36 w-full object-cover"
              }
            />
          )
        ) : (
          <div className="flex h-36 items-center justify-center font-latin text-xs text-text-muted/60 uppercase">
            NO IMAGE UPLOADED
          </div>
        )}
      </div>

      {uploading && (
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-text-muted font-latin">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-[2px] bg-surface-muted border border-border">
            <div
              className="h-full bg-text transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs font-medium text-danger">{error}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <label
          className={cn(
            "inline-flex cursor-pointer items-center justify-center gap-2 rounded-[4px] bg-text px-3 py-2 text-xs font-medium text-text-inverse transition hover:opacity-90",
            (uploading || deleting || isSuspended) && "pointer-events-none opacity-50"
          )}
        >
          <UploadSimple className="h-4 w-4" weight="bold" />
          <span>{displayUrl ? "تغيير الصورة" : "رفع صورة"}</span>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            disabled={uploading || deleting || isSuspended}
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>

        {(publicId || fallbackUrl) && (
          <Button
            type="button"
            variant="danger-outline"
            size="sm"
            disabled={uploading || deleting || isSuspended}
            loading={deleting}
            onClick={handleDelete}
            className="gap-1.5"
          >
            <Trash className="h-3.5 w-3.5" weight="light" />
            <span>حذف</span>
          </Button>
        )}
      </div>
    </Card>
  );
}
