"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, PaperPlaneTilt } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoginRequiredDialog } from "@/components/auth/login-required-dialog";
import { LEAD_MAX_MESSAGE_LENGTH } from "@/lib/lead-validation";
import { submitLeadAction } from "@/app/(public)/providers/[slug]/lead-actions";

export interface LeadOfferOption {
  id: string;
  title: string;
}

export interface LeadDialogViewer {
  isSignedIn: boolean;
  userId: string | null;
  userRole: string | null;
  name: string;
  phone: string | null;
}

export interface LeadRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerId: string;
  providerName: string;
  providerSlug: string;
  providerUserId: string;
  offers: LeadOfferOption[];
  defaultWeddingDate: string | null;
  minWeddingDate: string;
  initialOfferId?: string | null;
  viewer: LeadDialogViewer;
}

export function LeadRequestModal({
  open,
  onOpenChange,
  providerId,
  providerName,
  providerSlug,
  providerUserId,
  offers,
  defaultWeddingDate,
  minWeddingDate,
  initialOfferId,
  viewer,
}: LeadRequestModalProps) {
  const router = useRouter();
  const [name, setName] = React.useState(viewer.name);
  const [phone, setPhone] = React.useState(viewer.phone ?? "");
  const [weddingDate, setWeddingDate] = React.useState(defaultWeddingDate ?? "");
  const [offerId, setOfferId] = React.useState(initialOfferId ?? "");
  const [message, setMessage] = React.useState("");
  const [website, setWebsite] = React.useState(""); // honeypot
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [successMsg, setSuccessMsg] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setName(viewer.name || "");
      setPhone(viewer.phone ?? "");
      setWeddingDate(defaultWeddingDate ?? "");
      setOfferId(initialOfferId ?? "");
      setMessage("");
      setWebsite("");
      setError("");
      setSuccessMsg("");
    }
  }, [open, viewer.name, viewer.phone, defaultWeddingDate, initialOfferId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await submitLeadAction({
        providerId,
        name,
        phone,
        weddingDate: weddingDate || null,
        offerId: offerId || null,
        message: message || null,
        website,
      });

      if (!res.ok) {
        setError(res.error || "تعذر إرسال الطلب");
        return;
      }

      const msg =
        res.message ||
        `وصل طلبك لـ ${providerName}. هيتواصلوا معاكِ على الرقم اللي كتبتيه.`;
      setSuccessMsg(msg);
      toast.success("تم إرسال طلبك بنجاح");
      router.refresh();
    } catch {
      setError("حدث خطأ في الاتصال. حاولي مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>اطلبي عرض سعر من {providerName}</DialogTitle>
          <DialogDescription>
            املئي بياناتك وهيتواصل معاكِ مقدم الخدمة مباشرة بالتفاصيل والسعر.
          </DialogDescription>
        </DialogHeader>

        {successMsg ? (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center gap-3 rounded-[4px] border border-success/30 bg-success-muted p-6 text-center">
              <CheckCircle className="h-9 w-9 text-success" weight="fill" />
              <p className="text-sm font-semibold text-text leading-relaxed">
                {successMsg}
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="primary"
                onClick={() => onOpenChange(false)}
              >
                تم
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Honeypot hidden field */}
            <div className="sr-only" aria-hidden="true">
              <label htmlFor={`lead-website-${providerSlug}`}>Website</label>
              <input
                id={`lead-website-${providerSlug}`}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <Field label="الاسم" htmlFor="lead-name" required>
              <Input
                id="lead-name"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="اسمك الكامل"
              />
            </Field>

            <Field
              label="رقم الموبايل"
              htmlFor="lead-phone"
              required
              helpText="رقمك بيظهر لمقدم الخدمة ده بس."
            >
              <Input
                id="lead-phone"
                type="tel"
                inputMode="tel"
                dir="ltr"
                required
                placeholder="01012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Field>

            <Field label="تاريخ الفرح المتوقع (اختياري)" htmlFor="lead-wedding-date">
              <Input
                id="lead-wedding-date"
                type="date"
                min={minWeddingDate}
                dir="ltr"
                value={weddingDate}
                onChange={(e) => setWeddingDate(e.target.value)}
              />
            </Field>

            {offers.length > 0 && (
              <Field label="الباقة المطلوبة (اختياري)" htmlFor="lead-offer">
                <select
                  id="lead-offer"
                  value={offerId}
                  onChange={(e) => setOfferId(e.target.value)}
                  className="flex h-11 w-full rounded-[4px] border border-border bg-surface-raised px-3.5 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">استفسار عام (بدون باقة محددة)</option>
                  {offers.map((offer) => (
                    <option key={offer.id} value={offer.id}>
                      {offer.title}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field
              label="رسالتك أو استفسارك (اختياري)"
              htmlFor="lead-message"
              helpText={`${message.length} / ${LEAD_MAX_MESSAGE_LENGTH} حرف`}
            >
              <Textarea
                id="lead-message"
                maxLength={LEAD_MAX_MESSAGE_LENGTH}
                placeholder="مثال: عدد المدعوين التقريبي، أو أي تفاصيل حابة تسألي عنها..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
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
                onClick={() => onOpenChange(false)}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={viewer.userId === providerUserId}
                className="gap-2"
              >
                <PaperPlaneTilt className="h-4 w-4" weight="light" />
                <span>إرسال الطلب</span>
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Trigger button used on individual offer cards ("اسألي عن هذا العرض")
 */
export function OfferInquiryButton({
  offerId,
  providerId,
  providerName,
  providerSlug,
  providerUserId,
  offers,
  defaultWeddingDate,
  minWeddingDate,
  viewer,
}: {
  offerId: string;
  providerId: string;
  providerName: string;
  providerSlug: string;
  providerUserId: string;
  offers: LeadOfferOption[];
  defaultWeddingDate: string | null;
  minWeddingDate: string;
  viewer: LeadDialogViewer;
}) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [loginOpen, setLoginOpen] = React.useState(false);

  const handleClick = () => {
    if (!viewer.isSignedIn) {
      setLoginOpen(true);
      return;
    }
    if (viewer.userRole !== "VISITOR" || viewer.userId === providerUserId) {
      toast.error("طلبات عروض الأسعار متاحة لحسابات الزائرات فقط");
      return;
    }
    setModalOpen(true);
  };

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleClick}
        className="text-xs text-accent-text hover:text-accent-contrast min-h-[44px]"
      >
        اسألي عن هذا العرض
      </Button>

      <LeadRequestModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        providerId={providerId}
        providerName={providerName}
        providerSlug={providerSlug}
        providerUserId={providerUserId}
        offers={offers}
        defaultWeddingDate={defaultWeddingDate}
        minWeddingDate={minWeddingDate}
        initialOfferId={offerId}
        viewer={viewer}
      />

      <LoginRequiredDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        pendingAction={`lead:${offerId}`}
      />
    </>
  );
}

/**
 * Handles ?pendingAction=lead or ?pendingAction=lead:<offerId> after Google login return
 */
export function PendingLeadActionHandler({
  providerId,
  providerName,
  providerSlug,
  providerUserId,
  offers,
  defaultWeddingDate,
  minWeddingDate,
  viewer,
}: {
  providerId: string;
  providerName: string;
  providerSlug: string;
  providerUserId: string;
  offers: LeadOfferOption[];
  defaultWeddingDate: string | null;
  minWeddingDate: string;
  viewer: LeadDialogViewer;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);
  const [selectedOfferId, setSelectedOfferId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const pending = searchParams?.get("pendingAction");
    if (!pending || !viewer.isSignedIn) return;
    if (pending === "lead" || pending.startsWith("lead:")) {
      const offerFromParam = pending.startsWith("lead:")
        ? pending.slice("lead:".length)
        : null;
      if (viewer.userRole === "VISITOR" && viewer.userId !== providerUserId) {
        setSelectedOfferId(offerFromParam);
        setOpen(true);
      } else {
        toast.info("طلبات عروض الأسعار متاحة لحسابات الزائرات فقط");
      }
      const params = new URLSearchParams(searchParams.toString());
      params.delete("pendingAction");
      const nextUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.replace(nextUrl, { scroll: false });
    }
  }, [searchParams, viewer.isSignedIn, viewer.userRole, viewer.userId, providerUserId, pathname, router]);

  return (
    <LeadRequestModal
      open={open}
      onOpenChange={setOpen}
      providerId={providerId}
      providerName={providerName}
      providerSlug={providerSlug}
      providerUserId={providerUserId}
      offers={offers}
      defaultWeddingDate={defaultWeddingDate}
      minWeddingDate={minWeddingDate}
      initialOfferId={selectedOfferId}
      viewer={viewer}
    />
  );
}
