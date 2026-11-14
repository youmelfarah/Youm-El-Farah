"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
}: AdminPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-text-muted">
        <span>إجمالي النتائج: {totalItems}</span>
      </div>
    );
  }

  function createPageURL(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    return `${pathname}?${params.toString()}`;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface px-4 py-3 text-xs text-text-muted">
      <div>
        عرض {startItem} إلى {endItem} من أصل {totalItems} نتيجة
      </div>
      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link
            href={createPageURL(currentPage - 1)}
            className="rounded-md border border-border bg-surface-muted px-3 py-1.5 font-medium text-text transition hover:bg-surface"
          >
            السابق
          </Link>
        ) : (
          <span className="cursor-not-allowed rounded-md border border-border bg-surface-muted px-3 py-1.5 opacity-50">
            السابق
          </span>
        )}

        <span className="px-2 font-medium text-text">
          صفحة {currentPage} من {totalPages}
        </span>

        {currentPage < totalPages ? (
          <Link
            href={createPageURL(currentPage + 1)}
            className="rounded-md border border-border bg-surface-muted px-3 py-1.5 font-medium text-text transition hover:bg-surface"
          >
            التالي
          </Link>
        ) : (
          <span className="cursor-not-allowed rounded-md border border-border bg-surface-muted px-3 py-1.5 opacity-50">
            التالي
          </span>
        )}
      </div>
    </div>
  );
}
