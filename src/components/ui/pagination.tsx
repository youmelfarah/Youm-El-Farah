"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CaretLeft, CaretRight, DotsThree } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";
import { buttonVariants } from "@/components/ui/button";

export const Pagination = ({
  className,
  ...props
}: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);
Pagination.displayName = "Pagination";

export const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
));
PaginationContent.displayName = "PaginationContent";

export const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

export type PaginationLinkProps = {
  isActive?: boolean;
} & (
  | (Omit<React.ComponentProps<typeof Link>, "href"> & { href: string })
  | (React.ComponentProps<"button"> & { href?: undefined })
);

export const PaginationLink = ({
  className,
  isActive,
  children,
  ...props
}: PaginationLinkProps) => {
  const commonClasses = cn(
    buttonVariants({
      variant: isActive ? "primary" : "secondary",
      size: "sm",
    }),
    "min-h-[44px] min-w-[44px] rounded-[4px] px-3 font-medium",
    isActive && "pointer-events-none",
    className
  );

  if ("href" in props && typeof props.href === "string") {
    return (
      <Link
        aria-current={isActive ? "page" : undefined}
        className={commonClasses}
        {...(props as React.ComponentProps<typeof Link>)}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      aria-current={isActive ? "page" : undefined}
      className={commonClasses}
      {...(props as React.ComponentProps<"button">)}
    >
      {children}
    </button>
  );
};
PaginationLink.displayName = "PaginationLink";

export const PaginationPrevious = ({
  className,
  ...props
}: PaginationLinkProps) => (
  <PaginationLink
    aria-label="الانتقال إلى الصفحة السابقة"
    className={cn("gap-1.5 px-3", className)}
    {...props}
  >
    <CaretRight className="h-4 w-4" weight="bold" />
    <span className="hidden sm:inline">السابق</span>
  </PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

export const PaginationNext = ({
  className,
  ...props
}: PaginationLinkProps) => (
  <PaginationLink
    aria-label="الانتقال إلى الصفحة التالية"
    className={cn("gap-1.5 px-3", className)}
    {...props}
  >
    <span className="hidden sm:inline">التالي</span>
    <CaretLeft className="h-4 w-4" weight="bold" />
  </PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

export const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-11 w-11 items-center justify-center text-text-muted", className)}
    {...props}
  >
    <DotsThree className="h-5 w-5" weight="bold" />
    <span className="sr-only">صفحات إضافية</span>
  </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

/**
 * DataPagination: Connected pagination bar for data tables (with total count & URL search params).
 * Formatted with Western digits (0-9) and 44px touch targets.
 */
export interface DataPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  className?: string;
}

export function DataPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  className,
}: DataPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) {
    return (
      <div className={cn("flex items-center justify-between border-t border-border bg-surface-raised px-4 py-3 text-xs text-text-muted", className)}>
        <span>إجمالي النتائج: <strong className="font-latin text-text">{totalItems}</strong></span>
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
    <div className={cn("flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-raised px-4 py-3 text-xs text-text-muted", className)}>
      <div className="font-latin">
        عرض {startItem} إلى {endItem} من أصل {totalItems} نتيجة
      </div>
      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link
            href={createPageURL(currentPage - 1)}
            className="inline-flex min-h-[44px] items-center justify-center rounded-[4px] border border-border bg-surface-raised px-3.5 py-1.5 font-medium text-text transition hover:bg-surface-muted"
          >
            السابق
          </Link>
        ) : (
          <span className="inline-flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-[4px] border border-border bg-surface-muted px-3.5 py-1.5 opacity-50">
            السابق
          </span>
        )}

        <span className="px-2 font-medium font-latin text-text">
          صفحة {currentPage} من {totalPages}
        </span>

        {currentPage < totalPages ? (
          <Link
            href={createPageURL(currentPage + 1)}
            className="inline-flex min-h-[44px] items-center justify-center rounded-[4px] border border-border bg-surface-raised px-3.5 py-1.5 font-medium text-text transition hover:bg-surface-muted"
          >
            التالي
          </Link>
        ) : (
          <span className="inline-flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-[4px] border border-border bg-surface-muted px-3.5 py-1.5 opacity-50">
            التالي
          </span>
        )}
      </div>
    </div>
  );
}

// Backward-compatible alias
export const AdminPagination = DataPagination;
