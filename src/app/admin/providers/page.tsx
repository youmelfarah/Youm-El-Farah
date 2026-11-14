import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { DISTRICT_LABELS, DISTRICT_VALUES } from "@/lib/districts";
import { getLastCoveredDateString, toCairoDateString } from "@/lib/cairo-time";
import { formatArabicDateString } from "@/lib/calendar-dates";
import { getSubscriptionState, SubscriptionState } from "@/lib/subscription";
import { Card } from "@/components/ui/card";
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
import { DataPagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
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

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
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

  // Provider-level filters
  const providerWhere: Prisma.ProviderWhereInput = {};
  if (statusFilter) {
    providerWhere.status = statusFilter as ProviderStatus;
  }
  if (categoryFilter) {
    providerWhere.categories = {
      some: {
        categoryId: categoryFilter,
      },
    };
  }
  if (districtFilter) {
    providerWhere.district = districtFilter as District;
  }

  if (Object.keys(providerWhere).length > 0) {
    where.provider = providerWhere;
  }

  // Fetch all users matching criteria
  const now = new Date();
  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      provider: {
        select: {
          id: true,
          name: true,
          status: true,
          district: true,
          phone: true,
          whatsapp: true,
          createdAt: true,
          categories: {
            select: {
              isPrimary: true,
              category: {
                select: { id: true, nameAr: true },
              },
            },
          },
          subscriptions: {
            select: {
              id: true,
              status: true,
              startsAt: true,
              endsAt: true,
            },
          },
        },
      },
    },
  });

  // Process rows with subscription state
  type RowItem = {
    userId: string;
    email: string;
    name: string;
    providerId: string | null;
    status: ProviderStatus | "NOT_COMPLETED";
    primaryCategoryName: string;
    district: District | null;
    phone: string | null;
    whatsapp: string | null;
    subState: SubscriptionState;
    lastCoveredDay: string | null;
    rawSubEnd: Date | null;
    createdAt: Date;
    isCompleted: boolean;
  };

  const rows: RowItem[] = users.map((u) => {
    const p = u.provider;
    if (!p) {
      return {
        userId: u.id,
        email: u.email,
        name: u.name || "مقدم غير مكتمل",
        providerId: null,
        status: "NOT_COMPLETED",
        primaryCategoryName: "-",
        district: null,
        phone: null,
        whatsapp: null,
        subState: "NONE",
        lastCoveredDay: null,
        rawSubEnd: null,
        createdAt: u.createdAt,
        isCompleted: false,
      };
    }

    const subState = getSubscriptionState(p.subscriptions, now);
    let lastCoveredDay: string | null = null;
    let rawSubEnd: Date | null = null;

    const activeOrExpiring = p.subscriptions
      .filter((s) => s.status === "ACTIVE" && s.endsAt > now)
      .sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime());

    if (activeOrExpiring.length > 0) {
      rawSubEnd = activeOrExpiring[0].endsAt;
      lastCoveredDay = getLastCoveredDateString(rawSubEnd);
    } else {
      const pastSubs = p.subscriptions
        .filter((s) => s.status === "ACTIVE" && s.endsAt <= now)
        .sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime());
      if (pastSubs.length > 0) {
        rawSubEnd = pastSubs[0].endsAt;
        lastCoveredDay = getLastCoveredDateString(rawSubEnd);
      }
    }

    const primaryCat = p.categories.find((c) => c.isPrimary) || p.categories[0];
    const primaryCategoryName = primaryCat?.category?.nameAr || "-";

    return {
      userId: u.id,
      email: u.email,
      name: p.name,
      providerId: p.id,
      status: p.status,
      primaryCategoryName,
      district: p.district,
      phone: p.phone,
      whatsapp: p.whatsapp,
      subState,
      lastCoveredDay,
      rawSubEnd,
      createdAt: p.createdAt,
      isCompleted: true,
    };
  });

  // Apply in-memory subscription state filter if specified
  const filteredRows = subStateFilter
    ? rows.filter((r) => r.subState === subStateFilter)
    : rows;

  // In-memory sorting
  filteredRows.sort((a, b) => {
    if (sortBy === "name") {
      const cmp = a.name.localeCompare(b.name, "ar");
      return sortOrder === "asc" ? cmp : -cmp;
    }
    if (sortBy === "subEnd") {
      const timeA = a.rawSubEnd ? a.rawSubEnd.getTime() : 0;
      const timeB = b.rawSubEnd ? b.rawSubEnd.getTime() : 0;
      return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
    }
    // Default createdAt
    const timeA = a.createdAt.getTime();
    const timeB = b.createdAt.getTime();
    return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
  });

  // Pagination
  const totalItems = filteredRows.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedItems = filteredRows.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">إدارة مقدمي الخدمة</h1>
          <p className="mt-1 text-xs text-text-muted">
            متابعة حسابات الشركاء، مراجعة الملفات واعتمادها، وحالة اشتراكاتهم.
          </p>
        </div>
        <Button asChild variant="primary">
          <Link href="/admin/provider-accounts">
            + إنشاء حساب مقدم جديد
          </Link>
        </Button>
      </div>

      {/* Filter Card */}
      <Card className="p-4">
        <form
          method="GET"
          action="/admin/providers"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6"
        >
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-xs font-medium text-text mb-1">
              بحث (الاسم، البريد، الهاتف)
            </label>
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="ابحث بالاسم أو رقم الهاتف..."
              className="h-11 w-full rounded-[4px] border border-border bg-surface-raised px-3 py-2 text-xs text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-text mb-1">حالة الملف</label>
            <select
              name="status"
              defaultValue={statusFilter}
              className="h-11 w-full rounded-[4px] border border-border bg-surface-raised px-3 py-2 text-xs text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">كل الحالات</option>
              <option value="APPROVED">معتمد</option>
              <option value="PENDING">قيد المراجعة</option>
              <option value="SUSPENDED">موقوف</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-text mb-1">الفئة</label>
            <select
              name="category"
              defaultValue={categoryFilter}
              className="h-11 w-full rounded-[4px] border border-border bg-surface-raised px-3 py-2 text-xs text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="h-11 w-full rounded-[4px] border border-border bg-surface-raised px-3 py-2 text-xs text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="h-11 w-full rounded-[4px] border border-border bg-surface-raised px-3 py-2 text-xs text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-6 pt-3 border-t border-border mt-1">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-text-muted">ترتيب حسب:</span>
              <select
                name="sortBy"
                defaultValue={sortBy}
                className="h-9 rounded-[4px] border border-border bg-surface-raised px-2.5 py-1 text-xs text-text"
              >
                <option value="createdAt">تاريخ التسجيل</option>
                <option value="name">الاسم</option>
                <option value="subEnd">تاريخ انتهاء الاشتراك</option>
              </select>
              <select
                name="sortOrder"
                defaultValue={sortOrder}
                className="h-9 rounded-[4px] border border-border bg-surface-raised px-2.5 py-1 text-xs text-text"
              >
                <option value="desc">تنازلي</option>
                <option value="asc">تصاعدي</option>
              </select>
            </div>

            <div className="flex items-center gap-2 ms-auto">
              <Button
                type="submit"
                variant="primary"
                size="sm"
              >
                تطبيق الفلاتر
              </Button>
              <Button
                asChild
                variant="secondary"
                size="sm"
              >
                <Link href="/admin/providers">
                  إعادة تعيين
                </Link>
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* Mobile Cards List */}
      <MobileCardList>
        {paginatedItems.length === 0 ? (
          <Card className="p-6 text-center text-xs text-text-muted">
            لا توجد نتائج مطابقة لبحثك.
          </Card>
        ) : (
          paginatedItems.map((item) => (
            <MobileCardItem key={item.providerId ?? item.userId}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  {item.isCompleted ? (
                    <Link
                      href={`/admin/providers/${item.providerId}`}
                      className="text-sm font-semibold text-text hover:text-accent-text"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <span className="text-sm font-semibold text-text">{item.name}</span>
                  )}
                  <p className="text-xs text-text-muted font-latin" dir="ltr">
                    {item.email}
                  </p>
                </div>
                {renderStatusBadge(item.status)}
              </div>

              <div className="grid grid-cols-2 gap-2 border-y border-border py-2 text-xs text-text-muted">
                <div>
                  الفئة: <strong className="text-text">{item.primaryCategoryName}</strong>
                </div>
                <div>
                  المركز:{" "}
                  <strong className="text-text">
                    {item.district ? DISTRICT_LABELS[item.district] : "-"}
                  </strong>
                </div>
                <div>
                  الاشتراك: {renderSubStateBadge(item.subState, item.lastCoveredDay)}
                </div>
                <div>
                  التسجيل:{" "}
                  <span className="font-latin">
                    {formatArabicDateString(toCairoDateString(item.createdAt))}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span dir="ltr" className="font-mono text-xs text-text">
                  {item.whatsapp || item.phone || "-"}
                </span>

                {item.isCompleted ? (
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/admin/providers/${item.providerId}`}>
                      عرض التفاصيل
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/admin/provider-accounts">
                      حساب غير مكتمل
                    </Link>
                  </Button>
                )}
              </div>
            </MobileCardItem>
          ))
        )}
      </MobileCardList>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>مقدم الخدمة</TableHead>
              <TableHead>الفئة الرئيسية</TableHead>
              <TableHead>المركز</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الاشتراك</TableHead>
              <TableHead>وسيلة التواصل</TableHead>
              <TableHead>تاريخ التسجيل</TableHead>
              <TableHead className="text-end">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell className="py-8 text-center text-xs text-text-muted" colSpan={8}>
                  لا توجد نتائج مطابقة لبحثك.
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item) => (
                <TableRow key={item.providerId ?? item.userId}>
                  <TableCell>
                    <div>
                      {item.isCompleted ? (
                        <Link
                          href={`/admin/providers/${item.providerId}`}
                          className="font-semibold text-text hover:text-accent-text"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <span className="font-semibold text-text">{item.name}</span>
                      )}
                      <p className="text-xs text-text-muted truncate font-latin" dir="ltr">
                        {item.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">{item.primaryCategoryName}</TableCell>
                  <TableCell className="text-xs">
                    {item.district ? DISTRICT_LABELS[item.district] : "-"}
                  </TableCell>
                  <TableCell>{renderStatusBadge(item.status)}</TableCell>
                  <TableCell>{renderSubStateBadge(item.subState, item.lastCoveredDay)}</TableCell>
                  <TableCell>
                    <span dir="ltr" className="font-mono text-xs text-text">
                      {item.whatsapp || item.phone}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-text-muted font-latin">
                    {formatArabicDateString(toCairoDateString(item.createdAt))}
                  </TableCell>
                  <TableCell className="text-end">
                    {item.isCompleted ? (
                      <Button asChild variant="secondary" size="sm">
                        <Link href={`/admin/providers/${item.providerId}`}>
                          عرض التفاصيل
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="secondary" size="sm">
                        <Link href="/admin/provider-accounts">
                          حساب غير مكتمل
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataPagination
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
    return <Badge variant="success" size="sm">معتمد</Badge>;
  }
  if (status === "PENDING") {
    return <Badge variant="warning" size="sm">قيد المراجعة</Badge>;
  }
  if (status === "SUSPENDED") {
    return <Badge variant="danger" size="sm">موقوف</Badge>;
  }
  return <Badge variant="neutral" size="sm">لم يكمل التسجيل</Badge>;
}

function renderSubStateBadge(state: SubscriptionState, lastCoveredDay: string | null) {
  if (state === "ACTIVE") {
    return (
      <div className="space-y-0.5">
        <Badge variant="success" size="sm">نشط</Badge>
        {lastCoveredDay && (
          <p className="text-[10px] text-text-muted font-latin">ينتهي: {lastCoveredDay}</p>
        )}
      </div>
    );
  }
  if (state === "EXPIRING") {
    return (
      <div className="space-y-0.5">
        <Badge variant="warning" size="sm">أوشك على الانتهاء</Badge>
        {lastCoveredDay && (
          <p className="text-[10px] text-warning font-semibold font-latin">ينتهي: {lastCoveredDay}</p>
        )}
      </div>
    );
  }
  if (state === "EXPIRED") {
    return (
      <div className="space-y-0.5">
        <Badge variant="danger" size="sm">منتهي</Badge>
        {lastCoveredDay && (
          <p className="text-[10px] text-text-muted font-latin">انتهى: {lastCoveredDay}</p>
        )}
      </div>
    );
  }
  if (state === "FUTURE") {
    return <Badge variant="accent" size="sm">مستقبلي</Badge>;
  }
  if (state === "CANCELLED") {
    return <Badge variant="neutral" size="sm">ملغي</Badge>;
  }
  return <Badge variant="neutral" size="sm">بدون اشتراك</Badge>;
}
