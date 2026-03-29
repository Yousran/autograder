import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getLocale, getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/dal";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Allowed MIME types and their corresponding Cloudinary resource types */
const MIME_TO_RESOURCE_TYPE: Record<
  string,
  "image" | "video" | "raw" | "auto"
> = {
  // Images
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/webp": "image",
  "image/svg+xml": "image",
  // Videos
  "video/mp4": "video",
  "video/webm": "video",
  "video/ogg": "video",
  "video/quicktime": "video",
  "video/avi": "video",
  // Audio
  "audio/mpeg": "video", // Cloudinary uses "video" for audio too
  "audio/mp4": "video",
  "audio/ogg": "video",
  "audio/wav": "video",
  "audio/webm": "video",
  "audio/flac": "video",
  // Documents / files
  "application/pdf": "raw",
  "application/msword": "raw",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "raw",
  "text/plain": "raw",
  "text/csv": "raw",
};

const MAX_SIZE_BY_TYPE: Record<string, number> = {
  image: 4 * 1024 * 1024, // 4 MB
  video: 64 * 1024 * 1024, // 64 MB
  audio: 16 * 1024 * 1024, // 16 MB (mapped to video resource type)
  raw: 8 * 1024 * 1024, // 8 MB
};

/**
 * Determines the Cloudinary resource type for a given MIME type.
 * Uses exact matches first, then falls back to prefix matching.
 * Audio files are mapped to "video" resource type in Cloudinary.
 *
 * @param mimeType - The MIME type string (e.g., "image/jpeg", "video/mp4")
 * @returns The Cloudinary resource type: "image" | "video" | "raw" | "auto", or null if unsupported
 */
function getResourceType(
  mimeType: string,
): "image" | "video" | "raw" | "auto" | null {
  // Exact match
  if (mimeType in MIME_TO_RESOURCE_TYPE) {
    return MIME_TO_RESOURCE_TYPE[mimeType];
  }
  // Broad match
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "video";
  return null;
}

/**
 * POST /api/upload
 * Uploads a file to Cloudinary (authenticated user only).
 * Supports: images (≤4MB), videos (≤64MB), audio (≤16MB), PDFs/documents (≤8MB).
 * Automatically determines resource type and applies size limits.
 *
 * @param req - The Next.js request with multipart/form-data body
 *   - file: File (required)
 *   - folder: string (optional, default: "autograder")
 * @returns 200 with { secure_url: string }, or 400/401/413/500 on error
 */
export async function POST(req: NextRequest) {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Api.upload" });

  try {
    const authResult = await requireAuth();
    if (!authResult.ok) return authResult.response;

    const formData = await req.formData();
    const file = formData.get("file");
    const folder = (formData.get("folder") as string | null) ?? "autograder";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: t("invalidFile") }, { status: 400 });
    }

    const resourceType = getResourceType(file.type);

    if (!resourceType) {
      return NextResponse.json(
        { error: t("unsupportedFormat") },
        { status: 400 },
      );
    }

    // Determine size limit based on resource type
    let categoryKey = "raw";
    if (file.type.startsWith("image/")) categoryKey = "image";
    else if (file.type.startsWith("video/")) categoryKey = "video";
    else if (file.type.startsWith("audio/")) categoryKey = "audio";

    const maxSize = MAX_SIZE_BY_TYPE[categoryKey] ?? MAX_SIZE_BY_TYPE.raw;

    if (file.size > maxSize) {
      return NextResponse.json({ error: t("fileTooLarge") }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: resourceType,
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch {
    return NextResponse.json({ error: t("uploadFailed") }, { status: 500 });
  }
}
