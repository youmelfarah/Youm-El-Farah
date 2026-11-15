"use client";

import * as React from "react";
import { WhatsappLogo, PhoneCall } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { trackContactClick, useTrackProfileView } from "@/lib/track-client";

export interface ProviderContactActionsProps {
  providerId: string;
  whatsappUrl: string | null;
  phoneDigits: string | null;
}

export function ProviderContactActions({
  providerId,
  whatsappUrl,
  phoneDigits,
}: ProviderContactActionsProps) {
  // Track profile view after 2-second delay
  useTrackProfileView(providerId);

  const handleWhatsApp = () => {
    trackContactClick(providerId, "whatsapp");
  };

  const handleCall = () => {
    trackContactClick(providerId, "call");
  };

  const hasContact = Boolean(whatsappUrl || phoneDigits);
  if (!hasContact) return null;

  return (
    <>
      {/* Desktop/In-Page Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {whatsappUrl && (
          <Button
            asChild
            variant="primary"
            size="lg"
            onClick={handleWhatsApp}
            className="min-h-[44px] gap-2"
          >
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <WhatsappLogo className="h-5 w-5" weight="fill" />
              <span>تواصلي على واتساب</span>
            </a>
          </Button>
        )}

        {phoneDigits && (
          <Button
            asChild
            variant="secondary"
            size="lg"
            onClick={handleCall}
            className="min-h-[44px] gap-2"
          >
            <a href={`tel:${phoneDigits}`}>
              <PhoneCall className="h-5 w-5" weight="regular" />
              <span>اتصال هاتفي</span>
            </a>
          </Button>
        )}
      </div>

      {/* Mobile Sticky Bottom Bar (hidden on md+) */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface-raised/95 p-3 backdrop-blur-xs md:hidden shadow-lg">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          {whatsappUrl && (
            <Button
              asChild
              variant="primary"
              onClick={handleWhatsApp}
              className="flex-1 min-h-[44px] gap-2 text-xs"
            >
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <WhatsappLogo className="h-4 w-4" weight="fill" />
                <span>واتساب</span>
              </a>
            </Button>
          )}

          {phoneDigits && (
            <Button
              asChild
              variant="secondary"
              onClick={handleCall}
              className="flex-1 min-h-[44px] gap-2 text-xs"
            >
              <a href={`tel:${phoneDigits}`}>
                <PhoneCall className="h-4 w-4" weight="regular" />
                <span>اتصال</span>
              </a>
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
