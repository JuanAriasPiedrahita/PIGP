import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

/**
 * Resumen de gestiones de una comuna o un barrio, agrupado por tipo de ayuda:
 * cuántas están resueltas, pendientes, vencidas (subconjunto de pendientes
 * cuya fecha límite ya pasó — igual convención que el resto del módulo de
 * Gestiones) y no viables. Ordenado por resueltas descendente.
 */
export async function GET(req: NextRequest) {
  try {
    const comunaId = req.nextUrl.searchParams.get("comuna_id");
    const barrioId = req.nextUrl.searchParams.get("barrio_id");
    if (!comunaId && !barrioId) {
      return NextResponse.json({ error: "Falta comuna_id o barrio_id" }, { status: 400 });
    }

    const sql = `
      SELECT
        ta.id AS tipo_ayuda_id,
        ta.descripcion AS tipo_ayuda_descripcion,
        SUM(g.estado = 'RESUELTO') AS resueltas,
        SUM(g.estado = 'PENDIENTE') AS pendientes,
        SUM(g.estado = 'PENDIENTE' AND g.fecha_limite < CURDATE()) AS vencidas,
        SUM(g.estado = 'NO_VIABLE') AS no_viables
      FROM gestiones g
      JOIN referidos r ON r.id = g.referido_id
      JOIN tipos_ayuda ta ON ta.id = g.tipo_ayuda_id
      WHERE ${barrioId ? "r.barrio_id = ?" : "r.comuna_id = ?"}
      GROUP BY ta.id, ta.descripcion
      ORDER BY resueltas DESC
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql, [barrioId || comunaId]);
    return NextResponse.json(rows);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
