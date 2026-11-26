"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  List,
  User,
  CaretDown,
  SignOut,
  ShieldCheck,
  Storefront,
  Heart,
  Star,
} from "@phosphor-icons/react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Container } from "@/components/ui/container";
import { useSession, signOut } from "@/lib/auth-client";
import { navigationContent } from "@/content/navigation";
import { cn } from "@/lib/cn";

export interface PublicHeaderProps {
  variant?: "solid" | "transparent";
  initialWeddingDate?: string | null;
}

export function PublicHeader({
  variant = "solid",
  initialWeddingDate: _initialWeddingDate,
}: PublicHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  // When transparent, detect scroll to transition smoothly to solid surface
  React.useEffect(() => {
    if (variant !== "transparent") return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [variant]);

  const isEffectiveTransparent = variant === "transparent" && !isScrolled;

  const user = session?.user as
    | { name?: string | null; email?: string | null; role?: string | null }
    | undefined;

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  const navLinks = navigationContent.header.links;

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header
      data-theme={isEffectiveTransparent ? "dark" : undefined}
      className={cn(
        "sticky top-0 z-40 w-full transition-colors duration-200",
        isEffectiveTransparent
          ? "border-b border-white/10 bg-transparent text-white"
          : "border-b border-border bg-surface/95 backdrop-blur-xs text-text"
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-3">
        {/* Logo */}
        <div className="shrink-0">
          <Logo href="/" variant="horizontal" size="sm" />
        </div>

        {/* Desktop Nav Links */}
        <nav
          aria-label="القائمة الرئيسية"
          className="hidden md:flex items-center gap-6 text-sm"
        >
          {navLinks.map((link) => {
            const active = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "min-h-[44px] inline-flex items-center text-sm transition-colors relative py-1",
                  active
                    ? isEffectiveTransparent
                      ? "text-accent-text font-semibold"
                      : "text-text font-semibold border-b-2 border-accent-text"
                    : isEffectiveTransparent
                    ? "text-white/80 hover:text-white"
                    : "text-text-muted hover:text-text"
                )}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Join CTA Button (Desktop) */}
          <Button
            asChild
            variant="secondary"
            size="sm"
            className={cn(
              "hidden sm:inline-flex text-xs min-h-[44px]",
              isEffectiveTransparent && "border-white/20 text-white hover:bg-white/10 hover:text-white"
            )}
          >
            <Link href="/join">{navigationContent.header.actions.join}</Link>
          </Button>

          {/* Account Area (Desktop) */}
          <div className="hidden sm:inline-flex items-center">
            {isPending ? (
              <div className="h-9 w-20 animate-pulse rounded-[4px] bg-surface-muted" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant={isEffectiveTransparent ? "outline" : "secondary"}
                    size="sm"
                    className={cn(
                      "min-h-[44px] gap-2 text-xs",
                      isEffectiveTransparent && "border-white/20 text-white hover:bg-white/10 hover:text-white"
                    )}
                    aria-label="قائمة الحساب"
                  >
                    <User className="h-4 w-4" weight="light" />
                    <span className="max-w-[110px] truncate">
                      {user.name || user.email || "حسابي"}
                    </span>
                    <CaretDown className="h-3 w-3 opacity-60" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal border-b border-border pb-2 mb-1">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold text-text leading-none">
                        {user.name || "مستخدم مسجل"}
                      </p>
                      {user.email && (
                        <p className="text-xs text-text-muted leading-none mt-1 truncate">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  {user.role === "ADMIN" && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 cursor-pointer w-full min-h-[36px]"
                      >
                        <ShieldCheck className="h-4 w-4 text-accent-text" weight="light" />
                        <span>{navigationContent.header.actions.adminDashboard}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === "PROVIDER" && (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 cursor-pointer w-full min-h-[36px]"
                      >
                        <Storefront className="h-4 w-4 text-accent-text" weight="light" />
                        <span>{navigationContent.header.actions.providerDashboard}</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {(user.role === "ADMIN" || user.role === "PROVIDER") && (
                    <DropdownMenuSeparator />
                  )}
                  {user.role === "VISITOR" && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/account"
                          className="flex items-center gap-2 cursor-pointer w-full min-h-[36px]"
                        >
                          <User className="h-4 w-4 text-accent-text" weight="light" />
                          <span>{navigationContent.header.actions.myAccount}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/account/favorites"
                          className="flex items-center gap-2 cursor-pointer w-full min-h-[36px]"
                        >
                          <Heart className="h-4 w-4 text-accent-text" weight="light" />
                          <span>{navigationContent.header.actions.favorites}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href="/account/reviews"
                          className="flex items-center gap-2 cursor-pointer w-full min-h-[36px]"
                        >
                          <Star className="h-4 w-4 text-accent-text" weight="light" />
                          <span>{navigationContent.header.actions.myReviews}</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    danger
                    onClick={handleLogout}
                    className="flex items-center gap-2 cursor-pointer min-h-[36px]"
                  >
                    <SignOut className="h-4 w-4" weight="light" />
                    <span>{navigationContent.header.actions.logout}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                asChild
                variant={isEffectiveTransparent ? "outline" : "ghost"}
                size="sm"
                className={cn(
                  "text-xs min-h-[44px]",
                  isEffectiveTransparent && "border-white/20 text-white hover:bg-white/10 hover:text-white"
                )}
              >
                <Link href="/login">{navigationContent.header.actions.login}</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Drawer (Sheet) */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant={isEffectiveTransparent ? "outline" : "ghost"}
                size="icon"
                className={cn(
                  "md:hidden h-11 w-11 min-h-[44px] min-w-[44px]",
                  isEffectiveTransparent && "border-white/20 text-white hover:bg-white/10"
                )}
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

              {/* Navigation Links */}
              <nav
                aria-label="روابط القائمة للجوال"
                className="flex flex-col gap-1 text-sm border-t border-border pt-3"
              >
                {navLinks.map((link) => {
                  const active = isLinkActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex min-h-[44px] items-center border-b border-border/50 text-sm transition-colors",
                        active
                          ? "text-accent-text font-semibold ps-2 border-accent-text/60"
                          : "text-text hover:text-accent-text"
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Account & Join Actions on Mobile */}
              <div className="flex flex-col gap-3 mt-auto pt-6 border-t border-border">
                <Button asChild variant="primary" className="w-full min-h-[44px]">
                  <Link href="/join" onClick={() => setIsOpen(false)}>
                    {navigationContent.header.actions.join}
                  </Link>
                </Button>

                {isPending ? (
                  <div className="h-11 w-full animate-pulse rounded-[4px] bg-surface-muted" />
                ) : user ? (
                  <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
                    <div className="px-1 py-1 text-xs">
                      <p className="font-semibold text-text">{user.name || "مستخدم مسجل"}</p>
                      {user.email && (
                        <p className="text-[11px] text-text-muted truncate">{user.email}</p>
                      )}
                    </div>
                    {user.role === "ADMIN" && (
                      <Button asChild variant="secondary" className="w-full min-h-[44px]">
                        <Link href="/admin" onClick={() => setIsOpen(false)}>
                          {navigationContent.header.actions.adminDashboard}
                        </Link>
                      </Button>
                    )}
                    {user.role === "PROVIDER" && (
                      <Button asChild variant="secondary" className="w-full min-h-[44px]">
                        <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                          {navigationContent.header.actions.providerDashboard}
                        </Link>
                      </Button>
                    )}
                    {user.role === "VISITOR" && (
                      <>
                        <Button asChild variant="secondary" className="w-full min-h-[44px]">
                          <Link href="/account" onClick={() => setIsOpen(false)}>
                            {navigationContent.header.actions.myAccount}
                          </Link>
                        </Button>
                        <Button asChild variant="secondary" className="w-full min-h-[44px]">
                          <Link href="/account/favorites" onClick={() => setIsOpen(false)}>
                            {navigationContent.header.actions.favorites}
                          </Link>
                        </Button>
                        <Button asChild variant="secondary" className="w-full min-h-[44px]">
                          <Link href="/account/reviews" onClick={() => setIsOpen(false)}>
                            {navigationContent.header.actions.myReviews}
                          </Link>
                        </Button>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsOpen(false);
                        handleLogout();
                      }}
                      className="w-full min-h-[44px] text-danger hover:text-danger hover:bg-danger-muted"
                    >
                      {navigationContent.header.actions.logout}
                    </Button>
                  </div>
                ) : (
                  <Button asChild variant="secondary" className="w-full min-h-[44px]">
                    <Link href="/login" onClick={() => setIsOpen(false)}>
                      {navigationContent.header.actions.login}
                    </Link>
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
}
