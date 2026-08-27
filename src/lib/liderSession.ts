// Sesión de login de "/captura" (líderes, autenticados contra la tabla lideres).
import { signJson, verifyJson } from "@/lib/crypto";

const LIDER_COOKIE_NAME = "pigp_lider_session";
const LIDER_SESSION_HOURS = 8;

export interface LiderSession {
  id: number;
  nombre: string;
}

interface LiderPayload extends LiderSession {
  exp: number;
}

export async function createLiderSessionToken(lider: LiderSession): Promise<string> {
  return signJson<LiderPayload>({ ...lider, exp: Date.now() + LIDER_SESSION_HOURS * 3600 * 1000 });
}

export async function verifyLiderSessionToken(token: string | undefined | null): Promise<LiderSession | null> {
  const payload = await verifyJson<LiderPayload>(token);
  if (!payload || typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
  if (typeof payload.id !== "number" || typeof payload.nombre !== "string") return null;
  return { id: payload.id, nombre: payload.nombre };
}

export { LIDER_COOKIE_NAME, LIDER_SESSION_HOURS };
