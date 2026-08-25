import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "lideres");
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/** Guarda un archivo de foto subido y devuelve la ruta pública relativa (para <img src>). */
export async function savePhoto(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Formato de imagen no soportado. Use JPG, PNG o WEBP.");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("La imagen supera el tamaño máximo permitido (5MB).");
  }
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/lideres/${filename}`;
}

/** Elimina una foto previamente guardada (best-effort, no lanza si ya no existe). */
export async function deletePhoto(publicPath: string | null | undefined): Promise<void> {
  if (!publicPath || !publicPath.startsWith("/uploads/lideres/")) return;
  try {
    await unlink(path.join(process.cwd(), "public", publicPath));
  } catch {
    // El archivo ya no existe o no se pudo borrar; no es crítico.
  }
}
