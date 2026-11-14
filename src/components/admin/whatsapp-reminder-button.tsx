"use client";

import { useState } from "react";
import { WhatsappLogo, Copy, Check } from "@phosphor-icons/react";
import {
  buildWhatsAppUrl,
  formatWhatsAppReminder,
} from "@/lib/whatsapp-templates";
import { Button } from "@/components/ui/button";

export interface WhatsAppReminderButtonProps {
  phoneOrWhatsapp: string | null;
  providerName: string;
  lastCoveredDateFormatted: string;
  state: "EXPIRING" | "EXPIRED";
  variant?: "sm" | "md";
}

export function WhatsAppReminderButton({
  phoneOrWhatsapp,
  providerName,
  lastCoveredDateFormatted,
  state,
  variant = "sm",
}: WhatsAppReminderButtonProps) {
  const [copied, setCopied] = useState(false);

  if (state !== "EXPIRING" && state !== "EXPIRED") {
    return null;
  }

  const message = formatWhatsAppReminder(
    state,
    providerName,
    lastCoveredDateFormatted
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }

  const hasPhone = Boolean(phoneOrWhatsapp && phoneOrWhatsapp.trim().length > 0);
  const waUrl = hasPhone
    ? buildWhatsAppUrl(phoneOrWhatsapp!, message)
    : "#";

  return (
    <div className="inline-flex items-center gap-1.5">
      {hasPhone ? (
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center justify-center gap-1.5 rounded-[4px] border border-success/40 bg-success-muted font-medium text-success transition hover:bg-success hover:text-text-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            variant === "sm" ? "h-8 px-2.5 text-xs" : "h-10 px-3.5 text-sm"
          }`}
          title="إرسال تذكير عبر واتساب"
        >
          <WhatsappLogo className="h-4 w-4" weight="regular" />
          <span>تذكير واتساب</span>
        </a>
      ) : (
        <span
          className={`inline-flex items-center justify-center gap-1.5 rounded-[4px] border border-border bg-surface-muted font-medium text-text-muted opacity-50 ${
            variant === "sm" ? "h-8 px-2.5 text-xs" : "h-10 px-3.5 text-sm"
          }`}
          title="لا يوجد رقم هاتف أو واتساب مسجل"
        >
          <WhatsappLogo className="h-4 w-4" weight="regular" />
          <span>لا يوجد رقم</span>
        </span>
      )}

      <Button
        type="button"
        variant="secondary"
        size={variant === "sm" ? "sm" : "md"}
        onClick={handleCopy}
        className={variant === "sm" ? "h-8 px-2.5 text-xs" : "h-10 px-3 text-xs"}
        title="نسخ نص الرسالة للحافظة"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-success" weight="bold" />
            <span>تم النسخ</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5 text-text-muted" weight="light" />
            <span>نسخ الرسالة</span>
          </>
        )}
      </Button>
    </div>
  );
}
