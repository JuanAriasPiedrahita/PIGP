import { NextRequest, NextResponse } from "next/server";
import { verifyLiderSessionToken, LIDER_COOKIE_NAME } from "@/lib/liderSession";

export async function GET(req: NextRequest) {
  const lider = await verifyLiderSessionToken(req.cookies.get(LIDER_COOKIE_NAME)?.value);
  if (!lider) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  return NextResponse.json(lider);
}
