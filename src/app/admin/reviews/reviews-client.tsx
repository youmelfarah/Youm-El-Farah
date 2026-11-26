"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReviewStatus } from "@prisma/client";
import {
  Check,
  Eye,
  EyeSlash,
  Flag,
  X,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { REVIEW_STATUS_LABELS_AR } from "@/lib/review-aggregates";
import {
  moderateReviewAction,
  resolveReviewReportAction,
  toggleProviderReplyHiddenAction,
} from "./actions";

export interface AdminReviewRow {
  id: string;
  providerId: string;
  providerName: string;
  providerSlug: string;
  authorDisplayName: string;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  moderationNote: string | null;
  providerReply: string | null;
  providerReplyHidden: boolean;
  createdAtLabel: string;
  unresolvedReportsCount: number;
}

export interface AdminReportRow {
  id: string;
  reason: string;
  createdAtLabel: string;
  resolvedAtLabel: string | null;
  reporterDisplayName: string;
  review: {
    id: string;
    providerName: string;
    providerSlug: string;
    authorDisplayName: string;
    rating: number;
    comment: string | null;
    status: ReviewStatus;
    providerReply: string | null;
    providerReplyHidden: boolean;
  };
}

export function AdminReviewsClient({
  tab,
  reviews,
  reports,
}: {
  tab: "pending" | "approved" | "rejected" | "reports";
  reviews: AdminReviewRow[];
  reports: AdminReportRow[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [rejectModal, setRejectModal] = React.useState<{
    type: "review" | "report";
    id: string;
    title: string;
  } | null>(null);
  const [note, setNote] = React.useState("");

  const handleApprove = async (reviewId: string) => {
    setBusyId(reviewId);
    try {
      const res = await moderateReviewAction({
        reviewId,
        decision: "APPROVED",
      });
      if (!res.ok) {
        toast.error(res.error || "تعذر اعتماد التقييم");
        return;
      }
      toast.success("تم اعتماد التقييم ونشره");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModal) return;
    setBusyId(rejectModal.id);
    try {
      const res =
        rejectModal.type === "review"
          ? await moderateReviewAction({
              reviewId: rejectModal.id,
              decision: "REJECTED",
              moderationNote: note,
            })
          : await resolveReviewReportAction({
              reportId: rejectModal.id,
              mode: "REJECT_REVIEW",
              note,
            });
      if (!res.ok) {
        toast.error(res.error || "تعذر تنفيذ الإجراء");
        return;
      }
      toast.success("تم رفض/إخفاء التقييم");
      setRejectModal(null);
      setNote("");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleReply = async (reviewId: string, hidden: boolean) => {
    setBusyId(reviewId);
    try {
      const res = await toggleProviderReplyHiddenAction({ reviewId, hidden });
      if (!res.ok) {
        toast.error(res.error || "تعذر تحديث حالة الرد");
        return;
      }
      toast.success(hidden ? "تم إخفاء رد مقدم الخدمة" : "تم إظهار رد مقدم الخدمة");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleResolveReport = async (
    reportId: string,
    mode: "DISMISS" | "HIDE_REPLY"
  ) => {
    setBusyId(reportId);
    try {
      const res = await resolveReviewReportAction({ reportId, mode });
      if (!res.ok) {
        toast.error(res.error || "تعذر معالجة البلاغ");
        return;
      }
      toast.success(
        mode === "HIDE_REPLY"
          ? "تم إخفاء رد مقدم الخدمة وإغلاق البلاغ"
          : "تم إغلاق البلاغ"
      );
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  if (tab === "reports") {
    if (reports.length === 0) {
      return (
        <EmptyState
          icon={<Flag className="h-6 w-6" weight="light" />}
          title="لا توجد بلاغات"
          description="لا توجد بلاغات مطابقة لخيارات التصفية الحالية."
        />
      );
    }

    return (
      <div className="space-y-4">
        {reports.map((rep) => (
          <Card key={rep.id}>
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={rep.resolvedAtLabel ? "success" : "warning"} size="sm">
                      {rep.resolvedAtLabel ? "تمت المعالجة" : "بلاغ مفتوح"}
                    </Badge>
                    <span className="text-xs text-text-muted">
                      بواسطة: <strong className="text-text">{rep.reporterDisplayName}</strong>
                    </span>
                    <span className="text-xs text-text-muted font-latin">
                      {rep.createdAtLabel}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-danger">
                    سبب البلاغ: {rep.reason}
                  </p>
                </div>

                <Link
                  href={`/admin/providers/${rep.review.id}`}
                  className="hidden"
                />
              </div>

              <div className="rounded-[4px] border border-border bg-surface-muted p-4 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-text">
                    {rep.review.providerName} • {rep.review.authorDisplayName}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral" size="sm">
                      {REVIEW_STATUS_LABELS_AR[rep.review.status]}
                    </Badge>
                    <Rating value={rep.review.rating} showScore={false} size="sm" />
                  </div>
                </div>
                {rep.review.comment && (
                  <p className="text-xs text-text leading-relaxed whitespace-pre-line">
                    {rep.review.comment}
                  </p>
                )}
                {rep.review.providerReply && (
                  <div className="border-t border-border/60 pt-2 text-xs text-text-muted">
                    رد المقدم{rep.review.providerReplyHidden ? " (مخفي)" : ""}:{" "}
                    {rep.review.providerReply}
                  </div>
                )}
              </div>

              {!rep.resolvedAtLabel && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={busyId === rep.id}
                    onClick={() => void handleResolveReport(rep.id, "DISMISS")}
                  >
                    إغلاق البلاغ (الإبقاء على التقييم)
                  </Button>
                  {rep.review.providerReply && !rep.review.providerReplyHidden && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      loading={busyId === rep.id}
                      onClick={() => void handleResolveReport(rep.id, "HIDE_REPLY")}
                    >
                      إخفاء رد المقدم وإغلاق البلاغ
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setNote("");
                      setRejectModal({
                        type: "report",
                        id: rep.id,
                        title: `رفض تقييم ${rep.review.authorDisplayName}`,
                      });
                    }}
                  >
                    رفض التقييم وإغلاق البلاغ
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <RejectReasonDialog
          modal={rejectModal}
          note={note}
          setNote={setNote}
          busy={Boolean(busyId)}
          onClose={() => setRejectModal(null)}
          onSubmit={handleConfirmReject}
        />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <EmptyState
        title="لا توجد تقييمات في هذا القسم"
        description="لم يتم العثور على تقييمات مطابقة للفلاتر المحددة."
      />
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((rev) => (
        <Card key={rev.id}>
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/providers/${rev.providerId}`}
                    className="font-display text-sm font-semibold text-text hover:underline"
                  >
                    {rev.providerName}
                  </Link>
                  <span className="text-xs text-text-muted">•</span>
                  <span className="text-xs font-medium text-text">
                    {rev.authorDisplayName}
                  </span>
                  <Badge
                    variant={
                      rev.status === "APPROVED"
                        ? "success"
                        : rev.status === "REJECTED"
                        ? "danger"
                        : "warning"
                    }
                    size="sm"
                  >
                    {REVIEW_STATUS_LABELS_AR[rev.status]}
                  </Badge>
                  {rev.unresolvedReportsCount > 0 && (
                    <Badge variant="danger" size="sm">
                      <Flag className="h-3 w-3" />
                      <span>{rev.unresolvedReportsCount} بلاغ مفتوح</span>
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-text-muted font-latin">
                  {rev.createdAtLabel}
                </p>
              </div>
              <Rating value={rev.rating} showScore={false} size="sm" />
            </div>

            {rev.comment && (
              <p className="text-sm text-text leading-relaxed whitespace-pre-line">
                {rev.comment}
              </p>
            )}

            {rev.moderationNote && (
              <div className="rounded-[4px] border border-warning/30 bg-warning-muted p-3 text-xs text-text">
                <strong>ملاحظة المراجعة:</strong> {rev.moderationNote}
              </div>
            )}

            {rev.providerReply && (
              <div className="rounded-[4px] border border-border bg-surface-muted p-3.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-text">رد مقدم الخدمة</span>
                  {rev.providerReplyHidden && (
                    <Badge variant="danger" size="sm">
                      مخفي عن العامة
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-text whitespace-pre-line">
                  {rev.providerReply}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
              {rev.status !== "APPROVED" && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={busyId === rev.id}
                  onClick={() => void handleApprove(rev.id)}
                  className="gap-1.5"
                >
                  <Check className="h-4 w-4" weight="bold" />
                  <span>اعتماد ونشر</span>
                </Button>
              )}

              {rev.status !== "REJECTED" && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setNote(rev.moderationNote ?? "");
                    setRejectModal({
                      type: "review",
                      id: rev.id,
                      title:
                        rev.status === "APPROVED"
                          ? "إخفاء ورفض التقييم"
                          : "رفض التقييم",
                    });
                  }}
                  className="gap-1.5 text-danger hover:text-danger"
                >
                  <X className="h-4 w-4" weight="bold" />
                  <span>
                    {rev.status === "APPROVED" ? "إخفاء / رفض" : "رفض مع سبب"}
                  </span>
                </Button>
              )}

              {rev.providerReply && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={busyId === rev.id}
                  onClick={() =>
                    void handleToggleReply(rev.id, !rev.providerReplyHidden)
                  }
                  className="gap-1.5"
                >
                  {rev.providerReplyHidden ? (
                    <>
                      <Eye className="h-4 w-4" weight="light" />
                      <span>إظهار رد المقدم</span>
                    </>
                  ) : (
                    <>
                      <EyeSlash className="h-4 w-4" weight="light" />
                      <span>إخفاء رد المقدم</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <RejectReasonDialog
        modal={rejectModal}
        note={note}
        setNote={setNote}
        busy={Boolean(busyId)}
        onClose={() => setRejectModal(null)}
        onSubmit={handleConfirmReject}
      />
    </div>
  );
}

function RejectReasonDialog({
  modal,
  note,
  setNote,
  busy,
  onClose,
  onSubmit,
}: {
  modal: { type: "review" | "report"; id: string; title: string } | null;
  note: string;
  setNote: (val: string) => void;
  busy: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Dialog open={Boolean(modal)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{modal?.title || "سبب الرفض"}</DialogTitle>
          <DialogDescription>
            اكتبي سبب الرفض أو الإخفاء ليُحفظ في سجل التدقيق ويظهر للزائرة.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="سبب الرفض" htmlFor="moderation-note" required>
            <Textarea
              id="moderation-note"
              maxLength={500}
              required
              placeholder="مثال: محتوى غير مرتبط بالخدمة أو ألفاظ غير مناسبة"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit" variant="primary" loading={busy}>
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
