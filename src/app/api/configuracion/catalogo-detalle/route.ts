import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

type Tipo = "profesion" | "ocupacion" | "parentesco" | "dependencia";

const QUERIES: Record<Tipo, string> = {
  profesion: `SELECT id, nombre, apellidos, cedula, celular FROM lideres WHERE profesion_id = ? ORDER BY nombre ASC`,
  ocupacion: `SELECT id, nombre, apellidos, cedula, celular FROM lideres WHERE ocupacion_id = ? ORDER BY nombre ASC`,
  parentesco: `SELECT id, nombre, apellidos, cedula, celular FROM referidos WHERE parentesco_id = ? ORDER BY nombre ASC`,
  dependencia: `SELECT id, nombre, apellidos, cedula, celular FROM lideres WHERE dependencia_id = ? AND contratista = 1 ORDER BY nombre ASC`,
};

/**
 * Detalle (reloj) de Configuración → Profesiones/Ocupaciones/Parentescos/
 * Dependencias: la lista de personas detrás del total que ya se ve en esas
 * pestañas (líderes para profesión/ocupación/dependencia —esta última solo
 * contratistas—, referidos para parentesco).
 */
export async function GET(req: NextRequest) {
  const tipo = req.nextUrl.searchParams.get("tipo") as Tipo | null;
  const id = req.nextUrl.searchParams.get("id");

  if (!tipo || !(tipo in QUERIES) || !id) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(QUERIES[tipo], [id]);
    return NextResponse.json(rows);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
