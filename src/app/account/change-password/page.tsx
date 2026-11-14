"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { changePasswordAction } from "./actions";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      setLoading(false);
      return;
    }

    try {
      const result = await changePasswordAction({
        currentPassword,
        newPassword,
      });

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch {
      setError("حدث خطأ. حاول مرة أخرى.");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-surface text-text">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center gap-3">
          <Logo variant="stacked" size="md" />
          <div>
            <h1 className="font-display text-2xl font-bold text-text">تغيير كلمة المرور</h1>
            <p className="mt-1 text-xs text-text-muted">
              يجب تغيير كلمة المرور المؤقتة قبل المتابعة واستخدام لوحة التحكم
            </p>
          </div>
        </div>

        <Card className="p-6">
          <CardContent className="p-0">
            {success ? (
              <div className="rounded-[4px] border border-success/30 bg-success-muted p-4 text-center text-xs font-semibold text-success">
                تم تغيير كلمة المرور بنجاح. جارٍ التحويل إلى لوحة التحكم...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="كلمة المرور الحالية (المؤقتة)" htmlFor="currentPassword" required>
                  <Input
                    id="currentPassword"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    dir="ltr"
                  />
                </Field>

                <Field
                  label="كلمة المرور الجديدة"
                  htmlFor="newPassword"
                  required
                  helpText="8 أحرف على الأقل"
                >
                  <Input
                    id="newPassword"
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    dir="ltr"
                  />
                </Field>

                <Field label="تأكيد كلمة المرور الجديدة" htmlFor="confirmPassword" required>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    dir="ltr"
                  />
                </Field>

                <Button
                  type="submit"
                  loading={loading}
                  variant="primary"
                  className="w-full mt-2"
                >
                  تأكيد وتغيير كلمة المرور
                </Button>
              </form>
            )}

            {error && (
              <p className="mt-4 rounded-[4px] border border-danger/30 bg-danger-muted p-2.5 text-center text-xs text-danger">
                {error}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
