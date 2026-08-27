// Cifrado reversible de la clave del líder (AES-256-GCM), para que un
// administrador pueda ver la clave actual desde el formulario de edición
// (p. ej. si el líder la olvidó) sin tener que asignarle una nueva.
//
// A diferencia de bcrypt (usado antes), esto SÍ se puede desencriptar — es una
// decisión consciente de seguridad más baja a cambio de esa funcionalidad,
// igual que ya hace este proyecto con las claves en texto plano de users.txt.
//
// Solo se usa en rutas de API (runtime Node.js), no en el middleware (Edge).
import crypto from "crypto";

function getKey(): Buffer {
  const secret = process.env.AUTH_SECRET || "pigp-dev-secret-cambiar-en-produccion";
  return crypto.createHash("sha256").update(`lider-clave:${secret}`).digest();
}

/** Cifra la clave en texto plano. Formato de salida: "iv:tag:ciphertext" (cada parte en base64). */
export function encryptClave(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(":");
}

/**
 * Descifra la clave del líder. Devuelve null si el valor está vacío, no tiene
 * el formato esperado, o no se pudo descifrar — esto último cubre líderes
 * creados antes de este cambio, cuya clave quedó guardada con bcrypt (hay que
 * asignarles una clave nueva desde el formulario, ya no se puede recuperar la vieja).
 */
export function decryptClave(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const parts = stored.split(":");
  if (parts.length !== 3) return null;
  try {
    const [ivB64, tagB64, dataB64] = parts;
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const plain = Buffer.concat([decipher.update(Buffer.from(dataB64, "base64")), decipher.final()]);
    return plain.toString("utf8");
  } catch {
    return null;
  }
}
