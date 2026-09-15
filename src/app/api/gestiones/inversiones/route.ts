import { NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

/** Gestiones con costo asignado (dinero invertido), para el detalle del dashboard. Ordenadas de mayor a menor costo. */
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         g.id, g.costo, g.fecha_resolucion,
         CONCAT(r.nombre, ' ', r.apellidos) AS colaborador,
         ta.descripcion AS tipo_ayuda_descripcion,
         ge.nombre AS responsable
       FROM gestiones g
       JOIN referidos r ON r.id = g.referido_id
       LEFT JOIN tipos_ayuda ta ON ta.id = g.tipo_ayuda_id
       LEFT JOIN gestores ge ON ge.id = g.gestor_id
       WHERE g.costo IS NOT NULL AND g.costo > 0
       ORDER BY g.costo DESC`
    );
    return NextResponse.json(rows);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
