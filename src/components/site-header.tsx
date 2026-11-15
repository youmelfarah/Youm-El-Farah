"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { List } from "@phosphor-icons/react";
import { useSession } from "@/lib/auth-client";
import { LogoutButton } from "@/components/logout-button";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type HeaderUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Dashboard, Admin, and Public Marketplace render their own dedicated headers
  if (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/services" ||
    pathname.startsWith("/services/") ||
    pathname.startsWith("/providers/")
  ) {
    return null;
  }

  const user = session?.user as HeaderUser | undefined;

  return (
    <header className="border-b border-border bg-surface-raised sticky top-0 z-40">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Logo href="/" variant="horizontal" size="sm" />

        {/* Desktop Navigation (>= 640px) */}
        <nav aria-label="التنقل الرئيسي" className="hidden sm:flex items-center gap-3">
          {isPending ? (
            <span className="text-xs text-text-muted">...</span>
          ) : user ? (
            <>
              <span className="text-xs text-text-muted font-medium">
                {user.name || user.email}
              </span>
              {user.role === "ADMIN" && (
                <Button asChild variant="secondary" size="sm" className="min-h-[44px]">
                  <Link href="/admin">لوحة الإدارة</Link>
                </Button>
              )}
              {user.role === "PROVIDER" && (
                <Button asChild variant="secondary" size="sm" className="min-h-[44px]">
                  <Link href="/dashboard">لوحة مقدم الخدمة</Link>
                </Button>
              )}
              <LogoutButton className="min-h-[44px]" />
            </>
          ) : (
            pathname !== "/login" && (
              <Button asChild variant="primary" size="sm" className="min-h-[44px]">
                <Link href="/login">تسجيل الدخول</Link>
              </Button>
            )
          )}
        </nav>

        {/* Mobile Header Menu Button (< 640px) */}
        <div className="sm:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 min-h-[44px] min-w-[44px]"
                aria-label="فتح القائمة الرئيسية"
              >
                <List className="h-5 w-5" weight="light" />
              </Button>
            </SheetTrigger>
            <SheetContent side="start" className="flex flex-col gap-6">
              <SheetHeader>
                <SheetTitle>
                  <Logo href="/" variant="stacked" size="sm" />
                </SheetTitle>
              </SheetHeader>

              {user ? (
                <div className="flex flex-col gap-4 py-2">
                  <div className="rounded-[4px] border border-border bg-surface-muted p-3">
                    <p className="text-sm font-semibold text-text">
                      {user.name || "مستخدم مسجل"}
                    </p>
                    {user.email && (
                      <p className="text-xs text-text-muted mt-0.5">{user.email}</p>
                    )}
                    <span className="inline-block mt-2 font-latin text-[10px] tracking-wider uppercase text-accent-text">
                      {user.role === "ADMIN" ? "مدير النظام (Admin)" : "شريك معتمد (Provider)"}
                    </span>
                  </div>

                  <nav className="flex flex-col gap-2 pt-2">
                    {user.role === "ADMIN" && (
                      <Button
                        asChild
                        variant="secondary"
                        className="w-full min-h-[44px] justify-start"
                      >
                        <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                          لوحة الإدارة
                        </Link>
                      </Button>
                    )}
                    {user.role === "PROVIDER" && (
                      <Button
                        asChild
                        variant="secondary"
                        className="w-full min-h-[44px] justify-start"
                      >
                        <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                          لوحة مقدم الخدمة
                        </Link>
                      </Button>
                    )}
                  </nav>

                  <div className="mt-auto pt-6 border-t border-border">
                    <LogoutButton className="w-full min-h-[44px]" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 py-4">
                  <p className="text-xs text-text-muted">
                    مرحباً بكِ في يوم الفرح، دليلكِ الشامل لخدمات وأفراح بني سويف.
                  </p>
                  <div className="flex flex-col gap-3 pt-4 border-t border-border">
                    <Button asChild variant="primary" className="w-full min-h-[44px]">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        تسجيل الدخول
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" className="w-full min-h-[44px]">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        انضم كمقدم خدمة
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
