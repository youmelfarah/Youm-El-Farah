"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Heart } from "@phosphor-icons/react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";
import { LoginRequiredDialog } from "@/components/auth/login-required-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

// Shared client-side cache for the signed-in visitor's favorited provider IDs
let cachedUserId: string | null = null;
let cachedIds: Set<string> | null = null;
let inflightPromise: Promise<Set<string>> | null = null;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) listener();
}

async function ensureFavoritesLoaded(userId: string): Promise<Set<string>> {
  if (cachedUserId === userId && cachedIds) {
    return cachedIds;
  }
  if (cachedUserId !== userId) {
    cachedUserId = userId;
    cachedIds = null;
    inflightPromise = null;
  }
  if (!inflightPromise) {
    inflightPromise = fetch("/api/favorites", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { providerIds: [] }))
      .then((data: { providerIds?: string[] }) => {
        const set = new Set(data.providerIds ?? []);
        cachedIds = set;
        notifyListeners();
        return set;
      })
      .catch(() => {
        const empty = new Set<string>();
        cachedIds = empty;
        return empty;
      })
      .finally(() => {
        inflightPromise = null;
      });
  }
  return inflightPromise;
}

function setCachedFavorite(providerId: string, favorited: boolean) {
  if (!cachedIds) cachedIds = new Set<string>();
  if (favorited) {
    cachedIds.add(providerId);
  } else {
    cachedIds.delete(providerId);
  }
  notifyListeners();
}

export interface FavoriteButtonProps {
  providerId: string;
  initialFavorited?: boolean;
  variant?: "card" | "hero";
  className?: string;
  onRemoved?: () => void;
}

export function FavoriteButton({
  providerId,
  initialFavorited,
  variant = "card",
  className,
  onRemoved,
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const user = session?.user as { id?: string; role?: string } | undefined;
  const userId = user?.id ?? null;
  const userRole = user?.role ?? null;

  const [favorited, setFavorited] = React.useState<boolean>(
    Boolean(initialFavorited)
  );
  const [pending, setPending] = React.useState(false);
  const [loginOpen, setLoginOpen] = React.useState(false);

  // Sync with shared cache when signed in as VISITOR
  React.useEffect(() => {
    if (!userId || userRole !== "VISITOR") {
      if (initialFavorited === undefined) {
        setFavorited(false);
      }
      return;
    }

    if (initialFavorited !== undefined) {
      setCachedFavorite(providerId, initialFavorited);
    }

    const updateFromCache = () => {
      if (cachedUserId === userId && cachedIds) {
        setFavorited(cachedIds.has(providerId));
      }
    };
    listeners.add(updateFromCache);

    if (initialFavorited === undefined) {
      void ensureFavoritesLoaded(userId).then((set) => {
        setFavorited(set.has(providerId));
      });
    }

    return () => {
      listeners.delete(updateFromCache);
    };
  }, [userId, userRole, providerId, initialFavorited]);

  const executeToggle = React.useCallback(
    async (forceAddOnly = false) => {
      if (pending) return;
      const previous = favorited;
      if (forceAddOnly && previous) return;

      const optimistic = forceAddOnly ? true : !previous;
      setFavorited(optimistic);
      setCachedFavorite(providerId, optimistic);
      setPending(true);

      try {
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ providerId }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          favorited?: boolean;
          error?: string;
          code?: string;
        };

        if (!res.ok || !data.ok) {
          setFavorited(previous);
          setCachedFavorite(providerId, previous);
          if (data.code === "UNAUTHENTICATED") {
            setLoginOpen(true);
            return;
          }
          toast.error(data.error || "تعذر تحديث المفضلة");
          return;
        }

        const nextState = Boolean(data.favorited);
        setFavorited(nextState);
        setCachedFavorite(providerId, nextState);
        toast.success(
          nextState ? "تمت الإضافة إلى المفضلة" : "تمت الإزالة من المفضلة"
        );
        if (!nextState) {
          onRemoved?.();
        }
        router.refresh();
      } catch {
        setFavorited(previous);
        setCachedFavorite(providerId, previous);
        toast.error("حدث خطأ في الاتصال. حاولي مرة أخرى.");
      } finally {
        setPending(false);
      }
    },
    [pending, favorited, providerId, onRemoved, router]
  );

  // Resume pending favorite action after Google login return
  React.useEffect(() => {
    const pendingParam = searchParams?.get("pendingAction");
    if (
      pendingParam === `favorite:${providerId}` &&
      userId &&
      userRole === "VISITOR"
    ) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("pendingAction");
      const nextUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.replace(nextUrl, { scroll: false });
      void executeToggle(true);
    }
  }, [searchParams, providerId, userId, userRole, pathname, router, executeToggle]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      setLoginOpen(true);
      return;
    }
    if (userRole !== "VISITOR") {
      toast.info("المفضلة متاحة لحسابات الزائرات فقط");
      return;
    }
    void executeToggle(false);
  };

  if (variant === "hero") {
    return (
      <>
        <Button
          type="button"
          variant={favorited ? "primary" : "outline"}
          size="sm"
          onClick={handleClick}
          disabled={pending}
          aria-pressed={favorited}
          aria-label={favorited ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
          className={cn(
            "min-h-[44px] gap-2",
            !favorited && "border-border-strong",
            className
          )}
        >
          <Heart
            className={cn("h-4 w-4", favorited && "text-danger")}
            weight={favorited ? "fill" : "light"}
          />
          <span>{favorited ? "في المفضلة" : "حفظ في المفضلة"}</span>
        </Button>

        <LoginRequiredDialog
          open={loginOpen}
          onOpenChange={setLoginOpen}
          pendingAction={`favorite:${providerId}`}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={favorited}
        aria-label={favorited ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-[4px] border border-border bg-surface-raised/95 text-text transition-colors cursor-pointer",
          "hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          favorited && "border-danger/40 text-danger",
          className
        )}
      >
        <Heart className="h-4 w-4" weight={favorited ? "fill" : "light"} />
      </button>

      <LoginRequiredDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        pendingAction={`favorite:${providerId}`}
      />
    </>
  );
}
