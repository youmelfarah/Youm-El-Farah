import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth-helpers";
import { ProviderAccountsClient } from "./client";
import Link from "next/link";

export default async function ProviderAccountsPage() {
  try {
    await requireRole("ADMIN");
  } catch (err) {
    if (err instanceof AuthError && err.code === "FORBIDDEN") {
      redirect("/unauthorized");
    }
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-text">إدارة حسابات مقدمي الخدمة</h1>
          <p className="mt-1 text-xs text-text-muted">
            إنشاء حسابات جديدة للمقدمين، وإعادة تعيين كلمات المرور، والتعطيل والتفعيل.
          </p>
        </div>
        <Link
          href="/admin/providers"
          className="text-xs font-medium text-accent hover:underline"
        >
          ← عرض دليل مقدمي الخدمة
        </Link>
      </div>
      <ProviderAccountsClient />
    </div>
  );
}

