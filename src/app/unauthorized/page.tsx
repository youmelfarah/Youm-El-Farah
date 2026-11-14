import Link from "next/link";
import { ShieldWarning } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-surface text-text">
      <div className="w-full max-w-md text-center space-y-6">
        <Logo variant="stacked" size="md" className="mx-auto" />

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[4px] border border-danger/30 bg-danger-muted text-danger">
          <ShieldWarning className="h-8 w-8" weight="light" />
        </div>

        <div className="space-y-2">
          <span className="font-latin text-3xl font-semibold text-danger">403</span>
          <h1 className="font-display text-2xl font-bold text-text">
            غير مصرح بالدخول
          </h1>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            ليس لديك الصلاحيات الكافية للوصول إلى هذه الصفحة. يرجى التأكد من تسجيل الدخول بالحساب المناسب.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button asChild variant="primary">
            <Link href="/">العودة إلى الصفحة الرئيسية</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/login">تسجيل الدخول بحساب آخر</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
