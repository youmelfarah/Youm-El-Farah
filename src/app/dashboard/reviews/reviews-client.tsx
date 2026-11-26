"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChatText, PencilSimple, Trash, EyeSlash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { REVIEW_MAX_REPLY_LENGTH } from "@/lib/review-validation";
import {
  deleteProviderReviewReplyAction,
  saveProviderReviewReplyAction,
} from "./actions";

export interface DashboardReviewItem {
  id: string;
  authorDisplayName: string;
  rating: number;
  comment: string | null;
  createdAtLabel: string;
  providerReply: string | null;
  providerRepliedAtLabel: string | null;
  providerReplyHidden: boolean;
}

export function DashboardReviewsClient({
  reviews,
}: {
  reviews: DashboardReviewItem[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [savingId, setSavingId] = React.useState<string | null>(null);

  const startReply = (item: DashboardReviewItem) => {
    setEditingId(item.id);
    setReplyText(item.providerReply ?? "");
  };

  const handleSave = async (e: React.FormEvent, reviewId: string) => {
    e.preventDefault();
    setSavingId(reviewId);
    try {
      const res = await saveProviderReviewReplyAction({
        reviewId,
        reply: replyText,
      });
      if (!res.ok) {
        toast.error(res.error || "تعذر حفظ الرد");
        return;
      }
      toast.success("تم نشر ردك على التقييم");
      setEditingId(null);
      setReplyText("");
      router.refresh();
    } catch {
      toast.error("حدث خطأ أثناء حفظ الرد");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (reviewId: string) => {
    setSavingId(reviewId);
    try {
      const res = await deleteProviderReviewReplyAction(reviewId);
      if (!res.ok) {
        toast.error(res.error || "تعذر حذف الرد");
        return;
      }
      toast.success("تم حذف الرد");
      if (editingId === reviewId) {
        setEditingId(null);
        setReplyText("");
      }
      router.refresh();
    } catch {
      toast.error("حدث خطأ أثناء حذف الرد");
    } finally {
      setSavingId(null);
    }
  };

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={<ChatText className="h-6 w-6" weight="light" />}
        title="لا توجد تقييمات معتمدة حتى الآن"
        description="ستظهر هنا التقييمات المعتمدة من الإدارة لتتمكني من الرد عليها."
      />
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((rev) => {
        const isEditing = editingId === rev.id;
        return (
          <Card key={rev.id}>
            <CardContent className="p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-sm font-semibold text-text">
                    {rev.authorDisplayName}
                  </p>
                  <p className="text-xs text-text-muted font-latin mt-0.5">
                    {rev.createdAtLabel}
                  </p>
                </div>
                <Rating value={rev.rating} showScore={false} size="sm" />
              </div>

              {rev.comment ? (
                <p className="text-sm text-text leading-relaxed whitespace-pre-line">
                  {rev.comment}
                </p>
              ) : (
                <p className="text-xs text-text-muted">تقييم بالنجوم فقط بدون تعليق مكتوب.</p>
              )}

              {/* Existing Reply */}
              {rev.providerReply && !isEditing && (
                <div className="rounded-[4px] border border-border bg-surface-muted p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-text">ردك على التقييم</span>
                    <div className="flex items-center gap-2">
                      {rev.providerReplyHidden && (
                        <Badge variant="danger" size="sm">
                          <EyeSlash className="h-3 w-3" />
                          <span>مخفي من الإدارة</span>
                        </Badge>
                      )}
                      {rev.providerRepliedAtLabel && (
                        <span className="text-[11px] text-text-muted font-latin">
                          {rev.providerRepliedAtLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-text leading-relaxed whitespace-pre-line">
                    {rev.providerReply}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => startReply(rev)}
                      className="gap-1.5 text-xs"
                    >
                      <PencilSimple className="h-3.5 w-3.5" weight="light" />
                      <span>تعديل الرد</span>
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      loading={savingId === rev.id}
                      onClick={() => void handleDelete(rev.id)}
                      className="gap-1.5 text-xs text-danger hover:text-danger hover:bg-danger-muted"
                    >
                      <Trash className="h-3.5 w-3.5" weight="light" />
                      <span>حذف الرد</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Add Reply Button */}
              {!rev.providerReply && !isEditing && (
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => startReply(rev)}
                    className="gap-1.5"
                  >
                    <ChatText className="h-4 w-4" weight="light" />
                    <span>كتابة رد</span>
                  </Button>
                </div>
              )}

              {/* Reply Form */}
              {isEditing && (
                <form
                  onSubmit={(e) => void handleSave(e, rev.id)}
                  className="space-y-3 border-t border-border pt-4"
                >
                  <Field
                    label="ردك على العميلة"
                    htmlFor={`reply-${rev.id}`}
                    helpText={`${replyText.length} / ${REVIEW_MAX_REPLY_LENGTH} حرف`}
                    required
                  >
                    <Textarea
                      id={`reply-${rev.id}`}
                      maxLength={REVIEW_MAX_REPLY_LENGTH}
                      required
                      placeholder="اشكري العروسة أو وضّحي أي نقطة باحترافية..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                  </Field>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingId(null);
                        setReplyText("");
                      }}
                    >
                      إلغاء
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      loading={savingId === rev.id}
                    >
                      نشر الرد
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
