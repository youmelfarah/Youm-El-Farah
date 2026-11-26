"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash, Warning } from "@phosphor-icons/react";
import { toast } from "sonner";
import { signOut } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteMyAccountAction } from "./actions";

export function DeleteAccountSection({ role }: { role: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const isProtectedRole = role === "ADMIN" || role === "PROVIDER";
  const canConfirm = confirmation.trim() === "حذف حسابي";

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canConfirm) return;
    setLoading(true);
    setError("");
    try {
      const res = await deleteMyAccountAction(confirmation);
      if (!res.ok) {
        setError(res.error || "تعذر حذف الحساب");
        return;
      }
      await signOut().catch(() => undefined);
      toast.success("تم حذف حسابك وبياناتك نهائياً");
      router.push("/");
      router.refresh();
    } catch {
      setError("حدث خطأ أثناء حذف الحساب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-danger/30">
      <CardHeader>
        <CardTitle className="text-danger flex items-center gap-2">
          <Warning className="h-5 w-5" weight="light" />
          <span>حذف حسابي</span>
        </CardTitle>
        <CardDescription>
          إزالة حسابك وجميع البيانات المرتبطة به من منصة يوم الفرح بشكل نهائي.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isProtectedRole ? (
          <p className="rounded-[4px] border border-border bg-surface-muted p-4 text-xs text-text-muted leading-relaxed">
            لا يمكن حذف حسابات {role === "ADMIN" ? "الإدارة" : "مقدمي الخدمة"} ذاتياً من هذه الصفحة. يرجى التواصل مع إدارة المنصة لإغلاق الحساب.
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-text-muted max-w-xl leading-relaxed">
              سيتم حذف المفضلة، التقييمات، طلبات عروض الأسعار المرسلة، جلسات الدخول، وبيانات الحساب نهائياً.
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setConfirmation("");
                setError("");
                setOpen(true);
              }}
              className="gap-1.5 border-danger/40 text-danger hover:bg-danger-muted hover:text-danger"
            >
              <Trash className="h-4 w-4" weight="light" />
              <span>حذف حسابي</span>
            </Button>
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-danger">تأكيد حذف الحساب نهائياً</DialogTitle>
            <DialogDescription>
              هذا الإجراء نهائي ولا يمكن التراجع عنه. سيتم حذف المفضلة، التقييمات، طلبات عروض الأسعار، الجلسات، ربط الحساب، وحسابك نفسه.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDelete} className="space-y-4">
            <Field
              label='اكتبي عبارة "حذف حسابي" للتأكيد'
              htmlFor="delete-account-confirm"
              required
            >
              <Input
                id="delete-account-confirm"
                placeholder="حذف حسابي"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                required
              />
            </Field>

            {error && (
              <p
                role="alert"
                className="rounded-[4px] border border-danger/30 bg-danger-muted p-2.5 text-xs text-danger"
              >
                {error}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={!canConfirm}
                loading={loading}
                className="bg-danger text-text-inverse hover:bg-danger/90"
              >
                تأكيد الحذف النهائي
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
