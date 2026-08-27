import { NextRequest } from "next/server";
import { verifyLiderSessionToken, LIDER_COOKIE_NAME, type LiderSession } from "@/lib/liderSession";

/** Obtiene el líder autenticado a partir de la cookie de sesión de /captura. */
export async function requireLider(req: NextRequest): Promise<LiderSession | null> {
  return verifyLiderSessionToken(req.cookies.get(LIDER_COOKIE_NAME)?.value);
}
