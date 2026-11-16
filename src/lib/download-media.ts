import fs from "fs/promises";
import path from "path";

function getExtension(contentType: string, type: string | null): string {
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("png")) return "png";
  if (contentType.includes("gif")) return "gif";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("mp4")) return "mp4";
  if (contentType.includes("ogg") || contentType.includes("oga")) return "ogg";
  if (contentType.includes("mp3") || contentType.includes("mpeg")) return "mp3";
  if (contentType.includes("m4a") || contentType.includes("aac")) return "m4a";
  if (contentType.includes("pdf")) return "pdf";
  if (type === "audio") return "mp3";
  if (type === "video") return "mp4";
  if (type === "image") return "jpg";
  return "bin";
}

export async function downloadMedia(
  url: string,
  type: string | null,
  mid: string
): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; bot)",
        "Accept": "image/*,video/*,audio/*,*/*",
      },
    });

    if (!response.ok) {
      clearTimeout(timeoutId);
      console.error(`[media] HTTP ${response.status} for mid=${mid}`);
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    const ext = getExtension(contentType, type);

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "media");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeName = mid.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${safeName}.${ext}`;
    const filepath = path.join(uploadsDir, filename);

    const exists = await fs.access(filepath).then(() => true).catch(() => false);
    if (exists) {
      clearTimeout(timeoutId);
      return `/uploads/media/${filename}`;
    }

    const buffer = await response.arrayBuffer();
    clearTimeout(timeoutId);
    await fs.writeFile(filepath, Buffer.from(buffer));

    return `/uploads/media/${filename}`;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === "AbortError") {
      console.error(`[media] timeout (30s) for mid=${mid}`);
    } else {
      console.error(`[media] error for mid=${mid}:`, err?.message ?? err);
    }
    return null;
  }
}
