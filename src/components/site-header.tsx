"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { LogoutButton } from "@/components/logout-button";

type HeaderUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

  // DashboardShell renders its own dedicated sticky header and navigation
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    return null;
  }

  const user = session?.user as HeaderUser | undefined;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="text-lg font-bold text-gray-900 transition hover:text-blue-600"
        >
          يوم الفرح
        </Link>

        <nav aria-label="التنقل الرئيسي" className="flex items-center gap-3">
          {isPending ? (
            <span className="text-xs text-gray-400">...</span>
          ) : user ? (
            <>
              <span className="hidden text-sm text-gray-600 sm:inline">
                {user.name || user.email}
              </span>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                >
                  لوحة الإدارة
                </Link>
              )}
              {user.role === "PROVIDER" && (
                <Link
                  href="/dashboard"
                  className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                >
                  لوحة مقدم الخدمة
                </Link>
              )}
              <LogoutButton className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50" />
            </>
          ) : (
            pathname !== "/login" && (
              <Link
                href="/login"
                className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                تسجيل الدخول
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
