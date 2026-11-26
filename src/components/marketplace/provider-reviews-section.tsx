"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReviewStatus } from "@prisma/client";
import {
  Flag,
  PencilSimple,
  Star,
  Trash,
  ChatText,
  CheckCircle,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Container } from "@/components/ui/container";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { LoginRequiredDialog } from "@/components/auth/login-required-dialog";
import { PhoneVerificationStep } from "@/components/phone/phone-verification-dialog";
import {
  REVIEW_MAX_COMMENT_LENGTH,
  REVIEW_REPORT_MAX_REASON_LENGTH,
  REVIEW_STATUS_LABELS_AR,
} from "@/lib/review-validation";
import {
  deleteOwnReviewAction,
  reportReviewAction,
  submitReviewAction,
} from "@/app/(public)/providers/[slug]/review-actions";
import { cn } from "@/lib/cn";

export interface PublicReviewItem {
  id: string;
  authorDisplayName: string;
  rating: number;
  comment: string | null;
  createdAtLabel: string;
  providerReply: string | null;
  providerRepliedAtLabel: string | null;
  isOwnReview: boolean;
}

export interface ProviderReviewsSectionProps {
  providerId: string;
  providerSlug: string;
  providerName: string;
  providerUserId: string;
  averageRating: number;
  reviewCount: number;
  ratingCounts: Record<1 | 2 | 3 | 4 | 5, number>;
  reviews: PublicReviewItem[];
  totalReviews: number;
  currentPage: number;
  totalPages: number;
  currentSort: "newest" | "highest" | "lowest";
  viewer: {
    isSignedIn: boolean;
    userId: string | null;
    userRole: string | null;
    phoneVerified: boolean;
    phoneVerificationRequired: boolean;
    existingReview: {
      id: string;
      rating: number;
      comment: string | null;
      status: ReviewStatus;
    } | null;
  };
}

const SORT_OPTIONS: Array<{
  value: "newest" | "highest" | "lowest";
  label: string;
}> = [
  { value: "newest", label: "الأحدث" },
  { value: "highest", label: "الأعلى" },
  { value: "lowest", label: "الأقل" },
];

