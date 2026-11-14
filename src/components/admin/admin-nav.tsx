"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/logout-button";

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "نظرة عامة", exact: true },
  { href: "/admin/providers", label: "مقدمو الخدمة" },
  { href: "/admin/subscriptions", label: "الاشتراكات" },
  { href: "/admin/categories", label: "الفئات" },
  { href: "/admin/provider-accounts", label: "حسابات المقدمين" },
  { href: "/admin/audit-log", label: "سجل النشاط" },
];

export function AdminNav({
  user,
}: {
  user: { name?: string | null; email?: string | null };
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function isItemActive(item: NavItem) {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  }

  return (
    <>
      {/* Mobile Top Header */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-surface px-4 md:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-border p-2 text-text transition hover:bg-surface-muted cursor-pointer"
            aria-label="القائمة الرئيسية"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
          <span className="font-bold text-text">لوحة إدارة يوم الفرح</span>
        </div>
        <div className="text-xs text-text-muted">{user.name}</div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-20 flex flex-col border-b border-border bg-surface p-4 shadow-lg md:hidden">
          <nav className="flex flex-col gap-1.5">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-accent text-white"
                      : "text-text hover:bg-surface-muted"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-border pt-4">
            <div className="mb-2 text-xs text-text-muted">
              مسجل باسم: <span className="font-semibold text-text">{user.email}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      )}

      {/* Desktop Sidebar (RTL: on the right) */}
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-l border-border bg-surface p-4 md:flex">
        <div className="mb-6 flex items-center gap-2 border-b border-border pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-base font-bold text-white">
            ف
          </div>
          <div>
            <h1 className="text-sm font-bold text-text">لوحة الإدارة</h1>
            <p className="text-xs text-text-muted">منصة يوم الفرح</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-accent text-white"
                    : "text-text hover:bg-surface-muted"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border pt-4">
          <div className="mb-3">
            <p className="text-xs font-semibold text-text">{user.name}</p>
            <p className="text-xs text-text-muted truncate" dir="ltr">
              {user.email}
            </p>
          </div>
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
