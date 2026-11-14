"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Divider } from "@/components/ui/divider";
import { Placeholder } from "@/components/ui/placeholder";
import { brand } from "@/lib/brand";

export default function LoginPage() {
  return (
    <main className="min-h-screen w-full bg-surface text-text">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-12">
        {/* Editorial Split Panel (Desktop Only, Dark Luxury Theme) */}
        <div
          data-theme="dark"
          className="relative hidden lg:col-span-5 lg:flex flex-col justify-between border-e border-border bg-surface p-12 text-text"
        >
          <div className="flex flex-col gap-2">
            <Logo variant="stacked" size="md" />
            <span className="font-latin text-xs uppercase tracking-widest text-accent-text mt-1">
              BENI SUEF WEDDING DIRECTORY
            </span>
          </div>

          <div className="space-y-6 my-auto max-w-sm">
            <Placeholder
              aspectRatio="4:5"
              label="EDITORIAL ATMOSPHERE"
              className="border-border-strong min-h-[300px]"
            />
            <div className="space-y-2 border-s-2 border-accent-text ps-4">
              <p className="font-display text-lg font-semibold text-text leading-snug">
                «كل تفصيلة في ليلة زفافكِ تستحق أن تُنسج بعناية فائقة»
              </p>
              <p className="text-xs text-text-muted leading-relaxed">
                {brand.tagline}
              </p>
            </div>
          </div>

          <div className="border-t border-border pt-4 text-[11px] text-text-muted">
            جميع الحقوق محفوظة © 2026 {brand.name.ar}
          </div>
        </div>

        {/* Form Panel (Mobile: Single Column, Desktop: Elegantly Centered) */}
        <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:col-span-7 lg:px-20">
          <div className="mx-auto w-full max-w-md space-y-8">
            <div className="flex flex-col gap-2 text-start">
              <div className="lg:hidden mb-2">
                <Logo variant="stacked" size="sm" />
              </div>
              <span className="font-latin text-xs uppercase tracking-wider text-accent-text">
                AUTHENTICATION
              </span>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-text">
                تسجيل الدخول إلى حسابكِ
              </h1>
              <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
                مرحباً بكِ مجدداً في منصة يوم الفرح. سجلي الدخول لمتابعة حسابكِ أو إدارة خدماتكِ.
              </p>
            </div>

            <Suspense fallback={null}>
              <GoogleSignIn />
            </Suspense>

            <Divider label="أو عن طريق البريد الإلكتروني" />

            <ProviderSignIn />
          </div>
        </div>
      </div>
    </main>
  );
}

function GoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  // Validate returnTo is a safe relative path
  const safeReturnTo = (() => {
    if (!returnTo) return "/";
    try {
      if (returnTo.startsWith("/") && !returnTo.startsWith("//")) {
        return returnTo;
      }
    } catch {
      // ignore
    }
    return "/";
  })();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: safeReturnTo,
      });
    } catch {
      setError("بيانات الدخول غير صحيحة");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleGoogleSignIn}
        loading={loading}
        variant="secondary"
        className="w-full"
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
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
        <p className="rounded-[4px] border border-danger/30 bg-danger-muted p-2 text-center text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function ProviderSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        const code = (result.error as { code?: string }).code;
        if (code === "ACCOUNT_DEACTIVATED" || code === "BANNED_USER") {
          setError("تم تعطيل هذا الحساب. يرجى التواصل مع الإدارة.");
        } else {
          setError("بيانات الدخول غير صحيحة");
        }
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("بيانات الدخول غير صحيحة");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-start">
        <h2 className="font-display text-sm font-semibold text-text">
          دخول مقدمي الخدمة والإدارة
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          أدخلي بيانات الاعتماد الخاصة بحسابكِ المسجل
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="البريد الإلكتروني" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
            placeholder="provider@example.com"
          />
        </Field>

        <Field label="كلمة المرور" htmlFor="password" required>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            dir="ltr"
            placeholder="••••••••"
          />
        </Field>

        <Button
          type="submit"
          loading={loading}
          variant="primary"
          className="w-full"
        >
          تسجيل الدخول
        </Button>
      </form>
      {error && (
        <p className="rounded-[4px] border border-danger/30 bg-danger-muted p-2 text-center text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
