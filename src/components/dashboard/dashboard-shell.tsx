"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  User,
  Tag,
  Image as ImageIcon,
  CalendarBlank,
  WarningCircle,
  XCircle,
  Star,
  PaperPlaneTilt,
} from "@phosphor-icons/react";
import { LogoutButton } from "@/components/logout-button";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/cn";

interface DashboardShellProps {
  providerName?: string | null;
  providerStatus?: "PENDING" | "APPROVED" | "SUSPENDED" | null;
  userName: string;
  newLeadsCount?: number;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "الرئيسية", shortLabel: "الرئيسية", icon: House },
  { href: "/dashboard/profile", label: "الملف التعريفي", shortLabel: "الملف", icon: User },
  { href: "/dashboard/offers", label: "العروض والباقات", shortLabel: "العروض", icon: Tag },
  { href: "/dashboard/gallery", label: "معرض الصور", shortLabel: "المعرض", icon: ImageIcon },
  { href: "/dashboard/availability", label: "جدول المواعيد", shortLabel: "المواعيد", icon: CalendarBlank },
  { href: "/dashboard/leads", label: "الطلبات", shortLabel: "الطلبات", icon: PaperPlaneTilt, hasLeadsBadge: true },
  { href: "/dashboard/reviews", label: "التقييمات", shortLabel: "التقييمات", icon: Star },
] as const;

export function DashboardShell({
  providerName,
  providerStatus,
  userName,
  newLeadsCount = 0,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const hasProvider = Boolean(providerStatus);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-screen bg-surface text-text">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface-raised">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Logo href="/dashboard" variant="mark-less" size="sm" />
            <div className="min-w-0 border-s border-border ps-3">
              <span className="block truncate font-display text-sm font-semibold text-text">
                {providerName || "لوحة شريك يوم الفرح"}
              </span>
              <p className="truncate text-[11px] text-text-muted">{userName}</p>
            </div>
          </div>
          <LogoutButton className="shrink-0" />
        </div>

        {/* Desktop Navigation Tabs */}
        {hasProvider && (
          <nav
            aria-label="أقسام لوحة التحكم"
            className="hidden border-t border-border/60 bg-surface-raised md:block"
          >
            <div className="mx-auto flex max-w-5xl gap-1 px-5">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex min-h-[44px] items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-medium transition-colors",
                      active
                        ? "border-text text-text font-semibold"
                        : "border-transparent text-text-muted hover:text-text"
                    )}
                  >
                    <Icon className="h-4 w-4" weight={active ? "bold" : "light"} />
                    <span>{item.label}</span>
                    {"hasLeadsBadge" in item && item.hasLeadsBadge && newLeadsCount > 0 && (
                      <span className="rounded-[2px] bg-accent px-1.5 py-0.5 font-latin text-[10px] font-bold text-accent-contrast">
                        {newLeadsCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Main Content Area */}
      <div className={`mx-auto max-w-5xl px-5 py-6 ${hasProvider ? "pb-24 md:pb-12" : "pb-12"}`}>
        {providerStatus === "PENDING" && (
          <div
            role="status"
            className="mb-6 flex items-start gap-3 rounded-[4px] border border-warning/40 bg-warning-muted p-4 text-xs font-medium text-text leading-relaxed"
          >
            <WarningCircle className="h-5 w-5 shrink-0 text-warning mt-0.5" weight="bold" />
            <div>
              <strong className="block text-text font-semibold mb-0.5">
                حسابك قيد المراجعة والاعتماد
              </strong>
              يمكنك تعديل بياناتك وإضافة عروضك وصورك الآن، وسيظهر ملفك للزوار بعد الموافقة وتفعيل الاشتراك.
            </div>
          </div>
        )}

        {providerStatus === "SUSPENDED" && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-[4px] border border-danger/40 bg-danger-muted p-4 text-xs font-semibold text-danger leading-relaxed"
          >
            <XCircle className="h-5 w-5 shrink-0 text-danger mt-0.5" weight="bold" />
            <div>
              <strong className="block font-semibold mb-0.5">
                تم إيقاف حسابك مؤقتاً
              </strong>
              يرجى التواصل مع إدارة المنصة لتسوية حالة الحساب وتفعيله مجدداً.
            </div>
          </div>
        )}

        <main>{children}</main>
      </div>

      {/* Mobile Bottom Navigation (44px min targets) */}
      {hasProvider && (
        <nav
          aria-label="التنقل السفلي للجوال"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-raised md:hidden"
        >
          <div className="grid grid-cols-7">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex min-h-[52px] flex-col items-center justify-center gap-1 py-1 text-[10px] font-medium transition-colors",
                    active
                      ? "text-text font-semibold bg-surface-muted"
                      : "text-text-muted hover:text-text"
                  )}
                >
                  <Icon className="h-5 w-5" weight={active ? "bold" : "light"} />
                  <span>{item.shortLabel}</span>
                  {"hasLeadsBadge" in item && item.hasLeadsBadge && newLeadsCount > 0 && (
                    <span className="absolute top-1 end-2 rounded-[2px] bg-accent px-1 font-latin text-[9px] font-bold text-accent-contrast">
                      {newLeadsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
