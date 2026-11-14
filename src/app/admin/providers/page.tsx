import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { DISTRICT_LABELS, DISTRICT_VALUES } from "@/lib/districts";
import { getLastCoveredDateString, toCairoDateString } from "@/lib/cairo-time";
import { formatArabicDateString } from "@/lib/calendar-dates";
import { getSubscriptionState, SubscriptionState } from "@/lib/subscription";
import { AdminCard } from "@/components/admin/card";
import { AdminBadge } from "@/components/admin/badge";
import { AdminTable, AdminTableBody, AdminTableHead, AdminTd, AdminTh } from "@/components/admin/table";
import { AdminPagination } from "@/components/admin/pagination";
import { District, Prisma, ProviderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

interface SearchParams {
  search?: string;
  status?: string;
  category?: string;
  district?: string;
  subState?: string;
  sortBy?: "name" | "createdAt" | "subEnd";
  sortOrder?: "asc" | "desc";
  page?: string;
}

const PAGE_SIZE = 20;

export default async function AdminProvidersListPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  try {
    await requireRole("ADMIN");
  } catch (err) {
    if (err instanceof AuthError && err.code === "FORBIDDEN") {
      redirect("/unauthorized");
    }
    redirect("/login");
  }

  const searchParams = await props.searchParams;
  const search = searchParams.search?.trim() || "";
  const statusFilter = searchParams.status?.trim() || "";
  const categoryFilter = searchParams.category?.trim() || "";
  const districtFilter = searchParams.district?.trim() || "";
  const subStateFilter = searchParams.subState?.trim() || "";
  const sortBy = searchParams.sortBy || "createdAt";
  const sortOrder = searchParams.sortOrder || "desc";
  const currentPage = Math.max(1, Number(searchParams.page) || 1);

  // Load active categories for filter
  const allCategories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, nameAr: true },
  });

  // Base Prisma WHERE clause on User where role = PROVIDER
  const where: Prisma.UserWhereInput = {
    role: "PROVIDER",
  };

  // Search filter
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      {
        provider: {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { whatsapp: { contains: search, mode: "insensitive" } },
          ],
        },
      },
    ];
  }

  // Provider filters
  const providerWhere: Prisma.ProviderWhereInput = {};

  if (statusFilter && ["PENDING", "APPROVED", "SUSPENDED"].includes(statusFilter)) {
    providerWhere.status = statusFilter as ProviderStatus;
  }

  if (districtFilter && DISTRICT_VALUES.includes(districtFilter as District)) {
    providerWhere.district = districtFilter as District;
  }

  if (categoryFilter) {
    providerWhere.categories = {
      some: {
        categoryId: categoryFilter,
      },
    };
  }

  if (statusFilter === "NOT_COMPLETED") {
    where.provider = null;
  } else if (Object.keys(providerWhere).length > 0) {
    where.provider = providerWhere;
  }

  // Fetch users with provider and subscriptions
  const users = await prisma.user.findMany({
    where,
    include: {
      provider: {
        include: {
          categories: {
            include: { category: true },
          },
          subscriptions: {
            orderBy: { endsAt: "desc" },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const now = new Date();

  // Map to unified display items
  let items = users.map((user) => {
    const prov = user.provider;
    const isCompleted = Boolean(prov);
    const subState: SubscriptionState = prov
      ? getSubscriptionState(prov.subscriptions, now)
      : "NONE";

    const primaryCat = prov?.categories.find((c) => c.isPrimary)?.category?.nameAr;
    const fallbackCat = prov?.categories[0]?.category?.nameAr;

    // Latest active or latest subscription
    const activeSub = prov?.subscriptions.find((s) => s.status === "ACTIVE" && s.endsAt > now);
    const latestSub = activeSub || prov?.subscriptions[0];
    const subEndsAt = latestSub ? latestSub.endsAt : null;
    const lastCoveredDay = subEndsAt ? getLastCoveredDateString(subEndsAt) : null;

    return {
      providerId: prov?.id ?? null,
      userId: user.id,
      name: prov?.name ?? user.name,
      email: user.email,
      slug: prov?.slug ?? null,
      isCompleted,
      status: prov ? prov.status : ("NOT_COMPLETED" as const),
      primaryCategoryName: primaryCat || fallbackCat || "-",
      district: prov?.district ?? null,
      phone: prov?.phone ?? user.phone ?? "-",
      whatsapp: prov?.whatsapp ?? null,
      createdAt: prov?.createdAt ?? user.createdAt,
      subState,
      subEndsAt,
      lastCoveredDay,
    };
  });

  // Filter by subState if requested
  if (subStateFilter) {
    items = items.filter((item) => item.subState === subStateFilter);
  }

  // Sort items
  items.sort((a, b) => {
    if (sortBy === "name") {
      const cmp = a.name.localeCompare(b.name, "ar");
      return sortOrder === "asc" ? cmp : -cmp;
    }
    if (sortBy === "subEnd") {
      const aTime = a.subEndsAt ? a.subEndsAt.getTime() : 0;
      const bTime = b.subEndsAt ? b.subEndsAt.getTime() : 0;
      return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
    }
    // Default sortBy === "createdAt"
    const aTime = a.createdAt.getTime();
    const bTime = b.createdAt.getTime();
    return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
  });

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  const paginatedItems = items.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text sm:text-2xl">مقدمو الخدمة</h1>
          <p className="mt-1 text-xs text-text-muted">
            إدارة بيانات مقدمي الخدمة، حالات التوثيق والاشتراكات.
          </p>
        </div>
        <Link
          href="/admin/provider-accounts"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-hover"
        >
          <span>+</span>
          <span>إنشاء حساب مقدم جديد</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <AdminCard className="p-4">
        <form method="GET" className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-text mb-1">بحث</label>
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="الاسم، البريد أو الهاتف..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-text mb-1">حالة الحساب</label>
            <select
              name="status"
              defaultValue={statusFilter}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">الكل</option>
              <option value="PENDING">قيد المراجعة</option>
              <option value="APPROVED">معتمد</option>
              <option value="SUSPENDED">موقوف</option>
              <option value="NOT_COMPLETED">لم يكمل التسجيل</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-text mb-1">الفئة</label>
            <select
              name="category"
              defaultValue={categoryFilter}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">كل الفئات</option>
              {allCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nameAr}
                </option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="block text-xs font-medium text-text mb-1">المركز</label>
            <select
              name="district"
              defaultValue={districtFilter}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">كل المراكز</option>
              {DISTRICT_VALUES.map((d) => (
                <option key={d} value={d}>
                  {DISTRICT_LABELS[d]}
                </option>
              ))}
            </select>
          </div>

          {/* Subscription State */}
          <div>
            <label className="block text-xs font-medium text-text mb-1">حالة الاشتراك</label>
            <select
              name="subState"
              defaultValue={subStateFilter}
              className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="">كل الاشتراكات</option>
              <option value="ACTIVE">نشط</option>
              <option value="EXPIRING">أوشك على الانتهاء</option>
              <option value="EXPIRED">منتهي</option>
              <option value="NONE">بدون اشتراك</option>
              <option value="FUTURE">مستقبلي</option>
              <option value="CANCELLED">ملغي</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-end gap-2 lg:col-span-6 pt-1 border-t border-border mt-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-muted">ترتيب حسب:</span>
              <select
                name="sortBy"
                defaultValue={sortBy}
                className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text"
              >
                <option value="createdAt">تاريخ التسجيل</option>
                <option value="name">الاسم</option>
                <option value="subEnd">تاريخ انتهاء الاشتراك</option>
              </select>
              <select
                name="sortOrder"
                defaultValue={sortOrder}
                className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-text"
              >
                <option value="desc">تنازلي</option>
                <option value="asc">تصاعدي</option>
              </select>
            </div>

            <button
              type="submit"
              className="mr-auto rounded-lg bg-accent px-4 py-1.5 text-xs font-semibold text-white hover:bg-accent-hover cursor-pointer"
            >
              تطبيق الفلاتر
            </button>
            <Link
              href="/admin/providers"
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-surface-muted"
            >
              إعادة تعيين
            </Link>
          </div>
        </form>
      </AdminCard>

      {/* Mobile Cards List */}
      <div className="space-y-3 md:hidden">
        {paginatedItems.length === 0 ? (
          <AdminCard className="p-6 text-center text-xs text-text-muted">
            لا توجد نتائج مطابقة لبحثك.
          </AdminCard>
        ) : (
          paginatedItems.map((item) => (
            <AdminCard key={item.providerId ?? item.userId} className="p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  {item.isCompleted ? (
                    <Link
                      href={`/admin/providers/${item.providerId}`}
                      className="text-sm font-bold text-text hover:text-accent"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <span className="text-sm font-bold text-text">{item.name}</span>
                  )}
                  <p className="text-xs text-text-muted truncate" dir="ltr">
                    {item.email}
                  </p>
                </div>
                {renderStatusBadge(item.status)}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-y border-border py-2 text-text">
                <div>
                  <span className="text-text-muted">الفئة: </span>
                  <span className="font-medium">{item.primaryCategoryName}</span>
                </div>
                <div>
                  <span className="text-text-muted">المركز: </span>
                  <span className="font-medium">
                    {item.district ? DISTRICT_LABELS[item.district] : "-"}
                  </span>
                </div>
                <div>
                  <span className="text-text-muted">التواصل: </span>
                  <span dir="ltr" className="font-mono">{item.whatsapp || item.phone}</span>
                </div>
                <div>
                  <span className="text-text-muted">الاشتراك: </span>
                  {renderSubStateBadge(item.subState, item.lastCoveredDay)}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-text-muted">
                  {formatArabicDateString(toCairoDateString(item.createdAt))}
                </span>
                {item.isCompleted ? (
                  <Link
                    href={`/admin/providers/${item.providerId}`}
                    className="font-medium text-accent hover:underline"
                  >
                    عرض التفاصيل ←
                  </Link>
                ) : (
                  <Link
                    href="/admin/provider-accounts"
                    className="font-medium text-warning hover:underline"
                  >
                    إدارة الحساب ←
                  </Link>
                )}
              </div>
            </AdminCard>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <AdminTable>
          <AdminTableHead>
            <tr>
              <AdminTh>مقدم الخدمة</AdminTh>
              <AdminTh>الفئة الرئيسية</AdminTh>
              <AdminTh>المركز</AdminTh>
              <AdminTh>الحالة</AdminTh>
              <AdminTh>الاشتراك</AdminTh>
              <AdminTh>وسيلة التواصل</AdminTh>
              <AdminTh>تاريخ التسجيل</AdminTh>
              <AdminTh>إجراءات</AdminTh>
            </tr>
          </AdminTableHead>
          <AdminTableBody>
            {paginatedItems.length === 0 ? (
              <tr>
                <AdminTd className="py-8 text-center text-xs text-text-muted" colSpan={8}>
                  لا توجد نتائج مطابقة لبحثك.
                </AdminTd>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr key={item.providerId ?? item.userId} className="hover:bg-surface-muted/50">
                  <AdminTd>
                    <div>
                      {item.isCompleted ? (
                        <Link
                          href={`/admin/providers/${item.providerId}`}
                          className="font-semibold text-text hover:text-accent"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <span className="font-semibold text-text">{item.name}</span>
                      )}
                      <p className="text-xs text-text-muted truncate" dir="ltr">
                        {item.email}
                      </p>
                    </div>
                  </AdminTd>
                  <AdminTd className="text-xs">{item.primaryCategoryName}</AdminTd>
                  <AdminTd className="text-xs">
                    {item.district ? DISTRICT_LABELS[item.district] : "-"}
                  </AdminTd>
                  <AdminTd>{renderStatusBadge(item.status)}</AdminTd>
                  <AdminTd>{renderSubStateBadge(item.subState, item.lastCoveredDay)}</AdminTd>
                  <AdminTd>
                    <span dir="ltr" className="font-mono text-xs text-text">
                      {item.whatsapp || item.phone}
                    </span>
                  </AdminTd>
                  <AdminTd className="text-xs text-text-muted">
                    {formatArabicDateString(toCairoDateString(item.createdAt))}
                  </AdminTd>
                  <AdminTd>
                    {item.isCompleted ? (
                      <Link
                        href={`/admin/providers/${item.providerId}`}
                        className="rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-surface-muted"
                      >
                        عرض التفاصيل
                      </Link>
                    ) : (
                      <Link
                        href="/admin/provider-accounts"
                        className="rounded-md border border-warning bg-warning-muted px-2.5 py-1 text-xs font-medium text-warning hover:opacity-90"
                      >
                        حساب غير مكتمل
                      </Link>
                    )}
                  </AdminTd>
                </tr>
              ))
            )}
          </AdminTableBody>
        </AdminTable>
      </div>

      {/* Pagination */}
      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}

function renderStatusBadge(status: ProviderStatus | "NOT_COMPLETED") {
  if (status === "APPROVED") {
    return <AdminBadge variant="success">معتمد</AdminBadge>;
  }
  if (status === "PENDING") {
    return <AdminBadge variant="warning">قيد المراجعة</AdminBadge>;
  }
  if (status === "SUSPENDED") {
    return <AdminBadge variant="danger">موقوف</AdminBadge>;
  }
  return <AdminBadge variant="neutral">لم يكمل التسجيل</AdminBadge>;
}

function renderSubStateBadge(state: SubscriptionState, lastCoveredDay: string | null) {
  if (state === "ACTIVE") {
    return (
      <div className="space-y-0.5">
        <AdminBadge variant="success">نشط</AdminBadge>
        {lastCoveredDay && (
          <p className="text-[10px] text-text-muted">ينتهي: {lastCoveredDay}</p>
        )}
      </div>
    );
  }
  if (state === "EXPIRING") {
    return (
      <div className="space-y-0.5">
        <AdminBadge variant="warning">أوشك على الانتهاء</AdminBadge>
        {lastCoveredDay && (
          <p className="text-[10px] text-warning font-semibold">ينتهي: {lastCoveredDay}</p>
        )}
      </div>
    );
  }
  if (state === "EXPIRED") {
    return (
      <div className="space-y-0.5">
        <AdminBadge variant="danger">منتهي</AdminBadge>
        {lastCoveredDay && (
          <p className="text-[10px] text-text-muted">انتهى: {lastCoveredDay}</p>
        )}
      </div>
    );
  }
  if (state === "FUTURE") {
    return <AdminBadge variant="accent">مستقبلي</AdminBadge>;
  }
  if (state === "CANCELLED") {
    return <AdminBadge variant="neutral">ملغي</AdminBadge>;
  }
  return <AdminBadge variant="neutral">بدون اشتراك</AdminBadge>;
}
