"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  List,
  X,
  House,
  Users,
  CreditCard,
  Tag,
  UserGear,
  ClockCounterClockwise,
  Star,
} from "@phosphor-icons/react";
import { LogoutButton } from "@/components/logout-button";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/cn";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  badgeKey?: "pendingReviews";
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "نظرة عامة", icon: House, exact: true },
  { href: "/admin/providers", label: "مقدمو الخدمة", icon: Users },
  { href: "/admin/subscriptions", label: "الاشتراكات", icon: CreditCard },
  { href: "/admin/categories", label: "الفئات", icon: Tag },
  { href: "/admin/reviews", label: "التقييمات", icon: Star, badgeKey: "pendingReviews" },
  { href: "/admin/provider-accounts", label: "حسابات المقدمين", icon: UserGear },
  { href: "/admin/audit-log", label: "سجل النشاط", icon: ClockCounterClockwise },
];

export function AdminNav({
  user,
  pendingReviewsCount = 0,
}: {
  user: { name?: string | null; email?: string | null };
  pendingReviewsCount?: number;
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
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-surface-raised px-4 md:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-[4px] border border-border text-text transition hover:bg-surface-muted cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="القائمة الرئيسية"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" weight="bold" />
            ) : (
              <List className="h-5 w-5" weight="light" />
            )}
          </button>
          <Logo variant="mark-less" size="sm" />
        </div>
        <div className="text-xs text-text-muted">{user.name}</div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-20 flex flex-col border-b border-border bg-surface-raised p-4 shadow-popover md:hidden">
          <nav className="flex flex-col gap-1.5">
            {NAV_ITEMS.map((item) => {
              const active = isItemActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex min-h-[44px] items-center gap-3 rounded-[4px] px-3.5 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-text text-text-inverse"
                      : "text-text hover:bg-surface-muted"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" weight={active ? "bold" : "light"} />
                  <span className="flex-1">{item.label}</span>
                  {item.badgeKey === "pendingReviews" && pendingReviewsCount > 0 && (
                    <span className="rounded-[2px] bg-accent px-1.5 py-0.5 font-latin text-[11px] font-semibold text-accent-contrast">
                      {pendingReviewsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-border pt-4">
            <div className="mb-2 text-xs text-text-muted">
              مسجل باسم: <span className="font-semibold text-text">{user.email}</span>
            </div>
            <LogoutButton className="w-full" />
          </div>
        </div>
      )}

      {/* Desktop Sidebar (RTL: on the start/right) */}
      <aside className="hidden h-screen w-64 shrink-0 flex-col border-e border-border bg-surface-raised p-5 md:flex">
        <div className="mb-6 flex flex-col gap-1 border-b border-border pb-5">
          <Logo href="/" variant="stacked" size="sm" />
          <span className="font-latin text-[10px] uppercase tracking-widest text-accent-text mt-1">
            ADMINISTRATION CONSOLE
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isItemActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-[44px] items-center gap-3 rounded-[4px] px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  active
                    ? "bg-text text-text-inverse"
                    : "text-text hover:bg-surface-muted"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" weight={active ? "bold" : "light"} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border pt-4">
          <div className="mb-3">
            <p className="text-xs font-semibold text-text">{user.name}</p>
            <p className="text-xs text-text-muted truncate font-latin" dir="ltr">
              {user.email}
            </p>
          </div>
          <LogoutButton className="w-full" />
        </div>
      </aside>
    </>
  );
}
