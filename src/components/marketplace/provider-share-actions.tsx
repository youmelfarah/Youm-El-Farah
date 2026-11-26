"use client";

import * as React from "react";
import { Copy, ShareNetwork, WhatsappLogo } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ProviderShareActions({
  providerName,
  profileUrl,
}: {
  providerName: string;
  profileUrl: string;
}) {
  const [canNativeShare, setCanNativeShare] = React.useState(false);

  React.useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success("تم نسخ رابط الصفحة");
    } catch {
      toast.error("تعذر نسخ الرابط تلقائياً");
    }
  };

  const handleNativeShare = async () => {
    if (!canNativeShare) return;
    try {
      await navigator.share({
        title: `${providerName} | يوم الفرح`,
        text: `شاهدي خدمات ${providerName} على منصة يوم الفرح`,
        url: profileUrl,
      });
    } catch {
      // User cancelled share sheet
    }
  };

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `${providerName} على يوم الفرح:\n${profileUrl}`
  )}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="text-xs gap-1.5 min-h-[40px]"
      >
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
          <WhatsappLogo className="h-4 w-4 text-success" weight="fill" />
          <span>مشاركة واتساب</span>
        </a>
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => void handleCopy()}
        className="text-xs gap-1.5 min-h-[40px]"
      >
        <Copy className="h-4 w-4 text-text-muted" weight="light" />
        <span>نسخ الرابط</span>
      </Button>

      {canNativeShare && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void handleNativeShare()}
          className="text-xs gap-1.5 min-h-[40px]"
        >
          <ShareNetwork className="h-4 w-4 text-accent-text" weight="light" />
          <span>مشاركة</span>
        </Button>
      )}
    </div>
  );
}
