import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth-helpers";
import { ProviderAccountsClient } from "./client";
import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

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
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">إدارة حسابات مقدمي الخدمة</h1>
          <p className="mt-1 text-xs text-text-muted">
            إنشاء حسابات جديدة للمقدمين، وإعادة تعيين كلمات المرور، والتعطيل والتفعيل.
          </p>
        </div>
        <Link
          href="/admin/providers"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-text hover:underline"
        >
          <span>عرض دليل مقدمي الخدمة</span>
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>
      </div>
      <ProviderAccountsClient />
    </div>
  );
}
