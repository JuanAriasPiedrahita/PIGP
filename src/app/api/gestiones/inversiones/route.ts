import { NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

// Evita que Next.js cachee esto estáticamente desde el build (ver dashboard/route.ts).
export const dynamic = "force-dynamic";

/**
 * Resumen de "Costo invertido" del dashboard: un renglón por referido, con el
 * total invertido (suma de costo de sus gestiones) y cuántas de sus gestiones
 * están resueltas. Solo referidos con al menos un peso invertido. Ordenado de
 * mayor a menor inversión.
 */
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         r.id AS referido_id,
         CONCAT(r.nombre, ' ', r.apellidos) AS colaborador,
         COALESCE(SUM(g.costo), 0) AS total_invertido,
         SUM(g.estado = 'RESUELTO') AS resueltas
       FROM referidos r
       JOIN gestiones g ON g.referido_id = r.id
       GROUP BY r.id, r.nombre, r.apellidos
       HAVING total_invertido > 0
       ORDER BY total_invertido DESC`
    );
    return NextResponse.json(rows);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
