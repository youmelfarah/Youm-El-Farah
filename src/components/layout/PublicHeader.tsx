"use client";

import * as React from "react";
import Link from "next/link";
import { List } from "@phosphor-icons/react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Container } from "@/components/ui/container";
import { WeddingDatePicker } from "@/components/wedding-date/wedding-date-picker";
import { cn } from "@/lib/cn";

export interface PublicHeaderProps {
  variant?: "solid" | "transparent";
  initialWeddingDate?: string | null;
}

const navLinks = [
  { href: "/services", label: "جميع الخدمات" },
  { href: "/services/venues", label: "القاعات" },
  { href: "/services/photographer", label: "المصورين" },
  { href: "/services/makeup-artist", label: "الميك أب" },
  { href: "/services/atelier", label: "الفساتين" },
];

export function PublicHeader({
  variant = "solid",
  initialWeddingDate = null,
}: PublicHeaderProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [weddingDate, setWeddingDate] = React.useState<string | null>(initialWeddingDate);

  React.useEffect(() => {
    setWeddingDate(initialWeddingDate);
  }, [initialWeddingDate]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-colors duration-200",
        variant === "solid"
          ? "border-b border-border bg-surface/95 backdrop-blur-xs text-text"
          : "border-b border-white/10 bg-transparent text-white"
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-3">
        {/* Logo */}
        <div className="shrink-0">
          <Logo href="/" variant="horizontal" size="sm" />
        </div>

        {/* Desktop Nav */}
        <nav
          aria-label="القائمة الرئيسية"
          className="hidden lg:flex items-center gap-5 text-sm"
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "transition-colors",
                variant === "transparent"
                  ? "text-white/80 hover:text-white"
                  : "text-text-muted hover:text-text"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Wedding Date Picker + Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Wedding Date Flow Picker */}
          <WeddingDatePicker
            currentDate={weddingDate}
            onSelectDate={(d) => setWeddingDate(d)}
            onClearDate={() => setWeddingDate(null)}
            variant={variant}
          />

          <Button
            asChild
            variant={variant === "transparent" ? "secondary" : "ghost"}
            size="sm"
            className="hidden sm:inline-flex text-xs min-h-[44px]"
          >
            <Link href="/login">تسجيل الدخول</Link>
          </Button>

          {/* Mobile Menu Drawer */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant={variant === "transparent" ? "outline" : "ghost"}
                size="icon"
                className="lg:hidden h-11 w-11 min-h-[44px] min-w-[44px]"
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

              <div className="py-2">
                <p className="text-xs text-text-muted mb-2">تاريخ زفافكِ:</p>
                <WeddingDatePicker
                  currentDate={weddingDate}
                  onSelectDate={(d) => {
                    setWeddingDate(d);
                    setIsOpen(false);
                  }}
                  onClearDate={() => {
                    setWeddingDate(null);
                    setIsOpen(false);
                  }}
                  className="w-full justify-start"
                />
              </div>

              <nav className="flex flex-col gap-1 text-sm border-t border-border pt-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="flex min-h-[44px] items-center text-text border-b border-border/50 hover:text-accent-text transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="flex flex-col gap-3 mt-auto pt-6 border-t border-border">
                <Button asChild variant="primary" className="w-full min-h-[44px]">
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    انضم كمقدم خدمة
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="w-full min-h-[44px]">
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    تسجيل الدخول
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
}
