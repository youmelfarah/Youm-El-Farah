"use client";

import * as React from "react";
import { Copy, Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export interface CopyReportButtonProps {
  name: string;
  views: number;
  whatsapp: number;
  call: number;
}

export function CopyReportButton({
  name,
  views,
  whatsapp,
  call,
}: CopyReportButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    const message = `أهلاً ${name}، ملخص آخر 30 يوم على يوم الفرح: ${views} زيارة لملفك، ${whatsapp} ضغطة تواصل واتساب، ${call} ضغطة اتصال.`;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("تم نسخ التقرير الشهري بنجاح!");
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy report:", err);
      toast.error("فشل نسخ التقرير، يرجى المحاولة يدوياً.");
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="min-h-[44px] gap-2 text-xs"
    >
      {copied ? (
        <Check className="h-4 w-4 text-success" weight="bold" />
      ) : (
        <Copy className="h-4 w-4" weight="light" />
      )}
      <span>{copied ? "تم النسخ" : "نسخ تقرير شهري"}</span>
    </Button>
  );
}
