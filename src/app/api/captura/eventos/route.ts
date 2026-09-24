import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { requireLider } from "@/lib/requireLider";

/**
 * Listado de eventos para líderes en /captura: mismo orden que la vista de
 * administración (próximos primero, del más cercano al más lejano; luego
 * los ya realizados, del más antiguo al más reciente), pero **de solo
 * lectura** — no hay POST/PUT/DELETE en este endpoint, los líderes solo
 * consultan la agenda de eventos.
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

export async function GET(req: NextRequest) {
  const lider = await requireLider(req);
  if (!lider) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const [rows] = await pool.query<RowDataPacket[]>(LIST_SQL);
    return NextResponse.json(rows);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
