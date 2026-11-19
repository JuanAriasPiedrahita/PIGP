import { NextRequest, NextResponse } from "next/server";
import { decryptClave } from "@/lib/liderClave";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { createLiderSessionToken, LIDER_COOKIE_NAME, LIDER_SESSION_HOURS } from "@/lib/liderSession";
import { cookieSecure } from "@/lib/crypto";
import { getClientIp, logAccess } from "@/lib/accessLog";

export async function POST(req: NextRequest) {
  try {
    const { usuario, clave } = await req.json();
    if (!usuario || !clave) {
      return NextResponse.json({ error: "Usuario y clave son obligatorios" }, { status: 400 });
    }
    const usuarioTrim = String(usuario).trim();
    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "desconocido";

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, nombre, apellidos, clave, coordinador_logistica FROM lideres WHERE usuario = ?",
      [usuarioTrim]
    );

    if (rows.length === 0) {
      await logAccess({ usuario: usuarioTrim, ip, userAgent, resultado: "FALLIDO" });
      return NextResponse.json({ error: "Usuario o clave incorrectos" }, { status: 401 });
    }

    const lider = rows[0];
    const claveGuardada = decryptClave(lider.clave);
    if (claveGuardada === null || claveGuardada !== clave) {
      // El líder no existe, no tiene clave asignada, o la clave no coincide.
      await logAccess({ usuario: usuarioTrim, ip, userAgent, resultado: "FALLIDO" });
      return NextResponse.json({ error: "Usuario o clave incorrectos" }, { status: 401 });
    }
    await logAccess({ usuario: usuarioTrim, ip, userAgent, resultado: "OK" });

    const nombreCompleto = `${lider.nombre} ${lider.apellidos}`;
    const token = await createLiderSessionToken({
      id: lider.id,
      nombre: nombreCompleto,
      coordinador_logistica: !!lider.coordinador_logistica,
    });
    const res = NextResponse.json({ ok: true, nombre: nombreCompleto });
    res.cookies.set(LIDER_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: cookieSecure(),
      path: "/",
      maxAge: LIDER_SESSION_HOURS * 3600,
    });
    return res;
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
