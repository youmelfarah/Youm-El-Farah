"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CaretUp, CaretDown, Tag, Plus } from "@phosphor-icons/react";
import {
  createOfferAction,
  deleteOfferAction,
  reorderOfferAction,
  toggleOfferActiveAction,
  updateOfferAction,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { formatMoney } from "@/lib/format-money";

export interface OfferItem {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  isActive: boolean;
  sortOrder: number;
}

export function OffersClient({
  offers,
  limit,
  isSuspended,
}: {
  offers: OfferItem[];
  limit: number;
  isSuspended: boolean;
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState("");

  const atLimit = offers.length >= limit;

  const handleToggle = async (offerId: string) => {
    if (isSuspended) return;
    setBusyId(offerId);
    setGlobalError("");
    const res = await toggleOfferActiveAction({ offerId });
    setBusyId(null);
    if (res.error) {
      setGlobalError(res.error);
      return;
    }
    router.refresh();
  };

  const handleDelete = async (offerId: string) => {
    if (isSuspended) return;
    if (!confirm("هل أنت متأكد من حذف هذا العرض؟")) return;
    setBusyId(offerId);
    setGlobalError("");
    const res = await deleteOfferAction({ offerId });
    setBusyId(null);
    if (res.error) {
      setGlobalError(res.error);
      return;
    }
    router.refresh();
  };

  const handleReorder = async (offerId: string, direction: "up" | "down") => {
    if (isSuspended) return;
    setBusyId(offerId);
    setGlobalError("");
    const res = await reorderOfferAction({ offerId, direction });
    setBusyId(null);
    if (res.error) {
      setGlobalError(res.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
                العروض والباقات
              </h1>
              <p className="mt-1 text-xs text-text-muted">
                استخدمت <span className="font-latin font-bold text-text">{offers.length}</span> من أصل{" "}
                <span className="font-latin font-bold text-text">{limit}</span> عروض متاحة في باقتك.
              </p>
            </div>

            <Button
              type="button"
              disabled={atLimit || isSuspended}
              onClick={() => {
                setShowCreate((prev) => !prev);
                setEditingId(null);
              }}
              variant={showCreate ? "secondary" : "primary"}
            >
              {showCreate ? "إلغاء الإضافة" : "إضافة عرض جديد"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {atLimit && (
        <div className="rounded-[4px] border border-warning/40 bg-warning-muted p-4 text-xs font-medium text-text">
          لقد وصلتِ إلى الحد الأقصى للعروض المسموح بها (<span className="font-latin font-bold">{limit}</span>). يمكنكِ تعديل أو حذف عرض حالي لإضافة عرض جديد.
        </div>
      )}

      {globalError && (
        <div className="rounded-[4px] border border-danger/30 bg-danger-muted p-3 text-xs text-danger">
          {globalError}
        </div>
      )}

      {showCreate && !atLimit && !isSuspended && (
        <OfferForm
          mode="create"
          onCancel={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            router.refresh();
          }}
        />
      )}

      {offers.length === 0 ? (
        <EmptyState
          icon={<Tag className="h-6 w-6" weight="light" />}
          title="لا توجد عروض مضافة بعد"
          description="أضيفي عروضكِ وباقات الزفاف لتسهيل مقارنة الأسعار والخدمات على العرائس."
          action={
            !isSuspended && (
              <Button
                variant="primary"
                onClick={() => setShowCreate(true)}
              >
                إضافة أول عرض
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {offers.map((offer, index) => {
            const isEditing = editingId === offer.id;
            const isBusy = busyId === offer.id;

            if (isEditing && !isSuspended) {
              return (
                <OfferForm
                  key={offer.id}
                  mode="edit"
                  initialOffer={offer}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => {
                    setEditingId(null);
                    router.refresh();
                  }}
                />
              );
            }

            return (
              <Card key={offer.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="font-display text-base font-semibold text-text">
                        {offer.title}
                      </h2>
                      <Badge variant={offer.isActive ? "success" : "neutral"} size="sm">
                        {offer.isActive ? "نشط" : "غير نشط"}
                      </Badge>
                    </div>
                    <p className="mt-1 font-latin text-sm font-semibold text-accent-text">
                      {offer.price === null
                        ? "تواصل لمعرفة السعر"
                        : formatMoney(offer.price)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      iconOnly
                      disabled={isSuspended || isBusy || index === 0}
                      onClick={() => handleReorder(offer.id, "up")}
                      aria-label="تحريك لأعلى"
                      className="h-8 w-8 min-h-[32px] min-w-[32px]"
                    >
                      <CaretUp className="h-3.5 w-3.5" weight="bold" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      iconOnly
                      disabled={isSuspended || isBusy || index === offers.length - 1}
                      onClick={() => handleReorder(offer.id, "down")}
                      aria-label="تحريك لأسفل"
                      className="h-8 w-8 min-h-[32px] min-w-[32px]"
                    >
                      <CaretDown className="h-3.5 w-3.5" weight="bold" />
                    </Button>
                  </div>
                </div>

                {offer.description && (
                  <p className="mt-2.5 whitespace-pre-line text-xs text-text-muted leading-relaxed">
                    {offer.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isSuspended || isBusy}
                    onClick={() => {
                      setEditingId(offer.id);
                      setShowCreate(false);
                    }}
                  >
                    تعديل
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isSuspended || isBusy}
                    onClick={() => handleToggle(offer.id)}
                  >
                    {offer.isActive ? "إخفاء" : "تفعيل"}
                  </Button>
                  <Button
                    type="button"
                    variant="danger-outline"
                    size="sm"
                    disabled={isSuspended || isBusy}
                    onClick={() => handleDelete(offer.id)}
                  >
                    حذف
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OfferForm({
  mode,
  initialOffer,
  onCancel,
  onSaved,
}: {
  mode: "create" | "edit";
  initialOffer?: OfferItem;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(initialOffer?.title ?? "");
  const [description, setDescription] = useState(
    initialOffer?.description ?? ""
  );
  const [price, setPrice] = useState(
    initialOffer?.price !== null && initialOffer?.price !== undefined
      ? String(initialOffer.price)
      : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result =
      mode === "create"
        ? await createOfferAction({ title, description, price })
        : await updateOfferAction({
            offerId: initialOffer!.id,
            title,
            description,
            price,
          });

    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }

    onSaved();
  };

  return (
    <Card className="p-5">
      <CardHeader className="p-0 pb-3 mb-4 border-b border-border">
        <CardTitle>{mode === "create" ? "إضافة عرض جديد" : "تعديل بيانات العرض"}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="عنوان العرض أو الباقة" required>
          <Input
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: باقة الزفاف الملكية المتكاملة"
          />
        </Field>

        <Field
          label="السعر بالجنيه المصري (اختياري - أرقام غربية 0-9)"
          helpText="اتركيه فارغاً ليظهر للزوار: تواصل لمعرفة السعر"
        >
          <Input
            type="number"
            min={0}
            max={1000000}
            step={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="مثال: 12000"
            dir="ltr"
          />
        </Field>

        <Field label="تفاصيل ومكونات العرض (اختياري)">
          <Textarea
            rows={3}
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="اذكري ما تشمله الباقة من خدمات، ساعات العمل، والتجهيزات..."
          />
        </Field>

        {error && (
          <div className="rounded-[4px] border border-danger/30 bg-danger-muted p-2.5 text-xs text-danger">
            {error}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            type="submit"
            loading={loading}
            variant="primary"
          >
            حفظ العرض
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            إلغاء
          </Button>
        </div>
      </form>
    </Card>
  );
}