export function ProviderReviewsSection({
  providerId,
  providerSlug,
  providerName,
  providerUserId,
  averageRating,
  reviewCount,
  ratingCounts,
  reviews,
  totalReviews,
  currentPage,
  totalPages,
  currentSort,
  viewer,
}: ProviderReviewsSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loginDialogOpen, setLoginDialogOpen] = React.useState(false);
  const [loginPendingAction, setLoginPendingAction] = React.useState<string>("review");

  const [reviewDialogOpen, setReviewDialogOpen] = React.useState(false);
  const [rating, setRating] = React.useState<number>(
    viewer.existingReview?.rating ?? 0
  );
  const [comment, setComment] = React.useState<string>(
    viewer.existingReview?.comment ?? ""
  );
  const [phoneVerified, setPhoneVerified] = React.useState(viewer.phoneVerified);
  const [submitting, setSubmitting] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [formError, setFormError] = React.useState("");
  const [submittedMessage, setSubmittedMessage] = React.useState("");

  const [reportTargetId, setReportTargetId] = React.useState<string | null>(null);
  const [reportReason, setReportReason] = React.useState("");
  const [reporting, setReporting] = React.useState(false);
  const [reportError, setReportError] = React.useState("");

  const isVisitor = viewer.userRole === "VISITOR";
  const isOwnProvider = viewer.userId === providerUserId;
  const needsPhoneStep =
    !viewer.existingReview &&
    viewer.phoneVerificationRequired &&
    !phoneVerified;

  // Resume pendingAction=review after Google login redirect
  React.useEffect(() => {
    const pending = searchParams?.get("pendingAction");
    if (pending === "review" && viewer.isSignedIn) {
      if (isVisitor && !isOwnProvider) {
        setReviewDialogOpen(true);
      } else {
        toast.info("التقييمات متاحة لحسابات الزائرات فقط");
      }
      const params = new URLSearchParams(searchParams.toString());
      params.delete("pendingAction");
      const nextUrl = params.toString()
        ? `/providers/${providerSlug}?${params.toString()}#reviews`
        : `/providers/${providerSlug}#reviews`;
      router.replace(nextUrl, { scroll: false });
    }
  }, [searchParams, viewer.isSignedIn, isVisitor, isOwnProvider, providerSlug, router]);

  const handleOpenReview = () => {
    if (!viewer.isSignedIn) {
      setLoginPendingAction("review");
      setLoginDialogOpen(true);
      return;
    }
    if (!isVisitor || isOwnProvider) {
      toast.error(
        isOwnProvider
          ? "لا يمكنك تقييم حسابك كمقدم خدمة"
          : "التقييمات متاحة لحسابات الزائرات فقط"
      );
      return;
    }
    setFormError("");
    setSubmittedMessage("");
    setRating(viewer.existingReview?.rating ?? 0);
    setComment(viewer.existingReview?.comment ?? "");
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setFormError("يرجى اختيار التقييم من 1 إلى 5 نجوم");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const res = await submitReviewAction({
        providerId,
        rating,
        comment,
      });
      if (!res.ok) {
        if (res.code === "UNAUTHENTICATED") {
          setReviewDialogOpen(false);
          setLoginPendingAction("review");
          setLoginDialogOpen(true);
          return;
        }
        setFormError(res.error || "تعذر إرسال التقييم");
        return;
      }
      const msg = res.message || "شكراً ليكِ! تقييمك هيظهر بعد المراجعة.";
      setSubmittedMessage(msg);
      toast.success(msg);
      router.refresh();
    } catch {
      setFormError("حدث خطأ أثناء إرسال التقييم");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!viewer.existingReview) return;
    setDeleting(true);
    setFormError("");
    try {
      const res = await deleteOwnReviewAction(viewer.existingReview.id);
      if (!res.ok) {
        setFormError(res.error || "تعذر حذف التقييم");
        return;
      }
      toast.success("تم حذف تقييمك");
      setReviewDialogOpen(false);
      router.refresh();
    } catch {
      setFormError("حدث خطأ أثناء حذف التقييم");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenReport = (reviewId: string) => {
    if (!viewer.isSignedIn) {
      setLoginPendingAction("report");
      setLoginDialogOpen(true);
      return;
    }
    setReportReason("");
    setReportError("");
    setReportTargetId(reviewId);
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTargetId) return;
    setReporting(true);
    setReportError("");
    try {
      const res = await reportReviewAction({
        reviewId: reportTargetId,
        reason: reportReason,
      });
      if (!res.ok) {
        setReportError(res.error || "تعذر إرسال البلاغ");
        return;
      }
      toast.success("تم استلام بلاغك وستراجعه الإدارة");
      setReportTargetId(null);
    } catch {
      setReportError("حدث خطأ أثناء إرسال البلاغ");
    } finally {
      setReporting(false);
    }
  };

  const buildPageHref = (page: number, sort = currentSort) => {
    const params = new URLSearchParams();
    if (sort !== "newest") params.set("reviewSort", sort);
    if (page > 1) params.set("reviewPage", String(page));
    const q = params.toString();
    return q ? `/providers/${providerSlug}?${q}#reviews` : `/providers/${providerSlug}#reviews`;
  };

  return (
    <Section id="reviews" spacing="sm" className="border-t border-border pt-12">
      <Container>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <SectionHeading
            eyebrow="CLIENT REVIEWS"
            title="تقييمات العرائس"
            description={`تجارب حقيقية وآراء موثقة حول ${providerName}.`}
          />

          <div className="flex flex-wrap items-center gap-3">
            {viewer.existingReview && (
              <Badge
                variant={
                  viewer.existingReview.status === "APPROVED"
                    ? "success"
                    : viewer.existingReview.status === "REJECTED"
                    ? "danger"
                    : "warning"
                }
                size="sm"
              >
                تقييمك: {REVIEW_STATUS_LABELS_AR[viewer.existingReview.status]}
              </Badge>
            )}
            <Button
              type="button"
              variant={viewer.existingReview ? "secondary" : "primary"}
              onClick={handleOpenReview}
              className="min-h-[44px] gap-2"
            >
              {viewer.existingReview ? (
                <>
                  <PencilSimple className="h-4 w-4" weight="light" />
                  <span>تعديل تقييمك</span>
                </>
              ) : (
                <>
                  <Star className="h-4 w-4" weight="light" />
                  <span>قيّمي تجربتك</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Summary & Distribution */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 rounded-[4px] border border-border bg-surface-raised p-6">
          <div className="lg:col-span-4 flex flex-col justify-center items-start border-b lg:border-b-0 lg:border-e border-border pb-6 lg:pb-0 lg:pe-6">
            <div className="font-latin text-4xl font-bold text-text">
              {reviewCount > 0 ? averageRating.toFixed(1) : "0.0"}
            </div>
            <div className="mt-2">
              <Rating value={averageRating} showScore={false} size="md" />
            </div>
            <p className="mt-2 text-xs text-text-muted">
              {reviewCount > 0
                ? `بناءً على ${reviewCount} تقييم معتمد`
                : "لا توجد تقييمات معتمدة بعد"}
            </p>
          </div>

          <div className="lg:col-span-8 flex flex-col justify-center gap-2.5">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = ratingCounts[star] ?? 0;
              const pct = reviewCount > 0 ? Math.round((count / reviewCount) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  <span className="w-12 shrink-0 font-latin font-medium text-text flex items-center gap-1">
                    <span>{star}</span>
                    <Star className="h-3.5 w-3.5 text-accent-text" weight="fill" />
                  </span>
                  <div className="flex-1 h-2.5 rounded-[2px] bg-surface-muted overflow-hidden border border-border/50">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-end font-latin text-text-muted">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sort Bar */}
        {totalReviews > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-text-muted">
              عرض {reviews.length} من أصل {totalReviews} تقييم
            </p>
            <div
              className="inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-surface-raised p-1"
              role="group"
              aria-label="ترتيب التقييمات"
            >
              {SORT_OPTIONS.map((opt) => {
                const active = currentSort === opt.value;
                return (
                  <Link
                    key={opt.value}
                    href={buildPageHref(1, opt.value)}
                    className={cn(
                      "inline-flex min-h-[36px] items-center rounded-[2px] px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-text text-text-inverse"
                        : "text-text-muted hover:text-text hover:bg-surface-muted"
                    )}
                    aria-current={active ? "true" : undefined}
                  >
                    {opt.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Reviews List or Empty State */}
        <div className="mt-6 space-y-4">
          {reviews.length === 0 ? (
            <EmptyState
              icon={<Star className="h-6 w-6" weight="light" />}
              title="لسه مفيش تقييمات. كوني أول من تقيّم."
              description="شاركي تجربتك لمساعدة العرائس في بني سويف على الاختيار."
              action={
                <Button type="button" variant="secondary" onClick={handleOpenReview}>
                  قيّمي تجربتك
                </Button>
              }
            />
          ) : (
            reviews.map((rev) => (
              <article
                key={rev.id}
                className="rounded-[4px] border border-border bg-surface-raised p-5 sm:p-6 space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-semibold text-text">
                        {rev.authorDisplayName}
                      </span>
                      {rev.isOwnReview && (
                        <Badge variant="accent" size="sm">
                          تقييمك
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-text-muted font-latin">
                      {rev.createdAtLabel}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Rating value={rev.rating} showScore={false} size="sm" />
                    {!rev.isOwnReview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenReport(rev.id)}
                        className="text-xs text-text-muted hover:text-danger gap-1 px-2 min-h-[36px]"
                        aria-label="إبلاغ عن التقييم"
                      >
                        <Flag className="h-3.5 w-3.5" weight="light" />
                        <span>إبلاغ</span>
                      </Button>
                    )}
                  </div>
                </div>

                {rev.comment && (
                  <p className="text-sm text-text leading-relaxed whitespace-pre-line">
                    {rev.comment}
                  </p>
                )}

                {rev.providerReply && (
                  <div className="mt-3 rounded-[4px] border-s-2 border-accent bg-surface-muted p-4 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-text">
                        <ChatText className="h-3.5 w-3.5 text-accent-text" weight="light" />
                        <span>رد {providerName}</span>
                      </span>
                      {rev.providerRepliedAtLabel && (
                        <span className="text-text-muted font-latin">
                          {rev.providerRepliedAtLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text leading-relaxed whitespace-pre-line">
                      {rev.providerReply}
                    </p>
                  </div>
                )}
              </article>
            ))
          )}
        </div>

        {/* Crawlable Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                {currentPage > 1 && (
                  <PaginationItem>
                    <PaginationPrevious href={buildPageHref(currentPage - 1)} />
                  </PaginationItem>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href={buildPageHref(page)}
                      isActive={page === currentPage}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                {currentPage < totalPages && (
                  <PaginationItem>
                    <PaginationNext href={buildPageHref(currentPage + 1)} />
                  </PaginationItem>
                )}
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Container>

      {/* Review Submit / Edit Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {viewer.existingReview ? "تعديل تقييمك" : `قيّمي تجربتك مع ${providerName}`}
            </DialogTitle>
            <DialogDescription>
              {viewer.existingReview
                ? "عند تعديل التقييم سيتم إرساله للمراجعة مجدداً قبل النشر."
                : "تقييمك يساعد باقي العرائس ويُراجع قبل النشر لضمان المصداقية."}
            </DialogDescription>
          </DialogHeader>

          {submittedMessage ? (
            <div className="space-y-4 py-2">
              <div className="flex flex-col items-center gap-3 rounded-[4px] border border-success/30 bg-success-muted p-6 text-center">
                <CheckCircle className="h-9 w-9 text-success" weight="fill" />
                <p className="text-sm font-semibold text-text">{submittedMessage}</p>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setReviewDialogOpen(false)}
                >
                  حسناً
                </Button>
              </DialogFooter>
            </div>
          ) : needsPhoneStep ? (
            <PhoneVerificationStep
              onVerified={() => {
                setPhoneVerified(true);
                router.refresh();
              }}
              onCancel={() => setReviewDialogOpen(false)}
            />
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-5">
              {/* Keyboard-accessible 1-5 star selector */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-text">
                  التقييم <span className="text-danger">*</span>
                </label>
                <div
                  role="radiogroup"
                  aria-label="اختاري عدد النجوم من 1 إلى 5"
                  className="flex items-center gap-2"
                  dir="ltr"
                >
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const selected = rating >= starVal;
                    return (
                      <button
                        key={starVal}
                        type="button"
                        role="radio"
                        aria-checked={rating === starVal}
                        aria-label={`${starVal} من 5 نجوم`}
                        onClick={() => setRating(starVal)}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                            e.preventDefault();
                            setRating(Math.min(5, (rating || 0) + 1));
                          } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                            e.preventDefault();
                            setRating(Math.max(1, (rating || 2) - 1));
                          }
                        }}
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-[4px] border transition-colors cursor-pointer",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          selected
                            ? "border-accent bg-accent/15 text-accent-text"
                            : "border-border bg-surface-raised text-text-muted hover:border-border-strong"
                        )}
                      >
                        <Star
                          className="h-5 w-5"
                          weight={selected ? "fill" : "light"}
                        />
                      </button>
                    );
                  })}
                  <span className="ms-2 font-latin text-xs text-text-muted" dir="rtl">
                    {rating > 0 ? `${rating} / 5` : "اختاري النجوم"}
                  </span>
                </div>
              </div>

              <Field
                label="تعليقك (اختياري)"
                htmlFor="review-comment"
                helpText={`${comment.length} / ${REVIEW_MAX_COMMENT_LENGTH} حرف`}
              >
                <Textarea
                  id="review-comment"
                  maxLength={REVIEW_MAX_COMMENT_LENGTH}
                  placeholder="احكي عن تجربتك مع الخدمة والالتزام بالمواعيد والتعامل..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </Field>

              {formError && (
                <p
                  role="alert"
                  className="rounded-[4px] border border-danger/30 bg-danger-muted p-2.5 text-xs text-danger"
                >
                  {formError}
                </p>
              )}

              <DialogFooter className="flex-wrap justify-between gap-2">
                {viewer.existingReview ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-danger hover:bg-danger-muted hover:text-danger gap-1.5"
                    loading={deleting}
                    onClick={handleDeleteReview}
                  >
                    <Trash className="h-4 w-4" weight="light" />
                    <span>حذف التقييم</span>
                  </Button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setReviewDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" variant="primary" loading={submitting}>
                    {viewer.existingReview ? "حفظ التعديل" : "إرسال التقييم"}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Review Dialog */}
      <Dialog
        open={Boolean(reportTargetId)}
        onOpenChange={(open) => {
          if (!open) setReportTargetId(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>الإبلاغ عن تقييم</DialogTitle>
            <DialogDescription>
              وضّحي سبب البلاغ وستراجعه إدارة المنصة في أقرب وقت.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitReport} className="space-y-4">
            <Field
              label="سبب البلاغ"
              htmlFor="report-reason"
              required
              helpText={`${reportReason.length} / ${REVIEW_REPORT_MAX_REASON_LENGTH} حرف`}
            >
              <Textarea
                id="report-reason"
                maxLength={REVIEW_REPORT_MAX_REASON_LENGTH}
                required
                placeholder="مثال: محتوى غير لائق أو معلومات غير صحيحة..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              />
            </Field>

            {reportError && (
              <p
                role="alert"
                className="rounded-[4px] border border-danger/30 bg-danger-muted p-2.5 text-xs text-danger"
              >
                {reportError}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setReportTargetId(null)}
              >
                إلغاء
              </Button>
              <Button type="submit" variant="primary" loading={reporting}>
                إرسال البلاغ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Login Required Dialog */}
      <LoginRequiredDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        pendingAction={loginPendingAction}
      />
    </Section>
  );
}
