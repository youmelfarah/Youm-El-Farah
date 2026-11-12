"use client";

import type { SignedImageUploadPayload } from "@/lib/cloudinary";

export const CLIENT_MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

export function validateImageFileClient(file: File): string | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const mimeOk = file.type ? ALLOWED_MIME_TYPES.has(file.type.toLowerCase()) : false;
  const extOk = ALLOWED_EXTENSIONS.has(ext);

  if (!mimeOk && !extOk) {
    return "نوع الملف غير مدعوم. يُسمح فقط بصور JPG و PNG و WebP.";
  }

  if (file.type && !ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
    return "نوع الملف غير مدعوم. يُسمح فقط بصور JPG و PNG و WebP.";
  }

  if (file.size <= 0) {
    return "الملف فارغ أو تالف.";
  }

  if (file.size > CLIENT_MAX_IMAGE_SIZE_BYTES) {
    return "حجم الصورة يتجاوز الحد الأقصى المسموح به (5 ميجابايت).";
  }

  return null;
}

export function uploadFileDirectToCloudinary(
  file: File,
  signed: SignedImageUploadPayload,
  onProgress?: (percent: number) => void
): Promise<{ publicId: string }> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signed.apiKey);
    formData.append("timestamp", String(signed.timestamp));
    formData.append("signature", signed.signature);
    formData.append("folder", signed.folder);
    formData.append("allowed_formats", signed.allowedFormats);

    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(signed.cloudName)}/image/upload`
    );

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const pct = Math.min(100, Math.round((event.loaded / event.total) * 100));
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText) as {
          public_id?: string;
          error?: { message?: string };
        };
        if (xhr.status >= 200 && xhr.status < 300 && json.public_id) {
          onProgress?.(100);
          resolve({ publicId: json.public_id });
          return;
        }
        const rawMsg = json.error?.message ?? "";
        if (rawMsg.toLowerCase().includes("format")) {
          reject(new Error("صيغة الصورة غير مدعومة. يُسمح فقط بـ JPG و PNG و WebP."));
          return;
        }
        if (rawMsg.toLowerCase().includes("file size")) {
          reject(new Error("حجم الصورة يتجاوز الحد الأقصى المسموح به (5 ميجابايت)."));
          return;
        }
        reject(new Error("فشل رفع الصورة إلى Cloudinary. حاول مرة أخرى."));
      } catch {
        reject(new Error("استجابة غير متوقعة أثناء رفع الصورة."));
      }
    };

    xhr.onerror = () => {
      reject(new Error("تعذر الاتصال بخدمة رفع الصور. تحقق من الإنترنت."));
    };

    xhr.send(formData);
  });
}

