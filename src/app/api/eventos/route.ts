import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

/**
 * Listado de eventos en dos bloques:
 *   1. Próximos a ocurrir (fecha+hora >= ahora), del más cercano al más lejano.
 *   2. Ya realizados (fecha+hora < ahora), del más antiguo al más reciente —
 *      van inmediatamente después del bloque anterior.
 * El CASE agrupa (0 = próximo, 1 = realizado) y dentro de cada grupo se
 * ordena por la fecha+hora combinadas, ambas veces ascendente.
 */
const LIST_SQL = `
  SELECT
    e.*,
    (SELECT COUNT(*) FROM evento_asistentes a WHERE a.evento_id = e.id) AS total_asistentes
  FROM eventos e
  ORDER BY
    CASE WHEN TIMESTAMP(e.fecha, e.hora) >= NOW() THEN 0 ELSE 1 END,
    TIMESTAMP(e.fecha, e.hora) ASC
`;

export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(LIST_SQL);
    return NextResponse.json(rows);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nombre, ubicacion, fecha, hora } = await req.json();

    const errors: Record<string, string> = {};
    if (!String(nombre || "").trim()) errors.nombre = "El nombre es obligatorio";
    if (!String(ubicacion || "").trim()) errors.ubicacion = "La ubicación es obligatoria";
    if (!fecha) errors.fecha = "La fecha es obligatoria";
    if (!hora) errors.hora = "La hora es obligatoria";
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Datos inválidos", fields: errors }, { status: 400 });
    }

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO eventos (nombre, ubicacion, fecha, hora) VALUES (?, ?, ?, ?)",
      [String(nombre).trim(), String(ubicacion).trim(), fecha, hora]
    );
    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
