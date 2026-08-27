import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/session";

export async function GET(req: NextRequest) {
  const usuario = await verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
  if (!usuario) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  return NextResponse.json({ usuario });
}
