import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helpers";
import { ProviderAccountsClient } from "./client";

export default async function ProviderAccountsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = session.user as typeof session.user & { role?: string };
  if (user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">إدارة حسابات مقدمي الخدمة</h1>
          <a
            href="/admin"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            ← العودة للوحة الإدارة
          </a>
        </div>
        <ProviderAccountsClient />
      </div>
    </main>
  );
}

