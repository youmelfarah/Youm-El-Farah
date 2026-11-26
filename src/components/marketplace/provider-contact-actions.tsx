"use client";

import * as React from "react";
import { WhatsappLogo, PhoneCall, PaperPlaneTilt } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trackContactClick, useTrackProfileView } from "@/lib/track-client";
import { LoginRequiredDialog } from "@/components/auth/login-required-dialog";
import {
  LeadRequestModal,
  type LeadDialogViewer,
  type LeadOfferOption,
} from "@/components/marketplace/lead-request-dialog";

export interface ProviderContactActionsProps {
  providerId: string;
  providerName: string;
  providerSlug: string;
  providerUserId: string;
  whatsappUrl: string | null;
  phoneDigits: string | null;
  offers: LeadOfferOption[];
  defaultWeddingDate: string | null;
  minWeddingDate: string;
  viewer: LeadDialogViewer;
}

export function ProviderContactActions({
  providerId,
  providerName,
  providerSlug,
  providerUserId,
  whatsappUrl,
  phoneDigits,
  offers,
  defaultWeddingDate,
  minWeddingDate,
  viewer,
}: ProviderContactActionsProps) {
  // Track profile view after 2-second delay
  useTrackProfileView(providerId);

  const [leadModalOpen, setLeadModalOpen] = React.useState(false);
  const [loginOpen, setLoginOpen] = React.useState(false);

  const handleWhatsApp = () => {
    trackContactClick(providerId, "whatsapp");
  };

  const handleCall = () => {
    trackContactClick(providerId, "call");
  };

  const handleOpenLead = () => {
    if (!viewer.isSignedIn) {
      setLoginOpen(true);
      return;
    }
    if (viewer.userRole !== "VISITOR" || viewer.userId === providerUserId) {
      toast.error("طلبات عروض الأسعار متاحة لحسابات الزائرات فقط");
      return;
    }
    setLeadModalOpen(true);
  };

  return (
    <>
      {/* Desktop/In-Page Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={handleOpenLead}
          className="min-h-[44px] gap-2"
        >
          <PaperPlaneTilt className="h-5 w-5" weight="light" />
          <span>اطلبي عرض سعر</span>
        </Button>

        {whatsappUrl && (
          <Button
            asChild
            variant="secondary"
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
          <Button
            type="button"
            variant="primary"
            onClick={handleOpenLead}
            className="flex-1 min-h-[44px] gap-1.5 text-xs"
          >
            <PaperPlaneTilt className="h-4 w-4" weight="light" />
            <span>اطلبي عرض سعر</span>
          </Button>

          {whatsappUrl && (
            <Button
              asChild
              variant="secondary"
              onClick={handleWhatsApp}
              className="flex-1 min-h-[44px] gap-1.5 text-xs"
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
              className="min-h-[44px] gap-1.5 text-xs px-3"
              aria-label="اتصال هاتفي"
            >
              <a href={`tel:${phoneDigits}`}>
                <PhoneCall className="h-4 w-4" weight="regular" />
                <span>اتصال</span>
              </a>
            </Button>
          )}
        </div>
      </div>

      <LeadRequestModal
        open={leadModalOpen}
        onOpenChange={setLeadModalOpen}
        providerId={providerId}
        providerName={providerName}
        providerSlug={providerSlug}
        providerUserId={providerUserId}
        offers={offers}
        defaultWeddingDate={defaultWeddingDate}
        minWeddingDate={minWeddingDate}
        viewer={viewer}
      />

      <LoginRequiredDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        pendingAction="lead"
      />
    </>
  );
}
