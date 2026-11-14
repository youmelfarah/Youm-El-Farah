"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { LogoutButton } from "@/components/logout-button";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

type HeaderUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

  // DashboardShell and Admin layout render their own dedicated headers
  if (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  ) {
    return null;
  }

  const user = session?.user as HeaderUser | undefined;

  return (
    <header className="border-b border-border bg-surface-raised sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Logo href="/" variant="horizontal" size="sm" />

        <nav aria-label="التنقل الرئيسي" className="flex items-center gap-3">
          {isPending ? (
            <span className="text-xs text-text-muted">...</span>
          ) : user ? (
            <>
              <span className="hidden text-xs text-text-muted sm:inline font-medium">
                {user.name || user.email}
              </span>
              {user.role === "ADMIN" && (
                <Button asChild variant="secondary" size="sm">
                  <Link href="/admin">لوحة الإدارة</Link>
                </Button>
              )}
              {user.role === "PROVIDER" && (
                <Button asChild variant="secondary" size="sm">
                  <Link href="/dashboard">لوحة مقدم الخدمة</Link>
                </Button>
              )}
              <LogoutButton />
            </>
          ) : (
            pathname !== "/login" && (
              <Button asChild variant="primary" size="sm">
                <Link href="/login">تسجيل الدخول</Link>
              </Button>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
