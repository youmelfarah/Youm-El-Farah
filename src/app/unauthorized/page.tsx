import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-red-500">403</h1>
        <h2 className="text-2xl font-semibold text-gray-800">
          غير مصرح بالدخول
        </h2>
        <p className="text-gray-600">
          ليس لديك صلاحية للوصول إلى هذه الصفحة.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700"
        >
          العودة للرئيسية
        </Link>
      </div>
    </main>
  );
}

