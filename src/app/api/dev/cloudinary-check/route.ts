import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const hasCloudName = Boolean(process.env.CLOUDINARY_CLOUD_NAME?.trim());
  const hasApiKey = Boolean(process.env.CLOUDINARY_API_KEY?.trim());
  const hasApiSecret = Boolean(process.env.CLOUDINARY_API_SECRET?.trim());

  const envStatus = {
    CLOUDINARY_CLOUD_NAME: hasCloudName ? "yes" : "no",
    CLOUDINARY_API_KEY: hasApiKey ? "yes" : "no",
    CLOUDINARY_API_SECRET: hasApiSecret ? "yes" : "no",
  };

  if (!hasCloudName || !hasApiKey || !hasApiSecret) {
    return NextResponse.json({
      env: envStatus,
      ping: "skipped — missing env vars",
    });
  }

  try {
    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!.trim(),
      api_key: process.env.CLOUDINARY_API_KEY!.trim(),
      api_secret: process.env.CLOUDINARY_API_SECRET!.trim(),
      secure: true,
    });
    const result = await cloudinary.api.ping();
    return NextResponse.json({
      env: envStatus,
      ping: result?.status === "ok" ? "ok" : JSON.stringify(result),
    });
  } catch (err: unknown) {
    let message: string;
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "object" && err !== null) {
      // Cloudinary SDK errors are plain objects with error.message
      const obj = err as Record<string, unknown>;
      const inner = obj.error as Record<string, unknown> | undefined;
      message = typeof inner?.message === "string"
        ? inner.message
        : "Unknown Cloudinary error";
    } else {
      message = String(err);
    }
    return NextResponse.json({
      env: envStatus,
      ping: `error: ${message}`,
    });
  }
}
