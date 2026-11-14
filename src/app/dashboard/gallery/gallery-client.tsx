"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UploadSimple,
  Trash,
  PencilSimple,
  CaretUp,
  CaretDown,
  Image as ImageIcon,
  FilmStrip,
} from "@phosphor-icons/react";
import { getCloudinaryUploadSignatureAction } from "@/app/dashboard/cloudinary-actions";
import {
  uploadFileDirectToCloudinary,
  validateImageFileClient,
} from "@/lib/cloudinary-client";
import { resolveCloudinaryDisplayUrl } from "@/lib/cloudinary-url";
import {
  addGalleryImageAction,
  addGalleryVideoAction,
  deleteMediaAction,
  reorderMediaAction,
  updateMediaCaptionAction,
} from "./actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/cn";

export interface MediaItem {
  id: string;
  type: "IMAGE" | "VIDEO";
  url: string;
  cloudinaryPublicId: string | null;
  caption: string | null;
  sortOrder: number;
}

interface PendingUpload {
  localId: string;
  fileName: string;
  previewUrl: string;
  progress: number;
  status: "uploading" | "saving" | "done" | "error";
  error?: string;
}

export function GalleryClient({
  images,
  videos,
  imageLimit,
  videoLimit,
  cloudName,
  isSuspended,
}: {
  images: MediaItem[];
  videos: MediaItem[];
  imageLimit: number;
  videoLimit: number;
  cloudName: string;
  isSuspended: boolean;
}) {
  const router = useRouter();

  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [imageError, setImageError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const [videoUrl, setVideoUrl] = useState("");
  const [videoCaption, setVideoCaption] = useState("");
  const [addingVideo, setAddingVideo] = useState(false);
  const [videoError, setVideoError] = useState("");

  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");

  const imageAtLimit = images.length >= imageLimit;
  const videoAtLimit = videos.length >= videoLimit;
  const isUploading = pendingUploads.some(
    (u) => u.status === "uploading" || u.status === "saving"
  );

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = e.target.files;
    const files = fileList ? Array.from(fileList) : [];
    e.target.value = "";

    if (files.length === 0 || isSuspended) return;
    setImageError("");

    const remaining = imageLimit - images.length;
    if (remaining <= 0) {
      setImageError(`وصلت إلى الحد الأقصى للصور المسموح بها (${imageLimit}).`);
      return;
    }

    if (files.length > remaining) {
      setImageError(
        `يمكنك رفع ${remaining} صور فقط قبل الوصول إلى الحد الأقصى (${imageLimit}).`
      );
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      const err = validateImageFileClient(file);
      if (err) {
        setImageError(`${file.name}: ${err}`);
        return;
      }
      validFiles.push(file);
    }

    const sigRes = await getCloudinaryUploadSignatureAction({
      target: "gallery",
    });
    if (sigRes.error || !sigRes.data) {
      setImageError(sigRes.error ?? "تعذر تجهيز توقيع الرفع.");
      return;
    }
    const signed = sigRes.data;

    const batch: PendingUpload[] = validFiles.map((file, idx) => ({
      localId: `${Date.now()}-${idx}`,
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
      progress: 0,
      status: "uploading",
    }));
    setPendingUploads((prev) => [...prev, ...batch]);

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const localId = batch[i].localId;

      try {
        const uploaded = await uploadFileDirectToCloudinary(
          file,
          signed,
          (pct) => {
            setPendingUploads((prev) =>
              prev.map((item) =>
                item.localId === localId ? { ...item, progress: pct } : item
              )
            );
          }
        );

        setPendingUploads((prev) =>
          prev.map((item) =>
            item.localId === localId
              ? { ...item, status: "saving", progress: 100 }
              : item
          )
        );

        const saveRes = await addGalleryImageAction({
          publicId: uploaded.publicId,
        });

        if (saveRes.error) {
          throw new Error(saveRes.error);
        }

        setPendingUploads((prev) =>
          prev.map((item) =>
            item.localId === localId ? { ...item, status: "done" } : item
          )
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "فشل الرفع";
        setPendingUploads((prev) =>
          prev.map((item) =>
            item.localId === localId
              ? { ...item, status: "error", error: msg }
              : item
          )
        );
      }
    }

    // Clean up successful blob URLs and refresh
    setTimeout(() => {
      setPendingUploads((prev) => {
        const remainingErrors: PendingUpload[] = [];
        for (const item of prev) {
          if (item.status === "done") {
            URL.revokeObjectURL(item.previewUrl);
          } else {
            remainingErrors.push(item);
          }
        }
        return remainingErrors;
      });
      router.refresh();
    }, 800);
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuspended) return;

    setAddingVideo(true);
    setVideoError("");

    const res = await addGalleryVideoAction({
      url: videoUrl,
      caption: videoCaption,
    });
    setAddingVideo(false);

    if (res.error) {
      setVideoError(res.error);
      return;
    }

    setVideoUrl("");
    setVideoCaption("");
    router.refresh();
  };

  const handleDelete = async (mediaId: string, isImage: boolean) => {
    if (isSuspended) return;
    if (!confirm("هل أنت متأكد من حذف هذا العنصر؟")) return;

    setBusyId(mediaId);
    const res = await deleteMediaAction({ mediaId });
    setBusyId(null);

    if (res.error) {
      if (isImage) setImageError(res.error);
      else setVideoError(res.error);
      return;
    }
    router.refresh();
  };

  const handleReorder = async (
    mediaId: string,
    direction: "up" | "down",
    isImage: boolean
  ) => {
    if (isSuspended) return;
    setBusyId(mediaId);
    const res = await reorderMediaAction({ mediaId, direction });
    setBusyId(null);

    if (res.error) {
      if (isImage) setImageError(res.error);
      else setVideoError(res.error);
      return;
    }
    router.refresh();
  };

  const handleSaveCaption = async (mediaId: string, isImage: boolean) => {
    if (isSuspended) return;
    setBusyId(mediaId);
    const res = await updateMediaCaptionAction({
      mediaId,
      caption: captionDraft,
    });
    setBusyId(null);

    if (res.error) {
      if (isImage) setImageError(res.error);
      else setVideoError(res.error);
      return;
    }
    setEditingCaptionId(null);
    setCaptionDraft("");
    router.refresh();
  };

  return (
    <div className="space-y-8">
      {/* Images Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>معرض الصور</CardTitle>
              <CardDescription>
                استخدمت <span className="font-latin font-bold text-text">{images.length}</span> من أصل{" "}
                <span className="font-latin font-bold text-text">{imageLimit}</span> صورة مسموحة (JPG، PNG، WebP حتى 5MB).
              </CardDescription>
            </div>

            <label
              className={cn(
                "inline-flex cursor-pointer items-center justify-center gap-2 rounded-[4px] bg-text px-4 py-2.5 text-xs font-semibold text-text-inverse transition hover:opacity-90",
                (imageAtLimit || isSuspended || isUploading) && "pointer-events-none opacity-50"
              )}
            >
              <UploadSimple className="h-4 w-4" weight="bold" />
              <span>{isUploading ? "جارٍ الرفع..." : "رفع صور جديدة"}</span>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                disabled={imageAtLimit || isSuspended || isUploading}
                onChange={handleFilesSelected}
                className="sr-only"
              />
            </label>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {imageAtLimit && (
            <div className="rounded-[4px] border border-warning/40 bg-warning-muted p-3 text-xs text-text">
              لقد وصلتِ إلى الحد الأقصى للصور المسموح بها (<span className="font-latin font-bold">{imageLimit}</span>). احذفي صورة حالية لإضافة صور جديدة.
            </div>
          )}

          {imageError && (
            <div className="rounded-[4px] border border-danger/30 bg-danger-muted p-3 text-xs text-danger">
              {imageError}
            </div>
          )}

          {/* Pending Uploads Progress */}
          {pendingUploads.length > 0 && (
            <div className="space-y-2">
              {pendingUploads.map((item) => (
                <div
                  key={item.localId}
                  className="flex items-center gap-3 rounded-[4px] border border-border bg-surface-muted p-2.5 text-xs"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt={item.fileName}
                    className="h-12 w-12 shrink-0 rounded-[2px] object-cover border border-border"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-text">{item.fileName}</p>
                    {item.status === "error" ? (
                      <p className="text-xs text-danger">{item.error}</p>
                    ) : (
                      <>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-[2px] bg-surface border border-border">
                          <div
                            className="h-full bg-text transition-all duration-150"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <p className="mt-0.5 text-[10px] text-text-muted font-latin">
                          {item.status === "saving" ? "Saving..." : `${item.progress}%`}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Images Grid */}
          {images.length === 0 ? (
            <EmptyState
              icon={<ImageIcon className="h-6 w-6" weight="light" />}
              title="لا توجد صور في المعرض بعد"
              description="أضيفي صوراً حقيقية وعالية الجودة من أعمالكِ السابقة لجذب العرائس."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {images.map((img, index) => {
                const src =
                  resolveCloudinaryDisplayUrl({
                    publicId: img.cloudinaryPublicId,
                    fallbackUrl: img.url,
                    preset: "card",
                    cloudName,
                  }) ?? img.url;
                const isBusy = busyId === img.id;
                const isEditingCaption = editingCaptionId === img.id;

                return (
                  <div
                    key={img.id}
                    className="overflow-hidden rounded-[4px] border border-border bg-surface-raised"
                  >
                    <div className="relative aspect-[4/3] w-full bg-surface-muted">
                      <Image
                        src={src}
                        alt={img.caption || "صورة من المعرض"}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>

                    <div className="space-y-2 p-3 text-xs">
                      {isEditingCaption && !isSuspended ? (
                        <div className="space-y-2">
                          <Input
                            type="text"
                            maxLength={120}
                            value={captionDraft}
                            onChange={(e) => setCaptionDraft(e.target.value)}
                            placeholder="وصف مختصر (اختياري، 120 حرف)"
                            className="h-9 text-xs"
                          />
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleSaveCaption(img.id, true)}
                            >
                              حفظ
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => setEditingCaptionId(null)}
                            >
                              إلغاء
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="min-h-[1.25rem] text-text-muted text-xs">
                          {img.caption || (
                            <span className="text-text-muted/50 italic">بدون تعليق</span>
                          )}
                        </p>
                      )}

                      <div className="flex items-center justify-between border-t border-border pt-2">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            iconOnly
                            disabled={isSuspended || isBusy || index === 0}
                            onClick={() => handleReorder(img.id, "up", true)}
                            aria-label="تحريك لأعلى"
                            className="h-8 w-8 min-h-[32px] min-w-[32px]"
                          >
                            <CaretUp className="h-3.5 w-3.5" weight="bold" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            iconOnly
                            disabled={
                              isSuspended || isBusy || index === images.length - 1
                            }
                            onClick={() => handleReorder(img.id, "down", true)}
                            aria-label="تحريك لأسفل"
                            className="h-8 w-8 min-h-[32px] min-w-[32px]"
                          >
                            <CaretDown className="h-3.5 w-3.5" weight="bold" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled={isSuspended || isBusy}
                            onClick={() => {
                              setEditingCaptionId(img.id);
                              setCaptionDraft(img.caption ?? "");
                            }}
                          >
                            التعليق
                          </Button>
                          <Button
                            type="button"
                            variant="danger-outline"
                            size="sm"
                            disabled={isSuspended || isBusy}
                            onClick={() => handleDelete(img.id, true)}
                          >
                            حذف
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Videos Section */}
      <Card>
        <CardHeader>
          <CardTitle>روابط الفيديو</CardTitle>
          <CardDescription>
            استخدمت <span className="font-latin font-bold text-text">{videos.length}</span> من أصل{" "}
            <span className="font-latin font-bold text-text">{videoLimit}</span> مقاطع فيديو (YouTube أو Facebook أو Instagram).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {videoAtLimit && (
            <div className="rounded-[4px] border border-warning/40 bg-warning-muted p-3 text-xs text-text">
              لقد وصلتِ إلى الحد الأقصى للفيديوهات المسموح بها (<span className="font-latin font-bold">{videoLimit}</span>). احذفي فيديو حالياً لإضافة رابط جديد.
            </div>
          )}

          <form onSubmit={handleAddVideo} className="space-y-3">
            <Field label="رابط الفيديو" required>
              <Input
                type="url"
                required
                disabled={videoAtLimit || isSuspended || addingVideo}
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                dir="ltr"
              />
            </Field>

            <Field label="تعليق أو عنوان للفيديو (اختياري)">
              <Input
                type="text"
                maxLength={120}
                disabled={videoAtLimit || isSuspended || addingVideo}
                value={videoCaption}
                onChange={(e) => setVideoCaption(e.target.value)}
                placeholder="مثال: لقطات من زفاف في قاعة اللؤلؤة"
              />
            </Field>

            {videoError && (
              <div className="rounded-[4px] border border-danger/30 bg-danger-muted p-2.5 text-xs text-danger">
                {videoError}
              </div>
            )}

            <Button
              type="submit"
              disabled={videoAtLimit || isSuspended}
              loading={addingVideo}
              variant="primary"
            >
              إضافة رابط الفيديو
            </Button>
          </form>

          {/* Videos List */}
          {videos.length === 0 ? (
            <EmptyState
              icon={<FilmStrip className="h-6 w-6" weight="light" />}
              title="لا توجد روابط فيديو بعد"
              description="أضيفي روابط لمقاطع فيديو من حفلات زفاف وثقتيها على يوتيوب أو فيسبوك."
              className="mt-6"
            />
          ) : (
            <div className="mt-6 space-y-3">
              {videos.map((vid, index) => {
                const isBusy = busyId === vid.id;
                return (
                  <div
                    key={vid.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-border bg-surface-raised p-4 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <a
                        href={vid.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        dir="ltr"
                        className="block truncate font-mono text-accent-text hover:underline"
                      >
                        {vid.url}
                      </a>
                      <p className="mt-1 text-text-muted">
                        {vid.caption || <span className="italic">بدون تعليق</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        iconOnly
                        disabled={isSuspended || isBusy || index === 0}
                        onClick={() => handleReorder(vid.id, "up", false)}
                        className="h-8 w-8 min-h-[32px] min-w-[32px]"
                      >
                        <CaretUp className="h-3.5 w-3.5" weight="bold" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        iconOnly
                        disabled={
                          isSuspended || isBusy || index === videos.length - 1
                        }
                        onClick={() => handleReorder(vid.id, "down", false)}
                        className="h-8 w-8 min-h-[32px] min-w-[32px]"
                      >
                        <CaretDown className="h-3.5 w-3.5" weight="bold" />
                      </Button>
                      <Button
                        type="button"
                        variant="danger-outline"
                        size="sm"
                        disabled={isSuspended || isBusy}
                        onClick={() => handleDelete(vid.id, false)}
                      >
                        حذف
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
