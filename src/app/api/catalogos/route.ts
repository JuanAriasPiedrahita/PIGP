import { NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

/** Catálogos de solo lectura que alimentan los combos de los formularios de Líderes y Referidos. */
export async function GET() {
  try {
    const [zonas, puestos, comunas, barrios, profesiones, ocupaciones, parentescos, dependencias] = await Promise.all([
      pool.query<RowDataPacket[]>("SELECT id, codigo FROM zonas ORDER BY codigo ASC"),
      pool.query<RowDataPacket[]>("SELECT id, zona_id, numero, nombre, direccion, num_mesas FROM puestos ORDER BY numero ASC"),
      pool.query<RowDataPacket[]>("SELECT id, descripcion FROM comunas ORDER BY descripcion ASC"),
      pool.query<RowDataPacket[]>("SELECT id, comuna_id, nombre FROM barrios ORDER BY nombre ASC"),
      pool.query<RowDataPacket[]>("SELECT id, descripcion FROM profesiones ORDER BY descripcion ASC"),
      pool.query<RowDataPacket[]>("SELECT id, descripcion FROM ocupaciones ORDER BY descripcion ASC"),
      pool.query<RowDataPacket[]>("SELECT id, descripcion FROM parentescos ORDER BY descripcion ASC"),
      pool.query<RowDataPacket[]>("SELECT id, descripcion FROM dependencias ORDER BY descripcion ASC"),
    ]);

    return NextResponse.json({
      zonas: zonas[0],
      puestos: puestos[0],
      comunas: comunas[0],
      barrios: barrios[0],
      profesiones: profesiones[0],
      ocupaciones: ocupaciones[0],
      parentescos: parentescos[0],
      dependencias: dependencias[0],
    });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
