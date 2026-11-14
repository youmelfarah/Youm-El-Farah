"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CaretUp, CaretDown } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  MobileCardList,
  MobileCardItem,
} from "@/components/ui/table";
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

  // 2. Edit Category
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

  // 3. Toggle Active
  async function handleToggle(id: string) {
    setActionLoadingId(id);
    setActionError("");
    const res = await toggleCategoryActiveAction({ categoryId: id });
    setActionLoadingId(null);
    if (res.error) {
      setActionError(res.error);
    } else {
      router.refresh();
    }
  }

  // 4. Delete Category
  async function handleDelete(category: CategoryItem) {
    if (category.providerCount > 0) {
      alert("لا يمكن حذف هذه الفئة لأنها مرتبطة بمقدمي خدمة.");
      return;
    }
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف الفئة "${category.nameAr}"؟ لا يمكن التراجع عن هذا الإجراء.`
    );
    if (!confirmed) return;

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

  // 5. Reorder
  async function handleReorder(id: string, direction: "up" | "down") {
    setActionLoadingId(id);
    setActionError("");
    const res = await reorderCategoryAction({ categoryId: id, direction });
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
        <div className="rounded-[4px] border border-danger/30 bg-danger-muted p-3 text-xs text-danger">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Categories List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>قائمة الفئات الحالية ({categories.length})</CardTitle>
              <CardDescription>
                يمكنك إعادة ترتيب ظهور الفئات، تعديل الاسم العربي، تفعيل أو تعطيل الفئة، أو حذفها إن كانت فارغة.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mobile View (Cards) */}
              <MobileCardList>
                {categories.map((cat, idx) => (
                  <MobileCardItem key={cat.id}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-semibold text-text">{cat.nameAr}</span>
                        <p dir="ltr" className="font-mono text-xs text-text-muted mt-0.5">
                          {cat.slug}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant={cat.isActive ? "success" : "neutral"} size="sm">
                          {cat.isActive ? "نشط" : "معطل"}
                        </Badge>
                        <Badge variant="neutral" size="sm" className="font-latin">
                          {cat.providerCount} مقدم
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          iconOnly
                          onClick={() => handleReorder(cat.id, "up")}
                          disabled={idx === 0 || actionLoadingId === cat.id}
                          title="تحريك لأعلى"
                          className="h-8 w-8 min-h-[32px] min-w-[32px]"
                        >
                          <CaretUp className="h-3.5 w-3.5" weight="bold" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          iconOnly
                          onClick={() => handleReorder(cat.id, "down")}
                          disabled={idx === categories.length - 1 || actionLoadingId === cat.id}
                          title="تحريك لأسفل"
                          className="h-8 w-8 min-h-[32px] min-w-[32px]"
                        >
                          <CaretDown className="h-3.5 w-3.5" weight="bold" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingCategory(cat);
                            setEditNameAr(cat.nameAr);
                          }}
                        >
                          تعديل
                        </Button>

                        <Button
                          variant={cat.isActive ? "secondary" : "accent"}
                          size="sm"
                          onClick={() => handleToggle(cat.id)}
                          disabled={actionLoadingId === cat.id}
                        >
                          {cat.isActive ? "تعطيل" : "تفعيل"}
                        </Button>

                        {cat.providerCount === 0 && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(cat)}
                            disabled={actionLoadingId === cat.id}
                          >
                            حذف
                          </Button>
                        )}
                      </div>
                    </div>
                  </MobileCardItem>
                ))}
              </MobileCardList>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">الترتيب</TableHead>
                      <TableHead>اسم الفئة</TableHead>
                      <TableHead>المعرف (Slug)</TableHead>
                      <TableHead>المقدمين</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead className="text-end">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((cat, idx) => (
                      <TableRow key={cat.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              iconOnly
                              onClick={() => handleReorder(cat.id, "up")}
                              disabled={idx === 0 || actionLoadingId === cat.id}
                              title="تحريك لأعلى"
                              className="h-8 w-8 min-h-[32px] min-w-[32px]"
                            >
                              <CaretUp className="h-3.5 w-3.5" weight="bold" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              iconOnly
                              onClick={() => handleReorder(cat.id, "down")}
                              disabled={idx === categories.length - 1 || actionLoadingId === cat.id}
                              title="تحريك لأسفل"
                              className="h-8 w-8 min-h-[32px] min-w-[32px]"
                            >
                              <CaretDown className="h-3.5 w-3.5" weight="bold" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-text">{cat.nameAr}</TableCell>
                        <TableCell>
                          <span dir="ltr" className="font-mono text-xs text-text-muted">
                            {cat.slug}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-semibold font-latin text-text">
                          {cat.providerCount}
                        </TableCell>
                        <TableCell>
                          <Badge variant={cat.isActive ? "success" : "neutral"} size="sm">
                            {cat.isActive ? "نشط" : "معطل"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-end">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                setEditingCategory(cat);
                                setEditNameAr(cat.nameAr);
                              }}
                            >
                              تعديل
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleToggle(cat.id)}
                              disabled={actionLoadingId === cat.id}
                            >
                              {cat.isActive ? "تعطيل" : "تفعيل"}
                            </Button>
                            {cat.providerCount === 0 && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(cat)}
                                disabled={actionLoadingId === cat.id}
                              >
                                حذف
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Category Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>إضافة فئة جديدة</CardTitle>
              <CardDescription>إنشاء فئة رئيسية لنشاطات الزفاف</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                {createError && (
                  <p className="rounded-[4px] border border-danger/30 bg-danger-muted p-2 text-xs text-danger">
                    {createError}
                  </p>
                )}
                {createSuccess && (
                  <p className="rounded-[4px] border border-success/30 bg-success-muted p-2 text-xs text-success">
                    تم إنشاء الفئة بنجاح!
                  </p>
                )}

                <Field label="اسم الفئة بالعربية" required>
                  <Input
                    placeholder="مثال: قاعات أفراح"
                    value={createNameAr}
                    onChange={(e) => setCreateNameAr(e.target.value)}
                    required
                  />
                </Field>

                <Field
                  label="المعرف الإنجليزي (Slug)"
                  required
                  helpText="حروف إنجليزية صغيرة وأرقام وشرطات فقط. لا يمكن تغييره بعد الإنشاء."
                >
                  <Input
                    placeholder="wedding-venues"
                    dir="ltr"
                    className="font-mono"
                    value={createSlug}
                    onChange={(e) => setCreateSlug(e.target.value.toLowerCase())}
                    required
                  />
                </Field>

                <Button
                  type="submit"
                  loading={createLoading}
                  className="w-full"
                >
                  إضافة الفئة
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[8px] bg-surface-raised border border-border p-6 shadow-popover space-y-4">
            <h3 className="font-display text-base font-semibold text-text">تعديل اسم الفئة</h3>
            <p className="text-xs text-text-muted">
              المعرف الإنجليزي ({editingCategory.slug}) ثابت وغير قابل للتغيير.
            </p>

            {editError && (
              <p className="rounded-[4px] border border-danger/30 bg-danger-muted p-2 text-xs text-danger">
                {editError}
              </p>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              <Field label="اسم الفئة بالعربية" required>
                <Input
                  value={editNameAr}
                  onChange={(e) => setEditNameAr(e.target.value)}
                  required
                />
              </Field>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingCategory(null)}
                >
                  إلغاء
                </Button>
                <Button type="submit" size="sm" loading={editLoading}>
                  حفظ التعديل
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
