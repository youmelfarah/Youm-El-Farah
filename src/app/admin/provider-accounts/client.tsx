"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Check, Key, Plus } from "@phosphor-icons/react";
import {
  createProviderAction,
  resetProviderPasswordAction,
  toggleProviderActiveAction,
  listProvidersAction,
} from "./actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  MobileCardList,
  MobileCardItem,
  MobileCardRow,
} from "@/components/ui/table";

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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text sm:text-3xl">
            حسابات مقدمي الخدمة
          </h1>
          <p className="mt-1 text-xs text-text-muted">
            إدارة الحسابات، إنشاء بيانات دخول جديدة، وإعادة تعيين كلمات المرور.
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant={showCreateForm ? "secondary" : "primary"}
        >
          {showCreateForm ? "إلغاء" : "إنشاء حساب مقدم خدمة"}
        </Button>
      </div>

      {showCreateForm && (
        <CreateProviderForm
          onCreated={() => {
            setShowCreateForm(false);
            loadProviders();
          }}
        />
      )}

      {loading ? (
        <Card className="p-8 text-center text-xs text-text-muted">
          جارٍ التحميل...
        </Card>
      ) : providers.length === 0 ? (
        <Card className="p-8 text-center text-xs text-text-muted">
          لا يوجد مقدمو خدمة بعد.
        </Card>
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
      <Card className="border-warning/40 bg-warning-muted/30 p-6 space-y-4">
        <div>
          <h3 className="font-display text-base font-semibold text-text">
            تم إنشاء حساب مقدم الخدمة بنجاح
          </h3>
          <p className="mt-1 text-xs text-text-muted">
            يرجى حفظ كلمة المرور المؤقتة ومشاركتها مع مقدم الخدمة، فلن تظهر مرة أخرى.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <code
            className="flex-1 rounded-[4px] border border-border bg-surface-raised px-3.5 py-2 font-mono text-sm text-text"
            dir="ltr"
          >
            {tempPassword}
          </code>
          <Button
            type="button"
            variant="secondary"
            onClick={copyPassword}
            className="shrink-0"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-success" weight="bold" />
                <span>تم النسخ!</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 text-text-muted" weight="light" />
                <span>نسخ</span>
              </>
            )}
          </Button>
        </div>

        <Button onClick={onCreated} variant="primary" className="w-full">
          تم الحفظ ومتابعة
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <CardHeader className="p-0 pb-4 mb-4 border-b border-border">
        <CardTitle>بيانات حساب مقدم الخدمة الجديد</CardTitle>
        <CardDescription>
          سيُطلب من مقدم الخدمة تغيير كلمة المرور عند أول تسجيل دخول.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="الاسم" required>
          <Input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field label="البريد الإلكتروني" required>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
          />
        </Field>

        <Field label="كلمة المرور المؤقتة" required>
          <div className="flex gap-2">
            <Input
              type="text"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={generatePassword}
              className="shrink-0 text-xs"
            >
              <Key className="h-4 w-4" weight="light" />
              <span>توليد تلقائي</span>
            </Button>
          </div>
        </Field>

        <Button
          type="submit"
          loading={loading}
          variant="primary"
          className="w-full"
        >
          إنشاء الحساب
        </Button>
        {error && (
          <p className="rounded-[4px] border border-danger/30 bg-danger-muted p-2 text-xs text-danger">
            {error}
          </p>
        )}
      </form>
    </Card>
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
        <Card className="border-warning/40 bg-warning-muted/30 p-4 space-y-2">
          <p className="font-semibold text-text text-xs">
            تمت إعادة تعيين كلمة المرور (لن تظهر مرة أخرى):
          </p>
          <div className="flex items-center gap-2">
            <code
              className="flex-1 rounded-[4px] border border-border bg-surface-raised px-3 py-1.5 font-mono text-sm text-text"
              dir="ltr"
            >
              {resetResult.password}
            </code>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => copyPassword(resetResult.password)}
            >
              {copied ? "تم النسخ!" : "نسخ"}
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setResetResult(null)}
            className="text-xs text-text-muted underline cursor-pointer"
          >
            إغلاق
          </button>
        </Card>
      )}

      {/* Mobile Card List */}
      <MobileCardList>
        {providers.map((provider) => (
          <MobileCardItem key={provider.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-text">{provider.name}</p>
                <p className="text-xs text-text-muted font-latin" dir="ltr">
                  {provider.email}
                </p>
              </div>
              <Badge variant={provider.isActive ? "success" : "danger"} size="sm">
                {provider.isActive ? "نشط" : "معطل"}
              </Badge>
            </div>

            <div className="border-y border-border py-2 text-xs space-y-1">
              <MobileCardRow label="تغيير كلمة المرور إلزامي">
                {provider.mustChangePassword ? (
                  <Badge variant="warning" size="sm">نعم</Badge>
                ) : (
                  <span className="text-text-muted">لا</span>
                )}
              </MobileCardRow>
              <MobileCardRow label="تاريخ الإنشاء">
                <span className="font-latin">
                  {new Date(provider.createdAt).toLocaleDateString("en-US")}
                </span>
              </MobileCardRow>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleResetPassword(provider.id)}
                disabled={actionLoading === provider.id}
                className="flex-1"
              >
                إعادة تعيين كلمة المرور
              </Button>
              <Button
                size="sm"
                variant={provider.isActive ? "danger" : "accent"}
                onClick={() => handleToggleActive(provider.id)}
                disabled={actionLoading === provider.id}
              >
                {provider.isActive ? "تعطيل" : "تفعيل"}
              </Button>
            </div>
          </MobileCardItem>
        ))}
      </MobileCardList>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>البريد الإلكتروني</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>يجب تغيير كلمة المرور</TableHead>
              <TableHead>تاريخ الإنشاء</TableHead>
              <TableHead className="text-end">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {providers.map((provider) => (
              <TableRow key={provider.id}>
                <TableCell className="font-medium">{provider.name}</TableCell>
                <TableCell dir="ltr" className="font-latin text-xs">
                  {provider.email}
                </TableCell>
                <TableCell>
                  <Badge variant={provider.isActive ? "success" : "danger"} size="sm">
                    {provider.isActive ? "نشط" : "معطل"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {provider.mustChangePassword ? (
                    <Badge variant="warning" size="sm">نعم</Badge>
                  ) : (
                    <span className="text-text-muted text-xs">لا</span>
                  )}
                </TableCell>
                <TableCell className="font-latin text-xs text-text-muted">
                  {new Date(provider.createdAt).toLocaleDateString("en-US")}
                </TableCell>
                <TableCell className="text-end">
                  <div className="inline-flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleResetPassword(provider.id)}
                      disabled={actionLoading === provider.id}
                    >
                      إعادة تعيين كلمة المرور
                    </Button>
                    <Button
                      size="sm"
                      variant={provider.isActive ? "secondary" : "accent"}
                      onClick={() => handleToggleActive(provider.id)}
                      disabled={actionLoading === provider.id}
                    >
                      {provider.isActive ? "تعطيل" : "تفعيل"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
