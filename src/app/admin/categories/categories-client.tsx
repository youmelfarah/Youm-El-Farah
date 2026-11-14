"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminButton } from "@/components/admin/button";
import { AdminCard, AdminCardHeader } from "@/components/admin/card";
import { AdminInput } from "@/components/admin/input";
import { AdminBadge } from "@/components/admin/badge";
import { AdminTable, AdminTableBody, AdminTableHead, AdminTd, AdminTh } from "@/components/admin/table";
import {
  createCategoryAction,
  deleteCategoryAction,
  reorderCategoryAction,
  toggleCategoryActiveAction,
  updateCategoryAction,
} from "./actions";

interface CategoryItem {
  id: string;
  nameAr: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  providerCount: number;
}

export function CategoriesClient({
  categories,
}: {
  categories: CategoryItem[];
}) {
  const router = useRouter();

  // Create form state
  const [createNameAr, setCreateNameAr] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);

  // Edit modal state
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [editNameAr, setEditNameAr] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  // 1. Create Category
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");
    setCreateSuccess(false);

    const res = await createCategoryAction({
      nameAr: createNameAr,
      slug: createSlug,
    });
    setCreateLoading(false);
    if (res.error) {
      setCreateError(res.error);
    } else {
      setCreateSuccess(true);
      setCreateNameAr("");
      setCreateSlug("");
      setTimeout(() => setCreateSuccess(false), 3000);
      router.refresh();
    }
  }

  // 2. Edit Category (Name only, slug is immutable)
  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCategory) return;
    setEditLoading(true);
    setEditError("");

    const res = await updateCategoryAction({
      categoryId: editingCategory.id,
      nameAr: editNameAr,
    });
    setEditLoading(false);
    if (res.error) {
      setEditError(res.error);
    } else {
      setEditingCategory(null);
      router.refresh();
    }
  }

  // 3. Reorder
  async function handleReorder(categoryId: string, direction: "up" | "down") {
    setActionLoadingId(categoryId);
    setActionError("");
    const res = await reorderCategoryAction({ categoryId, direction });
    setActionLoadingId(null);
    if (res.error) {
      setActionError(res.error);
    } else {
      router.refresh();
    }
  }

  // 4. Toggle Active
  async function handleToggle(categoryId: string) {
    setActionLoadingId(categoryId);
    setActionError("");
    const res = await toggleCategoryActiveAction({ categoryId });
    setActionLoadingId(null);
    if (res.error) {
      setActionError(res.error);
    } else {
      router.refresh();
    }
  }

  // 5. Delete Category
  async function handleDelete(category: CategoryItem) {
    if (category.providerCount > 0) {
      alert("لا يمكن حذف هذه الفئة لأن هناك مقدمي خدمة مرتبطين بها.");
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف فئة "${category.nameAr}" نهائياً؟`)) {
      return;
    }

    setActionLoadingId(category.id);
    setActionError("");
    const res = await deleteCategoryAction({ categoryId: category.id });
    setActionLoadingId(null);
    if (res.error) {
      setActionError(res.error);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="rounded-lg border border-danger bg-danger-muted p-3 text-xs text-danger">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Categories List (2 cols on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <AdminCard className="p-4 sm:p-6">
            <AdminCardHeader
              title="قائمة الفئات"
              subtitle="الفئات مرتبة حسب تسلسل الظهور في الموقع ونماذج التسجيل"
            />

            {/* Mobile View */}
            <div className="space-y-3 md:hidden">
              {categories.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="rounded-lg border border-border bg-surface p-3 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-text text-sm">{cat.nameAr}</span>
                      <p dir="ltr" className="font-mono text-text-muted text-[11px]">
                        {cat.slug}
                      </p>
                    </div>
                    {cat.isActive ? (
                      <AdminBadge variant="success">نشط</AdminBadge>
                    ) : (
                      <AdminBadge variant="neutral">معطل</AdminBadge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-text-muted border-t border-border pt-2">
                    <span>عدد المقدمين: <strong className="text-text">{cat.providerCount}</strong></span>
                    <span>الترتيب: {cat.sortOrder}</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-border pt-2">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => handleReorder(cat.id, "up")}
                        disabled={idx === 0 || actionLoadingId === cat.id}
                        className="rounded border border-border px-2 py-1 text-xs disabled:opacity-30 hover:bg-surface-muted"
                        title="تحريك لأعلى"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReorder(cat.id, "down")}
                        disabled={idx === categories.length - 1 || actionLoadingId === cat.id}
                        className="rounded border border-border px-2 py-1 text-xs disabled:opacity-30 hover:bg-surface-muted"
                        title="تحريك لأسفل"
                      >
                        ▼
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(cat);
                          setEditNameAr(cat.nameAr);
                        }}
                        className="rounded border border-border px-2.5 py-1 text-xs font-medium text-text hover:bg-surface-muted"
                      >
                        تعديل
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggle(cat.id)}
                        disabled={actionLoadingId === cat.id}
                        className={`rounded border px-2.5 py-1 text-xs font-medium ${
                          cat.isActive
                            ? "border-warning text-warning hover:bg-warning-muted"
                            : "border-success text-success hover:bg-success-muted"
                        }`}
                      >
                        {cat.isActive ? "تعطيل" : "تفعيل"}
                      </button>

                      {cat.providerCount === 0 && (
                        <button
                          type="button"
                          onClick={() => handleDelete(cat)}
                          disabled={actionLoadingId === cat.id}
                          className="rounded border border-danger text-danger px-2.5 py-1 text-xs font-medium hover:bg-danger-muted"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <AdminTable>
                <AdminTableHead>
                  <tr>
                    <AdminTh className="w-16">الترتيب</AdminTh>
                    <AdminTh>اسم الفئة</AdminTh>
                    <AdminTh>المعرف (Slug)</AdminTh>
                    <AdminTh>المقدمين</AdminTh>
                    <AdminTh>الحالة</AdminTh>
                    <AdminTh>إجراءات</AdminTh>
                  </tr>
                </AdminTableHead>
                <AdminTableBody>
                  {categories.map((cat, idx) => (
                    <tr key={cat.id} className="hover:bg-surface-muted/50">
                      <AdminTd>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleReorder(cat.id, "up")}
                            disabled={idx === 0 || actionLoadingId === cat.id}
                            className="rounded p-1 text-xs hover:bg-surface-muted disabled:opacity-30 cursor-pointer"
                            title="تحريك لأعلى"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReorder(cat.id, "down")}
                            disabled={idx === categories.length - 1 || actionLoadingId === cat.id}
                            className="rounded p-1 text-xs hover:bg-surface-muted disabled:opacity-30 cursor-pointer"
                            title="تحريك لأسفل"
                          >
                            ▼
                          </button>
                        </div>
                      </AdminTd>
                      <AdminTd className="font-semibold text-text">{cat.nameAr}</AdminTd>
                      <AdminTd>
                        <span dir="ltr" className="font-mono text-xs text-text-muted">
                          {cat.slug}
                        </span>
                      </AdminTd>
                      <AdminTd className="text-xs font-bold text-text">
                        {cat.providerCount}
                      </AdminTd>
                      <AdminTd>
                        {cat.isActive ? (
                          <AdminBadge variant="success">نشط</AdminBadge>
                        ) : (
                          <AdminBadge variant="neutral">معطل</AdminBadge>
                        )}
                      </AdminTd>
                      <AdminTd>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(cat);
                              setEditNameAr(cat.nameAr);
                            }}
                            className="text-xs font-medium text-accent hover:underline cursor-pointer"
                          >
                            تعديل
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => handleToggle(cat.id)}
                            disabled={actionLoadingId === cat.id}
                            className={`text-xs font-medium cursor-pointer ${
                              cat.isActive
                                ? "text-warning hover:underline"
                                : "text-success hover:underline"
                            }`}
                          >
                            {cat.isActive ? "تعطيل" : "تفعيل"}
                          </button>
                          {cat.providerCount === 0 && (
                            <>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => handleDelete(cat)}
                                disabled={actionLoadingId === cat.id}
                                className="text-xs font-medium text-danger hover:underline cursor-pointer"
                              >
                                حذف
                              </button>
                            </>
                          )}
                        </div>
                      </AdminTd>
                    </tr>
                  ))}
                </AdminTableBody>
              </AdminTable>
            </div>
          </AdminCard>
        </div>

        {/* Create Category Form */}
        <div>
          <AdminCard className="p-4 sm:p-6">
            <AdminCardHeader
              title="إضافة فئة جديدة"
              subtitle="إنشاء فئة رئيسية لنشاطات الزفاف"
            />

            <form onSubmit={handleCreate} className="space-y-4">
              {createError && (
                <p className="rounded-lg border border-danger bg-danger-muted p-2 text-xs text-danger">
                  {createError}
                </p>
              )}
              {createSuccess && (
                <p className="rounded-lg border border-success bg-success-muted p-2 text-xs text-success">
                  تم إنشاء الفئة بنجاح!
                </p>
              )}

              <AdminInput
                label="اسم الفئة بالعربية"
                placeholder="مثال: قاعات أفراح"
                value={createNameAr}
                onChange={(e) => setCreateNameAr(e.target.value)}
                required
              />

              <AdminInput
                label="المعرف الإنجليزي (Slug)"
                placeholder="wedding-venues"
                dir="ltr"
                className="font-mono"
                value={createSlug}
                onChange={(e) => setCreateSlug(e.target.value.toLowerCase())}
                helpText="حروف إنجليزية صغيرة وأرقام وشرطات فقط. لا يمكن تغييره بعد الإنشاء."
                required
              />

              <AdminButton
                type="submit"
                disabled={createLoading}
                className="w-full"
              >
                {createLoading ? "جاري الإضافة..." : "إضافة الفئة"}
              </AdminButton>
            </form>
          </AdminCard>
        </div>
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-surface border border-border p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-text">تعديل اسم الفئة</h3>
            <p className="text-xs text-text-muted">
              المعرف الإنجليزي ({editingCategory.slug}) ثابت وغير قابل للتغيير.
            </p>

            {editError && (
              <p className="rounded-lg border border-danger bg-danger-muted p-2 text-xs text-danger">
                {editError}
              </p>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              <AdminInput
                label="اسم الفئة بالعربية"
                value={editNameAr}
                onChange={(e) => setEditNameAr(e.target.value)}
                required
              />

              <div className="flex justify-end gap-2">
                <AdminButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingCategory(null)}
                >
                  إلغاء
                </AdminButton>
                <AdminButton type="submit" size="sm" disabled={editLoading}>
                  {editLoading ? "جاري الحفظ..." : "حفظ التعديل"}
                </AdminButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
