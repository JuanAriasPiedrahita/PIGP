import { NextRequest } from "next/server";
import { verifyLiderSessionToken, LIDER_COOKIE_NAME, type LiderSession } from "@/lib/liderSession";

/** Obtiene el líder autenticado a partir de la cookie de sesión de /captura. */
export async function requireLider(req: NextRequest): Promise<LiderSession | null> {
  return verifyLiderSessionToken(req.cookies.get(LIDER_COOKIE_NAME)?.value);
}

/**
 * Igual que requireLider, pero además exige que el líder sea "Coordinador
 * logística" (atributo de la tabla lideres). Devuelve null si no hay sesión
 * o si el líder no tiene ese atributo — en ambos casos el endpoint debe
 * responder con error (401/403 según corresponda).
 */
export async function requireCoordinadorLogistica(req: NextRequest): Promise<LiderSession | null> {
  const lider = await requireLider(req);
  if (!lider || !lider.coordinador_logistica) return null;
  return lider;
}
