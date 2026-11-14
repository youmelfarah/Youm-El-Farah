"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DISTRICT_OPTIONS } from "@/lib/districts";
import { completeOnboardingAction } from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";

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
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>إنشاء ملف مقدم الخدمة</CardTitle>
          <CardDescription>
            أكملي البيانات الأساسية لنشاطكِ لبدء استخدام لوحة التحكم وإضافة عروضكِ ومعرض أعمالكِ.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="اسم النشاط أو مقدم الخدمة" htmlFor="onboarding-name" required>
              <Input
                id="onboarding-name"
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: قاعة اللوتس للأفراح"
              />
            </Field>

            <Field label="التصنيف الرئيسي" htmlFor="onboarding-category" required>
              <select
                id="onboarding-category"
                required
                value={primaryCategoryId}
                onChange={(e) => setPrimaryCategoryId(e.target.value)}
                className="flex h-11 w-full rounded-[4px] border border-border bg-surface-raised px-3.5 py-2 text-sm text-text transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            </Field>

            <Field label="المركز / المدينة" htmlFor="onboarding-district" required>
              <select
                id="onboarding-district"
                required
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

            <Field label="رقم الهاتف للتواصل" htmlFor="onboarding-phone">
              <Input
                id="onboarding-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01012345678"
                dir="ltr"
              />
            </Field>

            <Field
              label="رقم الواتساب (اختياري)"
              htmlFor="onboarding-whatsapp"
              helpText="يجب إدخال رقم الهاتف أو رقم الواتساب على الأقل (أرقام غربية 0-9)."
            >
              <Input
                id="onboarding-whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="01012345678"
                dir="ltr"
              />
            </Field>

            {error && (
              <div className="rounded-[4px] border border-danger/30 bg-danger-muted p-3 text-xs text-danger">
                {error}
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              disabled={categories.length === 0}
              variant="primary"
              className="w-full mt-2"
            >
              إنشاء الملف الشخصي
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
