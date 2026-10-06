// Sesión de login de "/captura" (líderes, autenticados contra la tabla lideres).
import { signJson, verifyJson } from "@/lib/crypto";

const LIDER_COOKIE_NAME = "pigp_lider_session";
const LIDER_SESSION_HOURS = 8;

export interface LiderSession {
  id: number;
  nombre: string;
  coordinador_logistica: boolean;
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
  // Sesiones firmadas antes de agregar este campo no lo traen: se tratan como no-coordinador
  // hasta que el líder vuelva a iniciar sesión (el token expira solo, máx. 8 horas).
  return { id: payload.id, nombre: payload.nombre, coordinador_logistica: !!payload.coordinador_logistica };
}

export { LIDER_COOKIE_NAME, LIDER_SESSION_HOURS };
