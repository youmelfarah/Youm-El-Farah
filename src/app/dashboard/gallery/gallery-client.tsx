"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
    setPendingUploads(batch);

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const localId = batch[i].localId;
      const previewUrl = batch[i].previewUrl;

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
        const message =
          err instanceof Error ? err.message : "فشل رفع الصورة";
        setPendingUploads((prev) =>
          prev.map((item) =>
            item.localId === localId
              ? { ...item, status: "error", error: message }
              : item
          )
        );
      } finally {
        URL.revokeObjectURL(previewUrl);
      }
    }

    router.refresh();
    setPendingUploads((prev) => prev.filter((item) => item.status === "error"));
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSuspended || videoAtLimit) return;

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
    if (
      !confirm(
        isImage
          ? "هل أنت متأكد من حذف هذه الصورة؟"
          : "هل أنت متأكد من حذف هذا الفيديو؟"
      )
    ) {
      return;
    }

    setBusyId(mediaId);
    setImageError("");
    setVideoError("");
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
    <div className="space-y-6">
      {/* Images Section */}
      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900">معرض الصور</h1>
            <p className="mt-0.5 text-sm font-medium text-gray-600">
              استخدمت {images.length} من {imageLimit}
            </p>
          </div>

          <label
            className={`inline-flex cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 ${
              imageAtLimit || isSuspended || isUploading
                ? "pointer-events-none opacity-50"
                : ""
            }`}
          >
            <span>{isUploading ? "جارٍ الرفع..." : "رفع صور"}</span>
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

        <p className="text-xs text-gray-500">
          يُسمح برفع صور JPG أو PNG أو WebP بحد أقصى 5 ميجابايت للصورة الواحدة.
        </p>

        {imageAtLimit && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
            لقد وصلت إلى الحد الأقصى للصور المسموح بها ({imageLimit}). احذف صورة حالية لإضافة صور جديدة.
          </div>
        )}

        {imageError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {imageError}
          </div>
        )}

        {pendingUploads.length > 0 && (
          <div className="space-y-2">
            {pendingUploads.map((item) => (
              <div
                key={item.localId}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-2.5"
              >
                {/* Local blob preview */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.previewUrl}
                  alt={item.fileName}
                  className="h-12 w-12 shrink-0 rounded object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-800">
                    {item.fileName}
                  </p>
                  {item.status === "error" ? (
                    <p className="text-xs text-red-600">{item.error}</p>
                  ) : (
                    <>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="h-full bg-blue-600 transition-all"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-500">
                        {item.status === "saving"
                          ? "جارٍ التحقق والحفظ..."
                          : `${item.progress}%`}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {images.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            لا توجد صور في المعرض بعد.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  className="overflow-hidden rounded-lg border border-gray-200 bg-white"
                >
                  <div className="relative aspect-[4/3] w-full bg-gray-100">
                    <Image
                      src={src}
                      alt={img.caption || "صورة من المعرض"}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-2 p-3">
                    {isEditingCaption && !isSuspended ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          maxLength={120}
                          value={captionDraft}
                          onChange={(e) => setCaptionDraft(e.target.value)}
                          placeholder="وصف مختصر (اختياري، 120 حرف)"
                          className="block w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleSaveCaption(img.id, true)}
                            className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white"
                          >
                            حفظ
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCaptionId(null)}
                            className="rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-700"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="min-h-[1.25rem] text-xs text-gray-700">
                        {img.caption || (
                          <span className="text-gray-400">بدون تعليق</span>
                        )}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          disabled={isSuspended || isBusy || index === 0}
                          onClick={() => handleReorder(img.id, "up", true)}
                          aria-label="تحريك لأعلى"
                          className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={
                            isSuspended || isBusy || index === images.length - 1
                          }
                          onClick={() => handleReorder(img.id, "down", true)}
                          aria-label="تحريك لأسفل"
                          className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
                        >
                          ↓
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={isSuspended || isBusy}
                          onClick={() => {
                            setEditingCaptionId(img.id);
                            setCaptionDraft(img.caption ?? "");
                          }}
                          className="rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          التعليق
                        </button>
                        <button
                          type="button"
                          disabled={isSuspended || isBusy}
                          onClick={() => handleDelete(img.id, true)}
                          className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Videos Section */}
      <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900">روابط الفيديو</h2>
          <p className="mt-0.5 text-sm font-medium text-gray-600">
            استخدمت {videos.length} من {videoLimit}
          </p>
        </div>

        {videoAtLimit && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
            لقد وصلت إلى الحد الأقصى للفيديوهات المسموح بها ({videoLimit}). احذف فيديو حالياً لإضافة رابط جديد.
          </div>
        )}

        <form onSubmit={handleAddVideo} className="space-y-3">
          <div>
            <label
              htmlFor="video-url"
              className="block text-sm font-medium text-gray-700"
            >
              رابط الفيديو (YouTube أو Facebook أو Instagram)
            </label>
            <input
              id="video-url"
              type="url"
              required
              disabled={videoAtLimit || isSuspended}
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              dir="ltr"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="video-caption"
              className="block text-sm font-medium text-gray-700"
            >
              تعليق على الفيديو (اختياري)
            </label>
            <input
              id="video-caption"
              type="text"
              maxLength={120}
              disabled={videoAtLimit || isSuspended}
              value={videoCaption}
              onChange={(e) => setVideoCaption(e.target.value)}
              placeholder="وصف مختصر للفيديو (حتى 120 حرفاً)"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
            />
          </div>

          {videoError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {videoError}
            </div>
          )}

          <button
            type="submit"
            disabled={addingVideo || videoAtLimit || isSuspended}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addingVideo ? "جارٍ الإضافة..." : "إضافة فيديو"}
          </button>
        </form>

        {videos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            لا توجد فيديوهات مضافة بعد.
          </div>
        ) : (
          <div className="space-y-2">
            {videos.map((vid, index) => {
              const isBusy = busyId === vid.id;
              const isEditingCaption = editingCaptionId === vid.id;
              return (
                <div
                  key={vid.id}
                  className="rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <a
                        href={vid.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        dir="ltr"
                        className="block truncate text-sm font-medium text-blue-600 hover:underline"
                      >
                        {vid.url}
                      </a>
                      {isEditingCaption && !isSuspended ? (
                        <div className="mt-2 space-y-2">
                          <input
                            type="text"
                            maxLength={120}
                            value={captionDraft}
                            onChange={(e) => setCaptionDraft(e.target.value)}
                            className="block w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleSaveCaption(vid.id, false)}
                              className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white"
                            >
                              حفظ
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCaptionId(null)}
                              className="rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-700"
                            >
                              إلغاء
                            </button>
                          </div>
                        </div>
                      ) : (
                        vid.caption && (
                          <p className="mt-1 text-xs text-gray-700">
                            {vid.caption}
                          </p>
                        )
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={isSuspended || isBusy || index === 0}
                        onClick={() => handleReorder(vid.id, "up", false)}
                        aria-label="تحريك لأعلى"
                        className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        disabled={
                          isSuspended || isBusy || index === videos.length - 1
                        }
                        onClick={() => handleReorder(vid.id, "down", false)}
                        aria-label="تحريك لأسفل"
                        className="rounded border border-gray-300 px-2 py-1 text-xs disabled:opacity-40"
                      >
                        ↓
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex gap-2 border-t border-gray-100 pt-2">
                    <button
                      type="button"
                      disabled={isSuspended || isBusy}
                      onClick={() => {
                        setEditingCaptionId(vid.id);
                        setCaptionDraft(vid.caption ?? "");
                      }}
                      className="rounded border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      تعديل التعليق
                    </button>
                    <button
                      type="button"
                      disabled={isSuspended || isBusy}
                      onClick={() => handleDelete(vid.id, false)}
                      className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

