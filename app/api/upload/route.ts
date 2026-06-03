// File upload endpoint. Accepts a multipart form, validates the file, and
// stores it under /public/uploads so it is served statically at /uploads/<name>.
//
// Used for avatars, cover photos, and assignment attachments.

import { errorResponse, requireUser, HttpError } from "@/lib/auth-server";
import { writeFile, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { randomBytes } from "node:crypto";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

// SVG is intentionally excluded: it can contain embedded scripts.
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const DOC_TYPES = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const EXT_BY_TYPE: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
  "application/zip": ".zip",
  "application/x-zip-compressed": ".zip",
  "text/plain": ".txt",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

export async function POST(request: Request) {
  try {
    await requireUser();

    const form = await request.formData();
    const file = form.get("file");
    // "image" → only images allowed; "file" (default) → images + documents.
    const kind = (form.get("kind") as string) || "file";

    if (!(file instanceof File)) throw new HttpError(400, "No file was provided.");
    if (file.size === 0) throw new HttpError(400, "The file is empty.");

    const isImage = IMAGE_TYPES.includes(file.type);
    if (kind === "image" && !isImage) {
      throw new HttpError(400, "Please upload a PNG, JPG, WebP, or GIF image.");
    }
    if (!isImage && !DOC_TYPES.includes(file.type)) {
      throw new HttpError(400, "Unsupported file type. Allowed: images, PDF, Word, TXT, ZIP.");
    }

    const maxBytes = isImage ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
    if (file.size > maxBytes) {
      throw new HttpError(413, `File is too large. Maximum is ${Math.round(maxBytes / 1024 / 1024)} MB.`);
    }

    const ext = EXT_BY_TYPE[file.type] || extname(file.name).toLowerCase();
    const filename = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}${ext}`;
    const dir = join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), Buffer.from(await file.arrayBuffer()));

    return Response.json({
      url: `/uploads/${filename}`,
      name: file.name,
      size: file.size,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
