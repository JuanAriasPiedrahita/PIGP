// Sesión de login del panel de administración (usuarios de users.txt).
import { signJson, verifyJson } from "@/lib/crypto";

const COOKIE_NAME = "pigp_session";
const SESSION_HOURS = 8;

interface AdminPayload {
  u: string;
  exp: number;
}

export async function createSessionToken(username: string): Promise<string> {
  return signJson<AdminPayload>({ u: username, exp: Date.now() + SESSION_HOURS * 3600 * 1000 });
}

export async function verifySessionToken(token: string | undefined | null): Promise<string | null> {
  const payload = await verifyJson<AdminPayload>(token);
  if (!payload || typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
  return typeof payload.u === "string" ? payload.u : null;
}

export { COOKIE_NAME, SESSION_HOURS };
