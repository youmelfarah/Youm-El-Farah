"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReviewStatus } from "@prisma/client";
import { PencilSimple, Star, Trash, ChatText } from "@phosphor-icons/react";
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
import {
  REVIEW_MAX_COMMENT_LENGTH,
  REVIEW_STATUS_LABELS_AR,
} from "@/lib/review-aggregates";
import {
  deleteOwnReviewAction,
  submitReviewAction,
} from "@/app/(public)/providers/[slug]/review-actions";
import { cn } from "@/lib/cn";

export interface VisitorReviewItem {
  id: string;
  providerId: string;
  providerName: string;
  providerSlug: string;
  providerVisible: boolean;
  rating: number;
  comment: string | null;
  status: ReviewStatus;
  moderationNote: string | null;
  providerReply: string | null;
  createdAtLabel: string;
}

export function VisitorReviewsClient({
  reviews,
}: {
  reviews: VisitorReviewItem[];
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<VisitorReviewItem | null>(null);
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const openEdit = (rev: VisitorReviewItem) => {
    setEditing(rev);
    setRating(rev.rating);
    setComment(rev.comment ?? "");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try {
      const res = await submitReviewAction({
        providerId: editing.providerId,
        rating,
        comment,
      });
      if (!res.ok) {
        toast.error(res.error || "تعذر تعديل التقييم");
        return;
      }
      toast.success(res.message || "شكراً ليكِ! تقييمك هيظهر بعد المراجعة.");
      setEditing(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    setBusy(true);
    try {
      const res = await deleteOwnReviewAction(reviewId);
      if (!res.ok) {
        toast.error(res.error || "تعذر حذف التقييم");
        return;
      }
      toast.success("تم حذف تقييمك");
      setEditing(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<Star className="h-6 w-6" weight="light" />}
        title="لم تضيفي أي تقييمات بعد"
        description="تصفحي مقدمي الخدمات وشاركي تجربتك لمساعدة باقي العرائس."
        action={
          <Button asChild variant="primary">
            <Link href="/services">تصفحي الخدمات</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((rev) => (
        <Card key={rev.id}>
          <CardContent className="p-5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                {rev.providerVisible ? (
                  <Link
                    href={`/providers/${rev.providerSlug}#reviews`}
                    className="font-display text-base font-semibold text-text hover:text-accent-text transition-colors"
                  >
                    {rev.providerName}
                  </Link>
                ) : (
                  <span className="font-display text-base font-semibold text-text">
                    {rev.providerName}{" "}
                    <span className="text-xs font-normal text-text-muted">
                      (غير متاح حالياً)
                    </span>
                  </span>
                )}
                <p className="text-xs text-text-muted font-latin mt-0.5">
                  {rev.createdAtLabel}
                </p>
              </div>

              <div className="flex items-center gap-2">
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
                <Rating value={rev.rating} showScore={false} size="sm" />
              </div>
            </div>

            {rev.comment && (
              <p className="text-sm text-text leading-relaxed whitespace-pre-line">
                {rev.comment}
              </p>
            )}

            {rev.status === "REJECTED" && rev.moderationNote && (
              <p className="rounded-[4px] border border-danger/30 bg-danger-muted p-3 text-xs text-danger">
                سبب الرفض: {rev.moderationNote}
              </p>
            )}

            {rev.providerReply && (
              <div className="rounded-[4px] border-s-2 border-accent bg-surface-muted p-3.5 space-y-1">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-text">
                  <ChatText className="h-3.5 w-3.5 text-accent-text" weight="light" />
                  <span>رد {rev.providerName}</span>
                </span>
                <p className="text-xs text-text whitespace-pre-line">
                  {rev.providerReply}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
              {rev.providerVisible && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => openEdit(rev)}
                  className="gap-1.5"
                >
                  <PencilSimple className="h-3.5 w-3.5" weight="light" />
                  <span>تعديل</span>
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={busy}
                onClick={() => void handleDelete(rev.id)}
                className="gap-1.5 text-danger hover:bg-danger-muted hover:text-danger"
              >
                <Trash className="h-3.5 w-3.5" weight="light" />
                <span>حذف</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>تعديل تقييمك لـ {editing?.providerName}</DialogTitle>
            <DialogDescription>
              سيعود التقييم إلى حالة بانتظار المراجعة بعد حفظ التعديلات.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-text">التقييم</label>
              <div className="flex items-center gap-2" dir="ltr">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    aria-label={`${starVal} من 5 نجوم`}
                    onClick={() => setRating(starVal)}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-[4px] border transition-colors cursor-pointer",
                      rating >= starVal
                        ? "border-accent bg-accent/15 text-accent-text"
                        : "border-border bg-surface-raised text-text-muted"
                    )}
                  >
                    <Star
                      className="h-5 w-5"
                      weight={rating >= starVal ? "fill" : "light"}
                    />
                  </button>
                ))}
              </div>
            </div>

            <Field
              label="التعليق"
              htmlFor="edit-visitor-review-comment"
              helpText={`${comment.length} / ${REVIEW_MAX_COMMENT_LENGTH} حرف`}
            >
              <Textarea
                id="edit-visitor-review-comment"
                maxLength={REVIEW_MAX_COMMENT_LENGTH}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </Field>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditing(null)}
              >
                إلغاء
              </Button>
              <Button type="submit" variant="primary" loading={busy}>
                حفظ التعديل
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
