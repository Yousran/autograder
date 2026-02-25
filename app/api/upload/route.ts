import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getLocale, getTranslations } from "next-intl/server";
import { requireAuth } from "@/lib/dal";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

// POST /api/upload
// Uploads an image file to Cloudinary. Requires authentication.
// Body: multipart/form-data — fields: file (image), folder (optional, default: "portal-berita")
// Allowed types: JPG, PNG, GIF, WebP. Max size: 2 MB.
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

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: t("unsupportedFormat") },
        { status: 400 },
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: t("fileTooLarge") }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: "image",
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch {
    return NextResponse.json({ error: t("uploadFailed") }, { status: 500 });
  }
}
