import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

// Evita que Next.js cachee esto estáticamente desde el build (ver dashboard/route.ts).
export const dynamic = "force-dynamic";

/**
 * Gestiones resueltas de un tipo de ayuda, agrupadas por referido: si un
 * referido recibió la misma ayuda varias veces aparece una sola vez, con el
 * total de veces recibida y el total invertido en él.
 */
export async function GET(req: NextRequest) {
  try {
    const tipoAyudaId = req.nextUrl.searchParams.get("tipo_ayuda_id");
    if (!tipoAyudaId) {
      return NextResponse.json({ error: "Falta tipo_ayuda_id" }, { status: 400 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         r.id AS referido_id,
         CONCAT(r.nombre, ' ', r.apellidos) AS colaborador,
         COUNT(*) AS veces,
         COALESCE(SUM(g.costo), 0) AS total_invertido
       FROM gestiones g
       JOIN referidos r ON r.id = g.referido_id
       WHERE g.tipo_ayuda_id = ? AND g.estado = 'RESUELTO'
       GROUP BY r.id, r.nombre, r.apellidos
       ORDER BY total_invertido DESC, veces DESC`,
      [tipoAyudaId]
    );
    return NextResponse.json(rows);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
