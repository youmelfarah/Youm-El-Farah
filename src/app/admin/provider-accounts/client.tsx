"use client";

import { useState, useEffect, useCallback } from "react";
import {
  createProviderAction,
  resetProviderPasswordAction,
  toggleProviderActiveAction,
  listProvidersAction,
} from "./actions";

type Provider = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
};

export function ProviderAccountsClient() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadProviders = useCallback(async () => {
    setLoading(true);
    const result = await listProvidersAction();
    setProviders(result.providers);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  return (
    <div className="space-y-6">
      <button
        onClick={() => setShowCreateForm(!showCreateForm)}
        className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700"
      >
        {showCreateForm ? "إلغاء" : "إنشاء حساب مقدم خدمة"}
      </button>

      {showCreateForm && (
        <CreateProviderForm
          onCreated={() => {
            setShowCreateForm(false);
            loadProviders();
          }}
        />
      )}

      {loading ? (
        <p className="text-gray-500">جارٍ التحميل...</p>
      ) : providers.length === 0 ? (
        <p className="text-gray-500">لا يوجد مقدمو خدمة بعد.</p>
      ) : (
        <ProvidersTable providers={providers} onUpdate={loadProviders} />
      )}
    </div>
  );
}

function CreateProviderForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pass = "";
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    for (let i = 0; i < 16; i++) {
      pass += chars[array[i] % chars.length];
    }
    setPassword(pass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await createProviderAction({ name, email, password });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.temporaryPassword) {
      setTempPassword(result.temporaryPassword);
    }
    setLoading(false);
  };

  const copyPassword = async () => {
    await navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (tempPassword) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 space-y-4">
        <h3 className="font-semibold text-green-800">
          تم إنشاء الحساب بنجاح!
        </h3>
        <p className="text-sm text-green-700">
          كلمة المرور المؤقتة (لن تظهر مرة أخرى):
        </p>
        <div className="flex items-center gap-2">
          <code
            className="flex-1 rounded bg-white px-3 py-2 font-mono text-sm"
            dir="ltr"
          >
            {tempPassword}
          </code>
          <button
            onClick={copyPassword}
            className="rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700"
          >
            {copied ? "تم النسخ!" : "نسخ"}
          </button>
        </div>
        <button
          onClick={onCreated}
          className="rounded bg-gray-600 px-4 py-2 text-sm text-white hover:bg-gray-700"
        >
          إغلاق
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 bg-white p-6 space-y-4"
    >
      <h3 className="font-semibold text-gray-800">إنشاء حساب مقدم خدمة</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700">الاسم</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          البريد الإلكتروني
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          dir="ltr"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          كلمة المرور المؤقتة
        </label>
        <div className="mt-1 flex gap-2">
          <input
            type="text"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block flex-1 rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            dir="ltr"
          />
          <button
            type="button"
            onClick={generatePassword}
            className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
          >
            توليد كلمة مرور قوية
          </button>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}

function ProvidersTable({
  providers,
  onUpdate,
}: {
  providers: Provider[];
  onUpdate: () => void;
}) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<{
    userId: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleResetPassword = async (userId: string) => {
    if (!confirm("هل أنت متأكد من إعادة تعيين كلمة المرور؟")) return;

    setActionLoading(userId);
    const result = await resetProviderPasswordAction({ userId });
    setActionLoading(null);

    if (result.error) {
      alert(result.error);
      return;
    }

    if (result.temporaryPassword) {
      setResetResult({ userId, password: result.temporaryPassword });
    }
    onUpdate();
  };

  const handleToggleActive = async (userId: string) => {
    const provider = providers.find((p) => p.id === userId);
    const action = provider?.isActive ? "تعطيل" : "تفعيل";
    if (!confirm(`هل أنت متأكد من ${action} هذا الحساب؟`)) return;

    setActionLoading(userId);
    const result = await toggleProviderActiveAction({ userId });
    setActionLoading(null);

    if (result.error) {
      alert(result.error);
      return;
    }

    onUpdate();
  };

  const copyPassword = async (password: string) => {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {resetResult && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 space-y-2">
          <p className="font-medium text-yellow-800">
            تم إعادة تعيين كلمة المرور (لن تظهر مرة أخرى):
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-white px-3 py-2 font-mono text-sm" dir="ltr">
              {resetResult.password}
            </code>
            <button
              onClick={() => copyPassword(resetResult.password)}
              className="rounded bg-yellow-600 px-3 py-2 text-sm text-white hover:bg-yellow-700"
            >
              {copied ? "تم النسخ!" : "نسخ"}
            </button>
          </div>
          <button
            onClick={() => setResetResult(null)}
            className="text-sm text-yellow-700 underline"
          >
            إغلاق
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                الاسم
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                البريد الإلكتروني
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                الحالة
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                يجب تغيير كلمة المرور
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                تاريخ الإنشاء
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                الإجراءات
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {providers.map((provider) => (
              <tr key={provider.id}>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  {provider.name}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm" dir="ltr">
                  {provider.email}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      provider.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {provider.isActive ? "نشط" : "معطل"}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm">
                  {provider.mustChangePassword ? (
                    <span className="text-yellow-600">نعم</span>
                  ) : (
                    <span className="text-gray-400">لا</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm" dir="ltr">
                  {new Date(provider.createdAt).toLocaleDateString("ar-EG")}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm space-x-2 space-x-reverse">
                  <button
                    onClick={() => handleResetPassword(provider.id)}
                    disabled={actionLoading === provider.id}
                    className="rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-700 hover:bg-yellow-200 disabled:opacity-50"
                  >
                    إعادة تعيين كلمة المرور
                  </button>
                  <button
                    onClick={() => handleToggleActive(provider.id)}
                    disabled={actionLoading === provider.id}
                    className={`rounded px-2 py-1 text-xs font-medium disabled:opacity-50 ${
                      provider.isActive
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {provider.isActive ? "تعطيل" : "تفعيل"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

