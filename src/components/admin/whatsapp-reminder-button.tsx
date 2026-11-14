"use client";

import { useState } from "react";
import {
  buildWhatsAppUrl,
  formatWhatsAppReminder,
} from "@/lib/whatsapp-templates";

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
          className={`inline-flex items-center justify-center gap-1 rounded-lg border border-success bg-success-muted font-medium text-success transition hover:bg-success hover:text-white ${
            variant === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
          }`}
          title="إرسال تذكير عبر واتساب"
        >
          <span>💬</span>
          <span>تذكير واتساب</span>
        </a>
      ) : (
        <span
          className={`inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-surface-muted font-medium text-text-muted opacity-50 ${
            variant === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"
          }`}
          title="لا يوجد رقم هاتف أو واتساب مسجل"
        >
          <span>💬</span>
          <span>لا يوجد رقم</span>
        </span>
      )}

      <button
        type="button"
        onClick={handleCopy}
        className={`inline-flex items-center justify-center rounded-lg border border-border bg-surface font-medium text-text-muted transition hover:bg-surface-muted hover:text-text cursor-pointer ${
          variant === "sm" ? "px-2 py-1 text-xs" : "px-2.5 py-1.5 text-xs"
        }`}
        title="نسخ نص الرسالة للحافظة"
      >
        {copied ? "تم النسخ ✓" : "نسخ الرسالة"}
      </button>
    </div>
  );
}
