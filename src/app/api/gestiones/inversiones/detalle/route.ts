import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

// Evita que Next.js cachee esto estáticamente desde el build (ver dashboard/route.ts).
export const dynamic = "force-dynamic";

/** Gestiones resueltas de un referido puntual, para el detalle del modal "Costo invertido". */
export async function GET(req: NextRequest) {
  try {
    const referidoId = req.nextUrl.searchParams.get("referido_id");
    if (!referidoId) {
      return NextResponse.json({ error: "Falta referido_id" }, { status: 400 });
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         g.id, g.costo, g.fecha_resolucion,
         ta.descripcion AS tipo_ayuda_descripcion,
         ge.nombre AS responsable
       FROM gestiones g
       LEFT JOIN tipos_ayuda ta ON ta.id = g.tipo_ayuda_id
       LEFT JOIN gestores ge ON ge.id = g.gestor_id
       WHERE g.referido_id = ? AND g.estado = 'RESUELTO'
       ORDER BY g.fecha_resolucion DESC`,
      [referidoId]
    );
    return NextResponse.json(rows);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
