import * as React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

export interface MarketplacePaginationProps {
  currentPage: number;
  totalPages: number;
  pathname: string;
  searchParams: Record<string, string | number | undefined>;
}

export function MarketplacePagination({
  currentPage,
  totalPages,
  pathname,
  searchParams,
}: MarketplacePaginationProps) {
  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== "" && key !== "page") {
        sp.set(key, String(value));
      }
    }
    if (page > 1) {
      sp.set("page", String(page));
    }
    const query = sp.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("ellipsis");
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push("ellipsis");
      }
      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="pt-10 flex justify-center">
      <Pagination aria-label="تنقل الصفحات">
        <PaginationContent>
          {currentPage > 1 ? (
            <PaginationItem>
              <PaginationPrevious href={createPageUrl(currentPage - 1)} />
            </PaginationItem>
          ) : null}

          {pages.map((p, idx) => {
            if (p === "ellipsis") {
              return (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }
            return (
              <PaginationItem key={p}>
                <PaginationLink
                  href={createPageUrl(p)}
                  isActive={p === currentPage}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          {currentPage < totalPages ? (
            <PaginationItem>
              <PaginationNext href={createPageUrl(currentPage + 1)} />
            </PaginationItem>
          ) : null}
        </PaginationContent>
      </Pagination>
    </div>
  );
}
