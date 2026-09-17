import { NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

// Evita que Next.js cachee esto estáticamente desde el build (ver dashboard/route.ts).
export const dynamic = "force-dynamic";

/**
 * Resumen de "Costo invertido" del dashboard: un renglón por colaborador
 * (referido) con el total invertido y cuántas gestiones resueltas tiene.
 * Solo cuenta gestiones resueltas, igual que el cuadro "Costo invertido" del
 * dashboard. Ordenado de mayor a menor inversión.
 */
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         r.id AS referido_id,
         CONCAT(r.nombre, ' ', r.apellidos) AS colaborador,
         COALESCE(SUM(g.costo), 0) AS total_invertido,
         COUNT(*) AS resueltas
       FROM referidos r
       JOIN gestiones g ON g.referido_id = r.id AND g.estado = 'RESUELTO'
       GROUP BY r.id, r.nombre, r.apellidos
       ORDER BY total_invertido DESC`
    );
    return NextResponse.json(rows);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
