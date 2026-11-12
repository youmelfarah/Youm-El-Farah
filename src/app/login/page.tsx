"use client";

import { Suspense, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">يوم الفرح 💍</h1>
          <p className="mt-2 text-gray-600">تسجيل الدخول</p>
        </div>

        <Suspense fallback={null}>
          <GoogleSignIn />
        </Suspense>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">أو</span>
          </div>
        </div>

        <ProviderSignIn />
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
      // Must be a relative path, not an absolute URL
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
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-center font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
      >
        {loading ? "جارٍ التحميل..." : "تسجيل الدخول بجوجل"}
      </button>
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
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

      // Redirect will be handled based on role in callback
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("بيانات الدخول غير صحيحة");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-center text-lg font-semibold text-gray-700">
        دخول مقدمي الخدمة
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            البريد الإلكتروني
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            dir="ltr"
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            كلمة المرور
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            dir="ltr"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "جارٍ الدخول..." : "دخول"}
        </button>
      </form>
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
