import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-helpers";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = session.user as typeof session.user & {
    role?: string;
  };

  if (user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg space-y-6 text-center">
        <h1 className="text-3xl font-bold">لوحة الإدارة</h1>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-medium text-gray-800">{user.name}</p>
          <p className="text-sm text-gray-500" dir="ltr">
            {user.email}
          </p>
          <p className="mt-1 text-xs text-blue-600">مدير</p>
        </div>

        <div className="space-y-3">
          <Link
            href="/admin/provider-accounts"
            className="block w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            إدارة حسابات مقدمي الخدمة
          </Link>
        </div>

        <LogoutButton />
      </div>
    </main>
  );
}

