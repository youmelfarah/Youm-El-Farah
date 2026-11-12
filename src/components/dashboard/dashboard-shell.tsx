"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

interface DashboardShellProps {
  providerName?: string | null;
  providerStatus?: "PENDING" | "APPROVED" | "SUSPENDED" | null;
  userName: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "الرئيسية", shortLabel: "الرئيسية" },
  { href: "/dashboard/profile", label: "الملف الشخصي", shortLabel: "الملف" },
  { href: "/dashboard/offers", label: "العروض", shortLabel: "العروض" },
  { href: "/dashboard/gallery", label: "المعرض", shortLabel: "المعرض" },
  { href: "/dashboard/availability", label: "المواعيد", shortLabel: "المواعيد" },
] as const;

export function DashboardShell({
  providerName,
  providerStatus,
  userName,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const hasProvider = Boolean(providerStatus);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <Link href="/dashboard" className="block truncate text-base font-bold text-gray-900">
              {providerName || "يوم الفرح - لوحة مقدم الخدمة"}
            </Link>
            <p className="truncate text-xs text-gray-500">{userName}</p>
          </div>
          <LogoutButton className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50" />
        </div>

        {hasProvider && (
          <nav
            aria-label="أقسام لوحة التحكم"
            className="hidden border-t border-gray-100 bg-white md:block"
          >
            <div className="mx-auto flex max-w-4xl gap-1 px-4">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                      active
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      <div className={`mx-auto max-w-4xl px-4 py-4 ${hasProvider ? "pb-24 md:pb-8" : "pb-8"}`}>
        {providerStatus === "PENDING" && (
          <div
            role="status"
            className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
          >
            حسابك قيد المراجعة — يمكنك تعديل بياناتك وإضافة عروضك وصورك الآن، وسيظهر ملفك للزوار بعد الموافقة وتفعيل الاشتراك.
          </div>
        )}

        {providerStatus === "SUSPENDED" && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm font-semibold text-red-900"
          >
            تم إيقاف حسابك، تواصل مع الإدارة
          </div>
        )}

        <main>{children}</main>
      </div>

      {hasProvider && (
        <nav
          aria-label="التنقل السفلي"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white md:hidden"
        >
          <div className="grid grid-cols-5">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center justify-center py-2.5 text-xs font-medium transition ${
                    active ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{item.shortLabel}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

