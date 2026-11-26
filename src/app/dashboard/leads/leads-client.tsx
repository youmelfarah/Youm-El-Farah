"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { LeadStatus } from "@prisma/client";
import {
  CalendarBlank,
  PaperPlaneTilt,
  PhoneCall,
  WhatsappLogo,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import {
  LEAD_MAX_NOTE_LENGTH,
  LEAD_STATUS_LABELS_AR,
  LEAD_STATUS_VALUES,
} from "@/lib/lead-validation";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { updateProviderLeadAction } from "./actions";

export interface DashboardLeadItem {
  id: string;
  name: string;
  phone: string;
  weddingDateStr: string | null;
  weddingDateLabel: string | null;
  offerTitle: string | null;
  message: string | null;
  status: LeadStatus;
  providerNote: string | null;
  createdAtLabel: string;
}

export function DashboardLeadsClient({ leads }: { leads: DashboardLeadItem[] }) {
  const router = useRouter();
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [drafts, setDrafts] = React.useState<
    Record<string, { status: LeadStatus; note: string }>
  >(() =>
    Object.fromEntries(
      leads.map((l) => [
        l.id,
        { status: l.status, note: l.providerNote ?? "" },
      ])
    )
  );

  React.useEffect(() => {
    setDrafts(
      Object.fromEntries(
        leads.map((l) => [
          l.id,
          { status: l.status, note: l.providerNote ?? "" },
        ])
      )
    );
  }, [leads]);

  const handleSave = async (e: React.FormEvent, leadId: string) => {
    e.preventDefault();
    const draft = drafts[leadId];
    if (!draft) return;

    setSavingId(leadId);
    try {
      const res = await updateProviderLeadAction({
        leadId,
        status: draft.status,
        providerNote: draft.note,
      });
      if (!res.ok) {
        toast.error(res.error || "تعذر تحديث الطلب");
        return;
      }
      toast.success("تم حفظ حالة الطلب");
      router.refresh();
    } finally {
      setSavingId(null);
    }
  };

  if (leads.length === 0) {
    return (
      <EmptyState
        icon={<PaperPlaneTilt className="h-6 w-6" weight="light" />}
        title="لا توجد طلبات في هذا التصنيف"
        description="ستظهر هنا طلبات عروض الأسعار التي ترسلها العرائس من صفحة ملفك."
      />
    );
  }

  return (
    <div className="space-y-4">
      {leads.map((lead) => {
        const draft = drafts[lead.id] ?? {
          status: lead.status,
          note: lead.providerNote ?? "",
        };
        const waHref = buildWhatsAppUrl({
          phone: lead.phone,
          date: lead.weddingDateStr,
        });

        return (
          <Card key={lead.id}>
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-semibold text-text">
                      {lead.name}
                    </h3>
                    <Badge
                      variant={
                        lead.status === "BOOKED"
                          ? "success"
                          : lead.status === "NEW"
                          ? "accent"
                          : lead.status === "SPAM" || lead.status === "DECLINED"
                          ? "danger"
                          : "neutral"
                      }
                      size="sm"
                    >
                      {LEAD_STATUS_LABELS_AR[lead.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-text-muted font-latin">
                    تاريخ الطلب: {lead.createdAtLabel}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild variant="secondary" size="sm" className="gap-1.5">
                    <a href={`tel:${lead.phone}`} dir="ltr">
                      <PhoneCall className="h-4 w-4" weight="light" />
                      <span className="font-latin">{lead.phone}</span>
                    </a>
                  </Button>
                  {waHref && (
                    <Button asChild variant="primary" size="sm" className="gap-1.5">
                      <a href={waHref} target="_blank" rel="noopener noreferrer">
                        <WhatsappLogo className="h-4 w-4" weight="fill" />
                        <span>واتساب</span>
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted">
                {lead.weddingDateLabel && (
                  <span className="inline-flex items-center gap-1.5 text-text">
                    <CalendarBlank className="h-4 w-4 text-accent-text" weight="light" />
                    <span>موعد الفرح: {lead.weddingDateLabel}</span>
                  </span>
                )}
                {lead.offerTitle && (
                  <span>الباقة المختارة: {lead.offerTitle}</span>
                )}
              </div>

              {lead.message && (
                <div className="rounded-[4px] border border-border bg-surface-muted p-3.5 text-xs text-text leading-relaxed whitespace-pre-line">
                  {lead.message}
                </div>
              )}

              <form
                onSubmit={(e) => void handleSave(e, lead.id)}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 border-t border-border pt-4 items-end"
              >
                <div className="sm:col-span-4">
                  <Field label="حالة الطلب" htmlFor={`lead-status-${lead.id}`}>
                    <select
                      id={`lead-status-${lead.id}`}
                      value={draft.status}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [lead.id]: {
                            ...draft,
                            status: e.target.value as LeadStatus,
                          },
                        }))
                      }
                      className="flex h-11 w-full rounded-[4px] border border-border bg-surface-raised px-3 text-sm text-text"
                    >
                      {LEAD_STATUS_VALUES.map((s) => (
                        <option key={s} value={s}>
                          {LEAD_STATUS_LABELS_AR[s]}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="sm:col-span-6">
                  <Field
                    label="ملاحظة خاصة بكِ (اختياري)"
                    htmlFor={`lead-note-${lead.id}`}
                  >
                    <Textarea
                      id={`lead-note-${lead.id}`}
                      maxLength={LEAD_MAX_NOTE_LENGTH}
                      className="min-h-[44px]"
                      placeholder="مثال: تم الاتفاق على معاينة القاعة يوم الجمعة..."
                      value={draft.note}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [lead.id]: {
                            ...draft,
                            note: e.target.value,
                          },
                        }))
                      }
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={savingId === lead.id}
                    className="w-full"
                  >
                    حفظ
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
