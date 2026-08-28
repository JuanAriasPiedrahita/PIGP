import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

/**
 * Lista los referidos que tienen al menos una gestión registrada, con los
 * conteos por estado y la fecha límite pendiente más próxima. Ordenados por
 * esa fecha (los que están más cerca de vencer primero); los que no tienen
 * ninguna gestión pendiente (todas resueltas o no viables) van al final.
 *
 * El ORDER BY va sobre una subconsulta (no directamente sobre el GROUP BY):
 * MySQL no permite usar el alias de una función de agregación (proxima_fecha)
 * dentro de una expresión como "proxima_fecha IS NULL" en el mismo nivel que
 * el GROUP BY ("Reference 'proxima_fecha' not supported (reference to group
 * function)"); al envolverlo en una subconsulta, la columna ya no es una
 * función de agregación para el ORDER BY externo.
 */
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q");
    let sql = `
      SELECT * FROM (
        SELECT
          r.id, r.nombre, r.apellidos,
          b.nombre AS barrio_nombre,
          COUNT(g.id) AS total,
          SUM(g.estado = 'PENDIENTE') AS pendientes,
          SUM(g.estado = 'NO_VIABLE') AS no_viables,
          SUM(g.estado = 'PENDIENTE' AND g.fecha_limite < CURDATE()) AS vencidas,
          MIN(CASE WHEN g.estado = 'PENDIENTE' THEN g.fecha_limite END) AS proxima_fecha
        FROM referidos r
        JOIN gestiones g ON g.referido_id = r.id
        LEFT JOIN barrios b ON b.id = r.barrio_id
    `;
    const args: string[] = [];
    if (q) {
      sql += " WHERE (r.nombre LIKE ? OR r.apellidos LIKE ?)";
      const like = `%${q}%`;
      args.push(like, like);
    }
    sql += `
        GROUP BY r.id, r.nombre, r.apellidos, b.nombre
      ) t
      ORDER BY proxima_fecha IS NULL, proxima_fecha ASC
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql, args);
    return NextResponse.json(rows);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
