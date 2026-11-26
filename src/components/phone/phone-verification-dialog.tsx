"use client";

import * as React from "react";
import { CheckCircle, DeviceMobile } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface PhoneVerificationStepProps {
  initialPhone?: string;
  onVerified: (normalizedPhone: string) => void;
  onCancel?: () => void;
}

export function PhoneVerificationStep({
  initialPhone = "",
  onVerified,
  onCancel,
}: PhoneVerificationStepProps) {
  const [phone, setPhone] = React.useState(initialPhone);
  const [normalizedPhone, setNormalizedPhone] = React.useState("");
  const [code, setCode] = React.useState("");
  const [step, setStep] = React.useState<"enter-phone" | "enter-code" | "done">(
    "enter-phone"
  );
  const [cooldown, setCooldown] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/phone/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        phone?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.phone) {
        setError(data.error || "تعذر إرسال رمز التحقق");
        return;
      }
      setNormalizedPhone(data.phone);
      setStep("enter-code");
      setCooldown(60);
    } catch {
      setError("حدث خطأ في الاتصال. حاولي مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/phone/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalizedPhone || phone, code }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        phone?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.phone) {
        setError(data.error || "رمز التحقق غير صحيح");
        return;
      }
      setStep("done");
      onVerified(data.phone);
    } catch {
      setError("حدث خطأ في الاتصال. حاولي مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[4px] border border-success/30 bg-success-muted p-4 text-center">
        <CheckCircle className="h-8 w-8 text-success" weight="fill" />
        <p className="text-sm font-semibold text-text">تم تأكيد رقم هاتفك بنجاح</p>
        <p className="font-latin text-xs text-text-muted" dir="ltr">
          {normalizedPhone}
        </p>
      </div>
    );
  }

  if (step === "enter-code") {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <div className="rounded-[4px] border border-border bg-surface-muted p-3 text-xs text-text-muted">
          تم إرسال رمز تحقق مكوّن من 6 أرقام إلى{" "}
          <span className="font-latin font-semibold text-text" dir="ltr">
            {normalizedPhone}
          </span>
        </div>

        <Field label="رمز التحقق (6 أرقام)" htmlFor="otp-code" required>
          <Input
            id="otp-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            dir="ltr"
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
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

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={cooldown > 0 || loading}
            onClick={() => void handleSendOtp()}
          >
            {cooldown > 0
              ? `إعادة الإرسال بعد ${cooldown} ثانية`
              : "إعادة إرسال الرمز"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setStep("enter-phone");
              setCode("");
              setError("");
            }}
          >
            تغيير الرقم
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel}>
              إلغاء
            </Button>
          )}
          <Button type="submit" variant="primary" loading={loading}>
            تأكيد الرمز
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendOtp} className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-[4px] border border-border bg-surface-muted p-3 text-xs text-text-muted">
        <DeviceMobile className="h-4 w-4 shrink-0 text-accent-text mt-0.5" weight="light" />
        <p>
          لتأكيد مصداقية التقييمات، يرجى تأكيد رقم موبايلك المصري لمرة واحدة قبل إرسال أول تقييم.
        </p>
      </div>

      <Field
        label="رقم الموبايل المصري"
        htmlFor="verify-phone-input"
        helpText="مثال: 01012345678"
        required
      >
        <Input
          id="verify-phone-input"
          type="tel"
          inputMode="tel"
          dir="ltr"
          placeholder="01012345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            إلغاء
          </Button>
        )}
        <Button type="submit" variant="primary" loading={loading}>
          إرسال رمز التحقق
        </Button>
      </div>
    </form>
  );
}

export function PhoneVerificationDialog({
  open,
  onOpenChange,
  initialPhone,
  onVerified,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPhone?: string;
  onVerified: (phone: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تأكيد رقم الهاتف</DialogTitle>
          <DialogDescription>
            أدخلي رقم الموبايل المصري لاستلام رمز التحقق عبر رسالة نصية.
          </DialogDescription>
        </DialogHeader>
        <PhoneVerificationStep
          initialPhone={initialPhone}
          onVerified={(p) => {
            onVerified(p);
            onOpenChange(false);
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
