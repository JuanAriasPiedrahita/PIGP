import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { decryptClave } from "@/lib/liderClave";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { createSessionToken, COOKIE_NAME, SESSION_HOURS } from "@/lib/session";
import { createLiderSessionToken, LIDER_COOKIE_NAME, LIDER_SESSION_HOURS } from "@/lib/liderSession";

const USERS_FILE = path.join(process.cwd(), "users.txt");

/** Lee users.txt y devuelve un mapa usuario -> contraseña. Líneas vacías o con # se ignoran. */
async function loadUsers(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let content: string;
  try {
    content = await readFile(USERS_FILE, "utf-8");
  } catch {
    return map;
  }
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const usuario = line.slice(0, idx).trim();
    const clave = line.slice(idx + 1);
    if (usuario) map.set(usuario, clave);
  }
  return map;
}

/**
 * Login unificado: primero se valida contra users.txt (acceso total al panel de
 * administración). Si el usuario no aparece ahí, se busca como líder en la base
 * de datos; si coincide, se abre su sesión de /captura y se le indica al cliente
 * que debe redirigir para allá en vez de al panel de administración.
 */
export async function POST(req: NextRequest) {
  try {
    const { usuario, clave } = await req.json();
    if (!usuario || !clave) {
      return NextResponse.json({ error: "Usuario y clave son obligatorios" }, { status: 400 });
    }
    const usuarioTrim = String(usuario).trim();

    // 1) ¿Usuario del panel de administración (users.txt)?
    const users = await loadUsers();
    const claveEsperada = users.get(usuarioTrim);
    if (claveEsperada !== undefined) {
      if (claveEsperada !== clave) {
        return NextResponse.json({ error: "Usuario o clave incorrectos" }, { status: 401 });
      }
      const token = await createSessionToken(usuarioTrim);
      const res = NextResponse.json({ ok: true, tipo: "admin", usuario: usuarioTrim, redirect: "/" });
      res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_HOURS * 3600,
      });
      return res;
    }

    // 2) No está en users.txt: ¿es un líder registrado en la base de datos?
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, nombre, apellidos, clave FROM lideres WHERE usuario = ?",
      [usuarioTrim]
    );
    const lider = rows[0];
    const claveGuardada = lider ? decryptClave(lider.clave) : null;
    const ok = claveGuardada !== null && claveGuardada === clave;
    if (!lider || !ok) {
      return NextResponse.json({ error: "Usuario o clave incorrectos" }, { status: 401 });
    }

    const nombreCompleto = `${lider.nombre} ${lider.apellidos}`;
    const token = await createLiderSessionToken({ id: lider.id, nombre: nombreCompleto });
    const res = NextResponse.json({ ok: true, tipo: "lider", nombre: nombreCompleto, redirect: "/captura" });
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
