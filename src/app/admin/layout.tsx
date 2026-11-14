import { redirect } from "next/navigation";
import { AuthError, requireRole } from "@/lib/auth-helpers";
import { AdminNav } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session;
  try {
    session = await requireRole("ADMIN");
  } catch (err) {
    if (err instanceof AuthError && err.code === "FORBIDDEN") {
      redirect("/unauthorized");
    }
    redirect("/login");
  }

  const user = session.user as typeof session.user & {
    role?: string;
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted text-text md:flex-row" dir="rtl">
      <AdminNav user={{ name: user.name, email: user.email }} />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
