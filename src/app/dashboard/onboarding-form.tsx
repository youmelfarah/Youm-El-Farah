"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DISTRICT_OPTIONS } from "@/lib/districts";
import { completeOnboardingAction } from "./actions";

interface CategoryOption {
  id: string;
  nameAr: string;
}

export function OnboardingForm({
  categories,
  defaultName,
}: {
  categories: CategoryOption[];
  defaultName: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [primaryCategoryId, setPrimaryCategoryId] = useState(
    categories[0]?.id ?? ""
  );
  const [district, setDistrict] = useState<string>("BENI_SUEF_CITY");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await completeOnboardingAction({
      name,
      primaryCategoryId,
      district,
      phone,
      whatsapp,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.refresh();
  };

  return (
    <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h1 className="text-xl font-bold text-gray-900">
        إنشاء ملف مقدم الخدمة
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        أكمل البيانات الأساسية لبدء استخدام لوحة التحكم وإضافة عروضك ومعرض أعمالك.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="onboarding-name"
            className="block text-sm font-medium text-gray-700"
          >
            اسم النشاط أو مقدم الخدمة <span className="text-red-500">*</span>
          </label>
          <input
            id="onboarding-name"
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثال: قاعة اللوتس للأفراح"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="onboarding-category"
            className="block text-sm font-medium text-gray-700"
          >
            التصنيف الرئيسي <span className="text-red-500">*</span>
          </label>
          <select
            id="onboarding-category"
            required
            value={primaryCategoryId}
            onChange={(e) => setPrimaryCategoryId(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {categories.length === 0 ? (
              <option value="">لا توجد تصنيفات متاحة حالياً</option>
            ) : (
              categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nameAr}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label
            htmlFor="onboarding-district"
            className="block text-sm font-medium text-gray-700"
          >
            المركز / المدينة <span className="text-red-500">*</span>
          </label>
          <select
            id="onboarding-district"
            required
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
            htmlFor="onboarding-phone"
            className="block text-sm font-medium text-gray-700"
          >
            رقم الهاتف
          </label>
          <input
            id="onboarding-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01012345678"
            dir="ltr"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="onboarding-whatsapp"
            className="block text-sm font-medium text-gray-700"
          >
            رقم الواتساب (اختياري)
          </label>
          <input
            id="onboarding-whatsapp"
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="01012345678"
            dir="ltr"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            يجب إدخال رقم الهاتف أو رقم الواتساب على الأقل (مثال: 01012345678 أو +201012345678).
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || categories.length === 0}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "جارٍ الحفظ..." : "إنشاء الملف الشخصي"}
        </button>
      </form>
    </div>
  );
}

