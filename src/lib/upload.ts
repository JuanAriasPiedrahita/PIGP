import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/** Guarda un archivo de imagen bajo public/uploads/<subdir>/ y devuelve la ruta pública relativa. */
export async function saveImage(file: File, subdir: "lideres" | "gestiones"): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Formato de imagen no soportado. Use JPG, PNG o WEBP.");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("La imagen supera el tamaño máximo permitido (5MB).");
  }
  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${subdir}/${filename}`;
}

/** Elimina una imagen previamente guardada (best-effort, no lanza si ya no existe). */
export async function deleteImage(publicPath: string | null | undefined): Promise<void> {
  if (!publicPath || !publicPath.startsWith("/uploads/")) return;
  try {
    await unlink(path.join(process.cwd(), "public", publicPath));
  } catch {
    // El archivo ya no existe o no se pudo borrar; no es crítico.
  }
}

/** @deprecated usar saveImage(file, "lideres") */
export async function savePhoto(file: File): Promise<string> {
  return saveImage(file, "lideres");
}

/** @deprecated usar deleteImage */
export async function deletePhoto(publicPath: string | null | undefined): Promise<void> {
  return deleteImage(publicPath);
}
