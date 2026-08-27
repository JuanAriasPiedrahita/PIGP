import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { requireLider } from "@/lib/requireLider";

/** Catálogos de solo lectura que necesita el formulario de referidos en /captura. */
export async function GET(req: NextRequest) {
  const lider = await requireLider(req);
  if (!lider) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const [zonas, puestos, comunas, barrios, parentescos] = await Promise.all([
      pool.query<RowDataPacket[]>("SELECT id, codigo FROM zonas ORDER BY codigo ASC"),
      pool.query<RowDataPacket[]>("SELECT id, zona_id, numero, nombre, direccion, num_mesas FROM puestos ORDER BY numero ASC"),
      pool.query<RowDataPacket[]>("SELECT id, descripcion FROM comunas ORDER BY descripcion ASC"),
      pool.query<RowDataPacket[]>("SELECT id, comuna_id, nombre FROM barrios ORDER BY nombre ASC"),
      pool.query<RowDataPacket[]>("SELECT id, descripcion FROM parentescos ORDER BY descripcion ASC"),
    ]);

    return NextResponse.json({
      zonas: zonas[0],
      puestos: puestos[0],
      comunas: comunas[0],
      barrios: barrios[0],
      parentescos: parentescos[0],
    });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
