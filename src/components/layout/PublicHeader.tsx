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
import { cn } from "@/lib/cn";

export interface PublicHeaderProps {
  variant?: "solid" | "transparent";
}

const navLinks = [
  { href: "#venues", label: "القاعات" },
  { href: "#photography", label: "المصورين" },
  { href: "#dresses", label: "فساتين الزفاف" },
  { href: "#beauty", label: "الميك أب والشعر" },
  { href: "#about", label: "عن يوم الفرح" },
];

export function PublicHeader({ variant = "solid" }: PublicHeaderProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-colors duration-200",
        variant === "solid"
          ? "border-b border-border bg-surface/95 backdrop-blur-xs"
          : "border-b border-white/10 bg-surface/80"
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Logo href="/" variant="horizontal" size="sm" />

        {/* Desktop Nav */}
        <nav
          aria-label="القائمة الرئيسية"
          className="hidden md:flex items-center gap-6 text-sm"
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-text-muted hover:text-text transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA & Actions */}
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex text-xs min-h-[44px]"
          >
            <Link href="/login">تسجيل الدخول</Link>
          </Button>

          <Button
            asChild
            variant="primary"
            size="sm"
            className="hidden sm:inline-flex text-xs min-h-[44px]"
          >
            <Link href="/login">انضم كمقدم خدمة</Link>
          </Button>

          {/* Mobile Menu Drawer */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-11 w-11 min-h-[44px] min-w-[44px]"
                aria-label="فتح القائمة"
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

              <nav className="flex flex-col gap-1 text-sm mt-4">
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
