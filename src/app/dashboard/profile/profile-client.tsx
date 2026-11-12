"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getCloudinaryUploadSignatureAction } from "@/app/dashboard/cloudinary-actions";
import {
  uploadFileDirectToCloudinary,
  validateImageFileClient,
} from "@/lib/cloudinary-client";
import { resolveCloudinaryDisplayUrl } from "@/lib/cloudinary-url";
import { DISTRICT_OPTIONS } from "@/lib/districts";
import {
  deleteProviderImageAction,
  saveProviderImageAction,
  updateProfileAction,
} from "./actions";

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
      const next = [...selectedCategoryIds, catId];
      setSelectedCategoryIds(next);
      if (!primaryCategoryId) {
        setPrimaryCategoryId(catId);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuspended) return;

    setSaving(true);
    setSaveError("");
    setSaveSuccess("");

    const result = await updateProfileAction({
      name,
      bio,
      district,
      address,
      phone,
      whatsapp,
      instagramUrl,
      facebookUrl,
      categoryIds: selectedCategoryIds,
      primaryCategoryId,
    });

    setSaving(false);
    if (result.error) {
      setSaveError(result.error);
      return;
    }

    setSaveSuccess("تم حفظ تعديلات الملف الشخصي بنجاح.");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h1 className="text-lg font-bold text-gray-900">تعديل الملف الشخصي</h1>
        <p className="mt-1 text-xs text-gray-500">
          الرابط الدائم (Slug - للعرض فقط):{" "}
          <code dir="ltr" className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-800">
            {provider.slug}
          </code>
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SingleImageUploader
          title="صورة الشعار (Logo)"
          hint="تظهر في بطاقة مقدم الخدمة (يُفضّل صورة مربعة، بحد أقصى 5 ميجابايت)."
          kind="logo"
          preset="thumb"
          cloudName={cloudName}
          publicId={logoState.publicId}
          fallbackUrl={logoState.url}
          isSuspended={isSuspended}
          onUploaded={(next) => {
            setLogoState(next);
            router.refresh();
          }}
          onDeleted={() => {
            setLogoState({ url: null, publicId: null });
            router.refresh();
          }}
        />
        <SingleImageUploader
          title="صورة الغلاف (Cover)"
          hint="تظهر أعلى صفحتك (بحد أقصى 5 ميجابايت)."
          kind="cover"
          preset="cover"
          cloudName={cloudName}
          publicId={coverState.publicId}
          fallbackUrl={coverState.url}
          isSuspended={isSuspended}
          onUploaded={(next) => {
            setCoverState(next);
            router.refresh();
          }}
          onDeleted={() => {
            setCoverState({ url: null, publicId: null });
            router.refresh();
          }}
        />
      </section>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div>
          <label
            htmlFor="profile-name"
            className="block text-sm font-medium text-gray-700"
          >
            اسم النشاط <span className="text-red-500">*</span>
          </label>
          <input
            id="profile-name"
            type="text"
            required
            minLength={2}
            maxLength={80}
            disabled={isSuspended}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm disabled:bg-gray-100"
          />
        </div>

        <div>
          <label
            htmlFor="profile-bio"
            className="block text-sm font-medium text-gray-700"
          >
            نبذة عن النشاط (نص عادي فقط)
          </label>
          <textarea
            id="profile-bio"
            rows={5}
            maxLength={1500}
            disabled={isSuspended}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="اكتب وصفاً واضحاً لخدماتك ومميزاتك..."
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm disabled:bg-gray-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            {bio.length} / 1500 حرف
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="profile-district"
              className="block text-sm font-medium text-gray-700"
            >
              المركز / المدينة <span className="text-red-500">*</span>
            </label>
            <select
              id="profile-district"
              required
              disabled={isSuspended}
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm disabled:bg-gray-100"
            >
              {DISTRICT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="profile-address"
              className="block text-sm font-medium text-gray-700"
            >
              العنوان التفصيلي
            </label>
            <input
              id="profile-address"
              type="text"
              maxLength={200}
              disabled={isSuspended}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="مثال: شارع صلاح سالم، بجوار..."
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="profile-phone"
              className="block text-sm font-medium text-gray-700"
            >
              رقم الهاتف
            </label>
            <input
              id="profile-phone"
              type="tel"
              disabled={isSuspended}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01012345678"
              dir="ltr"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm disabled:bg-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="profile-whatsapp"
              className="block text-sm font-medium text-gray-700"
            >
              رقم الواتساب
            </label>
            <input
              id="profile-whatsapp"
              type="tel"
              disabled={isSuspended}
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="01012345678"
              dir="ltr"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm disabled:bg-gray-100"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          يجب إدخال رقم الهاتف أو رقم الواتساب على الأقل (يُحفظ بصيغة +20XXXXXXXXXX).
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="profile-instagram"
              className="block text-sm font-medium text-gray-700"
            >
              رابط إنستجرام
            </label>
            <input
              id="profile-instagram"
              type="url"
              disabled={isSuspended}
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="https://www.instagram.com/username"
              dir="ltr"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm disabled:bg-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="profile-facebook"
              className="block text-sm font-medium text-gray-700"
            >
              رابط فيسبوك
            </label>
            <input
              id="profile-facebook"
              type="url"
              disabled={isSuspended}
              value={facebookUrl}
              onChange={(e) => setFacebookUrl(e.target.value)}
              placeholder="https://www.facebook.com/page"
              dir="ltr"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm disabled:bg-gray-100"
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700">
            التصنيفات (اختر من 1 إلى 3 وحدد تصنيفاً رئيسياً واحداً){" "}
            <span className="text-red-500">*</span>
          </p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {categories.map((cat) => {
              const checked = selectedCategoryIds.includes(cat.id);
              const isPrimary = primaryCategoryId === cat.id;
              return (
                <div
                  key={cat.id}
                  className={`flex items-center justify-between rounded-lg border p-2.5 text-sm ${
                    checked
                      ? "border-blue-300 bg-blue-50/50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <label className="flex flex-1 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      disabled={isSuspended}
                      checked={checked}
                      onChange={() => toggleCategory(cat.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span>{cat.nameAr}</span>
                  </label>

                  {checked && (
                    <label className="flex cursor-pointer items-center gap-1 text-xs font-medium text-blue-700">
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
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {saveError}
          </div>
        )}

        {saveSuccess && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {saveSuccess}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || isSuspended}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
        </button>
      </form>
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
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-bold text-gray-900">{title}</h2>
      <p className="mt-0.5 text-xs text-gray-500">{hint}</p>

      <div className="mt-3 overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50">
        {displayUrl ? (
          previewUrl ? (
            // Local blob preview while upload is in progress
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
          <div className="flex h-36 items-center justify-center text-xs text-gray-400">
            لا توجد صورة مرفوعة
          </div>
        )}
      </div>

      {uploading && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>جارٍ الرفع...</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs font-medium text-red-600">{error}</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <label
          className={`inline-flex cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 ${
            uploading || deleting || isSuspended
              ? "pointer-events-none opacity-50"
              : ""
          }`}
        >
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
          <button
            type="button"
            disabled={uploading || deleting || isSuspended}
            onClick={handleDelete}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            {deleting ? "جارٍ الحذف..." : "حذف"}
          </button>
        )}
      </div>
    </div>
  );
}

