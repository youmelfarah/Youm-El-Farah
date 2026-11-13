import { v2 as cloudinary } from "cloudinary";

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp"] as const;

const isDev = process.env.NODE_ENV === "development";

interface CloudinaryEnvConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

function getCloudinaryEnv(): CloudinaryEnvConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("إعدادات Cloudinary غير مكتملة على الخادم");
  }

  return { cloudName, apiKey, apiSecret };
}

function getConfiguredCloudinary() {
  const env = getCloudinaryEnv();
  cloudinary.config({
    cloud_name: env.cloudName,
    api_key: env.apiKey,
    api_secret: env.apiSecret,
    secure: true,
  });
  return { cloudinary, env };
}

export function getProviderCloudinaryFolder(providerId: string): string {
  return `yom-el-farah/providers/${providerId}`;
}

export interface SignedImageUploadPayload {
  signature: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  maxFileSizeBytes: number;
  cloudName: string;
  apiKey: string;
}

/**
 * Generates a short-lived signed upload payload scoped to the provider's folder.
 * The API secret is never returned to the client.
 *
 * Only `timestamp` and `folder` are signed and sent to Cloudinary.
 * `allowed_formats` is enforced server-side during verification, not in the
 * signature — Cloudinary rejects the upload with "Invalid Signature" when
 * `allowed_formats` is part of the signature but sent as a simple form field.
 */
export function createSignedImageUploadPayload(
  providerId: string
): SignedImageUploadPayload {
  const { cloudinary: cld, env } = getConfiguredCloudinary();
  const timestamp = Math.round(Date.now() / 1000);
  const folder = getProviderCloudinaryFolder(providerId);
  const allowedFormats = ALLOWED_IMAGE_FORMATS.join(",");

  // Sign only the parameters that the client will send to Cloudinary's
  // upload endpoint.  `allowed_formats` is NOT sent by the client so it
  // must NOT appear in the signature.
  const signature = cld.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    env.apiSecret
  );

  return {
    signature,
    timestamp,
    folder,
    allowedFormats,
    maxFileSizeBytes: MAX_IMAGE_SIZE_BYTES,
    cloudName: env.cloudName,
    apiKey: env.apiKey,
  };
}

interface CloudinaryResourceResponse {
  public_id?: string;
  asset_folder?: string;
  resource_type?: string;
  type?: string;
  format?: string;
  bytes?: number;
  secure_url?: string;
}

/**
 * Verifies with Cloudinary Admin API that the uploaded asset exists,
 * belongs to this provider's folder, is an allowed image format, and is <= 5 MB.
 */
export async function verifyUploadedProviderImage(
  providerId: string,
  publicId: string
): Promise<{ publicId: string; secureUrl: string }> {
  const { cloudinary: cld } = getConfiguredCloudinary();
  const expectedFolder = getProviderCloudinaryFolder(providerId);

  let resource: CloudinaryResourceResponse;
  try {
    resource = (await cld.api.resource(publicId, {
      resource_type: "image",
    })) as CloudinaryResourceResponse;
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    if (isDev) {
      console.error("[Cloudinary verify error]", detail);
    }
    throw new Error(
      isDev
        ? `تعذر التحقق من الصورة المرفوعة على Cloudinary\n[dev] ${detail}`
        : "تعذر التحقق من الصورة المرفوعة على Cloudinary"
    );
  }

  const actualPublicId = resource.public_id ?? "";
  const inProviderFolder =
    resource.asset_folder === expectedFolder ||
    actualPublicId.startsWith(`${expectedFolder}/`);

  if (!inProviderFolder) {
    throw new Error("الصورة لا تنتمي إلى مجلد مقدم الخدمة المصرح به");
  }

  const format = String(resource.format ?? "").toLowerCase();
  const isAllowedFormat = (
    ALLOWED_IMAGE_FORMATS as readonly string[]
  ).includes(format);

  if (
    resource.resource_type !== "image" ||
    resource.type !== "upload" ||
    !isAllowedFormat
  ) {
    await cld.uploader
      .destroy(actualPublicId, { resource_type: "image", invalidate: true })
      .catch(() => undefined);
    throw new Error("صيغة الملف غير مسموح بها. يُسمح فقط بصور JPG و PNG و WebP");
  }

  if (
    typeof resource.bytes !== "number" ||
    resource.bytes <= 0 ||
    resource.bytes > MAX_IMAGE_SIZE_BYTES
  ) {
    await cld.uploader
      .destroy(actualPublicId, { resource_type: "image", invalidate: true })
      .catch(() => undefined);
    throw new Error("حجم الصورة يتجاوز الحد الأقصى المسموح به (5 ميجابايت)");
  }

  if (
    typeof resource.secure_url !== "string" ||
    !resource.secure_url.startsWith("https://")
  ) {
    throw new Error("لم يتم استلام رابط آمن للصورة من Cloudinary");
  }

  return {
    publicId: actualPublicId,
    secureUrl: resource.secure_url,
  };
}

/**
 * Deletes an image asset from Cloudinary. Ignores "not_found" so missing remote
 * assets do not permanently block DB cleanup, while rejecting real API errors.
 */
export async function destroyCloudinaryImage(publicId: string): Promise<void> {
  const { cloudinary: cld } = getConfiguredCloudinary();
  const res = (await cld.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  })) as { result?: string };

  if (res.result !== "ok" && res.result !== "not_found") {
    throw new Error("تعذر حذف الصورة من Cloudinary");
  }
}

