import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

/**
 * Resumen de gestiones de una comuna, un barrio, un gestor o un tipo de
 * ayuda, agrupado por tipo de ayuda: cuántas están resueltas, pendientes,
 * vencidas (subconjunto de pendientes cuya fecha límite ya pasó — igual
 * convención que el resto del módulo de Gestiones) y no viables. Ordenado
 * por resueltas descendente. Cuando el filtro ya es un tipo de ayuda, el
 * resultado naturalmente tiene una sola fila (ese mismo tipo).
 */
export async function GET(req: NextRequest) {
  try {
    const comunaId = req.nextUrl.searchParams.get("comuna_id");
    const barrioId = req.nextUrl.searchParams.get("barrio_id");
    const gestorId = req.nextUrl.searchParams.get("gestor_id");
    const tipoAyudaId = req.nextUrl.searchParams.get("tipo_ayuda_id");
    if (!comunaId && !barrioId && !gestorId && !tipoAyudaId) {
      return NextResponse.json({ error: "Falta comuna_id, barrio_id, gestor_id o tipo_ayuda_id" }, { status: 400 });
    }

    const where = tipoAyudaId ? "g.tipo_ayuda_id = ?" : gestorId ? "g.gestor_id = ?" : barrioId ? "r.barrio_id = ?" : "r.comuna_id = ?";
    const valor = tipoAyudaId || gestorId || barrioId || comunaId;

    const sql = `
      SELECT
        ta.id AS tipo_ayuda_id,
        ta.descripcion AS tipo_ayuda_descripcion,
        SUM(g.estado = 'RESUELTO') AS resueltas,
        SUM(g.estado = 'PENDIENTE') AS pendientes,
        SUM(g.estado = 'PENDIENTE' AND g.fecha_limite < CURDATE()) AS vencidas,
        SUM(g.estado = 'NO_VIABLE') AS no_viables,
        SUM(g.costo) AS costo_total
      FROM gestiones g
      JOIN referidos r ON r.id = g.referido_id
      JOIN tipos_ayuda ta ON ta.id = g.tipo_ayuda_id
      WHERE ${where}
      GROUP BY ta.id, ta.descripcion
      ORDER BY resueltas DESC
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql, [valor]);
    return NextResponse.json(rows);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
