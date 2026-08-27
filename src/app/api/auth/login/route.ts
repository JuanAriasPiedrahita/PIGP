import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { createSessionToken, COOKIE_NAME, SESSION_HOURS } from "@/lib/session";

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

export async function POST(req: NextRequest) {
  try {
    const { usuario, clave } = await req.json();
    if (!usuario || !clave) {
      return NextResponse.json({ error: "Usuario y clave son obligatorios" }, { status: 400 });
    }

    const users = await loadUsers();
    if (users.size === 0) {
      return NextResponse.json(
        { error: "No hay usuarios configurados. Cree el archivo users.txt en la raíz del proyecto." },
        { status: 503 }
      );
    }

    const claveEsperada = users.get(String(usuario).trim());
    if (claveEsperada === undefined || claveEsperada !== clave) {
      return NextResponse.json({ error: "Usuario o clave incorrectos" }, { status: 401 });
    }

    const token = await createSessionToken(String(usuario).trim());
    const res = NextResponse.json({ ok: true, usuario: String(usuario).trim() });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_HOURS * 3600,
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Error interno al iniciar sesión" }, { status: 500 });
  }
}
