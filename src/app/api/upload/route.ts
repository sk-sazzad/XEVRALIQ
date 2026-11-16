import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getAuthToken } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  const token = await getAuthToken(request);
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const maxSize = 25 * 1024 * 1024; // 25 MB
  if (file.size > maxSize) return NextResponse.json({ error: "File too large (max 25 MB)" }, { status: 400 });

  // Maps allowed MIME types to their saved extension — SVG excluded (XSS risk when served same-origin)
  const MIME_EXT: Record<string, string> = {
    "image/jpeg": "jpg", "image/jpg": "jpg", "image/png": "png",
    "image/webp": "webp", "image/gif": "gif", "image/avif": "avif",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "text/plain": "txt", "text/csv": "csv",
    "application/zip": "zip", "application/x-zip-compressed": "zip",
    "application/x-rar-compressed": "rar", "application/vnd.rar": "rar",
    "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/wav": "wav",
    "audio/ogg": "ogg", "audio/mp4": "m4a",
    "video/mp4": "mp4", "video/webm": "webm",
    "video/quicktime": "mov", "video/x-msvideo": "avi",
  };
  // shortcut: trusts browser-supplied MIME type, not file magic bytes; acceptable for internal team use
  if (!MIME_EXT[file.type]) {
    return NextResponse.json({ error: `এই ধরনের ফাইল সাপোর্টেড নয় (${file.type})` }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const ext = MIME_EXT[file.type];
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const filepath = path.join(uploadDir, filename);
  await writeFile(filepath, buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
