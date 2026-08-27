import { NextResponse } from "next/server";
import { LIDER_COOKIE_NAME } from "@/lib/liderSession";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(LIDER_COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
