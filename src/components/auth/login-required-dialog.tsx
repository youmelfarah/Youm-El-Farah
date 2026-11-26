"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Validates that a returnTo URL is a safe relative same-origin path.
 */
export function sanitizeReturnTo(raw: string | null | undefined): string {
  if (!raw) return "/";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return "/";
  }
  return trimmed;
}

export interface LoginRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  /** Optional query param value like "review", "lead", or "favorite" appended to current URL */
  pendingAction?: string;
  /** Optional explicit callback path; defaults to current pathname + search + pendingAction */
  returnTo?: string;
}

export function LoginRequiredDialog({
  open,
  onOpenChange,
  title = "سجّلي دخولك بجوجل علشان تكملي",
  description = "بعد تسجيل الدخول هترجعي لنفس الصفحة وتكملي خطوتك تلقائياً.",
  pendingAction,
  returnTo,
}: LoginRequiredDialogProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const callbackURL = React.useMemo(() => {
    if (returnTo) {
      return sanitizeReturnTo(returnTo);
    }
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (pendingAction) {
      params.set("pendingAction", pendingAction);
    }
    const query = params.toString();
    return sanitizeReturnTo(query ? `${pathname}?${query}` : pathname);
  }, [pathname, searchParams, pendingAction, returnTo]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
    } catch {
      setError("تعذر بدء تسجيل الدخول بحساب جوجل. حاولي مرة أخرى.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <Button
            type="button"
            variant="primary"
            className="w-full gap-2"
            loading={loading}
            onClick={handleGoogleSignIn}
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>تسجيل الدخول بحساب جوجل</span>
          </Button>

          {error && (
            <p
              role="alert"
              className="rounded-[4px] border border-danger/30 bg-danger-muted p-2.5 text-center text-xs text-danger"
            >
              {error}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
