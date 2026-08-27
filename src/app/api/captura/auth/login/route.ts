import { NextRequest, NextResponse } from "next/server";
import { decryptClave } from "@/lib/liderClave";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { createLiderSessionToken, LIDER_COOKIE_NAME, LIDER_SESSION_HOURS } from "@/lib/liderSession";

export async function POST(req: NextRequest) {
  try {
    const { usuario, clave } = await req.json();
    if (!usuario || !clave) {
      return NextResponse.json({ error: "Usuario y clave son obligatorios" }, { status: 400 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, nombre, apellidos, clave FROM lideres WHERE usuario = ?",
      [String(usuario).trim()]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Usuario o clave incorrectos" }, { status: 401 });
    }

    const lider = rows[0];
    const claveGuardada = decryptClave(lider.clave);
    if (claveGuardada === null || claveGuardada !== clave) {
      // El líder no existe, no tiene clave asignada, o la clave no coincide.
      return NextResponse.json({ error: "Usuario o clave incorrectos" }, { status: 401 });
    }

    const nombreCompleto = `${lider.nombre} ${lider.apellidos}`;
    const token = await createLiderSessionToken({ id: lider.id, nombre: nombreCompleto });
    const res = NextResponse.json({ ok: true, nombre: nombreCompleto });
    res.cookies.set(LIDER_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: LIDER_SESSION_HOURS * 3600,
    });
    return res;
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
