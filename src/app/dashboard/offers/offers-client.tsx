"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createOfferAction,
  deleteOfferAction,
  reorderOfferAction,
  toggleOfferActiveAction,
  updateOfferAction,
} from "./actions";

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-gray-900">العروض والباقات</h1>
          <p className="mt-0.5 text-sm font-medium text-gray-600">
            استخدمت {offers.length} من {limit}
          </p>
        </div>

        <button
          type="button"
          disabled={atLimit || isSuspended}
          onClick={() => {
            setShowCreate((prev) => !prev);
            setEditingId(null);
          }}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {showCreate ? "إلغاء" : "إضافة عرض جديد"}
        </button>
      </div>

      {atLimit && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
          لقد وصلت إلى الحد الأقصى للعروض المسموح بها ({limit}). يمكنك تعديل أو حذف عرض حالي لإضافة عرض جديد.
        </div>
      )}

      {globalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
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
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          لا توجد عروض مضافة بعد.
        </div>
      ) : (
        <div className="space-y-3">
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
              <div
                key={offer.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-gray-900">
                        {offer.title}
                      </h2>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          offer.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {offer.isActive ? "نشط" : "غير نشط"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-blue-700">
                      {offer.price === null
                        ? "تواصل لمعرفة السعر"
                        : `${offer.price.toLocaleString("ar-EG")} ج.م`}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isSuspended || isBusy || index === 0}
                      onClick={() => handleReorder(offer.id, "up")}
                      aria-label="تحريك لأعلى"
                      className="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={
                        isSuspended || isBusy || index === offers.length - 1
                      }
                      onClick={() => handleReorder(offer.id, "down")}
                      aria-label="تحريك لأسفل"
                      className="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
                    >
                      ↓
                    </button>
                  </div>
                </div>

                {offer.description && (
                  <p className="mt-2 whitespace-pre-line text-sm text-gray-700">
                    {offer.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                  <button
                    type="button"
                    disabled={isSuspended || isBusy}
                    onClick={() => {
                      setEditingId(offer.id);
                      setShowCreate(false);
                    }}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    تعديل
                  </button>
                  <button
                    type="button"
                    disabled={isSuspended || isBusy}
                    onClick={() => handleToggle(offer.id)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {offer.isActive ? "إخفاء" : "تفعيل"}
                  </button>
                  <button
                    type="button"
                    disabled={isSuspended || isBusy}
                    onClick={() => handleDelete(offer.id)}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    حذف
                  </button>
                </div>
              </div>
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
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-xl border border-blue-200 bg-white p-4 shadow-sm"
    >
      <h2 className="text-sm font-bold text-gray-900">
        {mode === "create" ? "إضافة عرض جديد" : "تعديل العرض"}
      </h2>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          عنوان العرض <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          minLength={2}
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="مثال: باقة الزفاف الذهبية"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          السعر بالجنيه المصري (اختياري)
        </label>
        <input
          type="number"
          min={0}
          max={1000000}
          step={1}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="اتركه فارغاً ليظهر: تواصل لمعرفة السعر"
          dir="ltr"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          تفاصيل العرض (اختياري، نص عادي)
        </label>
        <textarea
          rows={3}
          maxLength={1000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="اذكر ما يشمله العرض..."
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "جارٍ الحفظ..." : "حفظ"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}

