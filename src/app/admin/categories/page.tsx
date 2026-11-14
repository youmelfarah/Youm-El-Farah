import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { CategoriesClient } from "./categories-client";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  try {
    await requireRole("ADMIN");
  } catch (err) {
    if (err instanceof AuthError && err.code === "FORBIDDEN") {
      redirect("/unauthorized");
    }
    redirect("/login");
  }

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    include: {
      _count: {
        select: { providers: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">الفئات</h1>
        <p className="mt-1 text-xs text-text-muted">
          إدارة أقسام الأنشطة وترتيب ظهورها وتفعيلها لمقدمي الخدمة والزوار.
        </p>
      </div>

      <CategoriesClient
        categories={categories.map((c) => ({
          id: c.id,
          nameAr: c.nameAr,
          slug: c.slug,
          sortOrder: c.sortOrder,
          isActive: c.isActive,
          providerCount: c._count.providers,
        }))}
      />
    </div>
  );
}
