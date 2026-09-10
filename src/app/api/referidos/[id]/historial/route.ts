import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

/** Historial político de un referido: gestiones que se le han hecho y eventos a los que ha asistido. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [gestiones] = await pool.query<RowDataPacket[]>(
      `SELECT
         g.id, g.tipo_ayuda_id, g.gestor_id, g.fecha_limite, g.observaciones,
         g.estado, g.costo, g.fecha_resolucion, g.created_at,
         ta.descripcion AS tipo_ayuda_descripcion,
         ge.nombre AS gestor_nombre
       FROM gestiones g
       LEFT JOIN tipos_ayuda ta ON ta.id = g.tipo_ayuda_id
       LEFT JOIN gestores ge ON ge.id = g.gestor_id
       WHERE g.referido_id = ?
       ORDER BY g.fecha_limite DESC`,
      [params.id]
    );

    const [eventos] = await pool.query<RowDataPacket[]>(
      `SELECT e.id, e.nombre, e.ubicacion, e.fecha, e.hora, a.created_at AS asistio_desde
       FROM evento_asistentes a
       JOIN eventos e ON e.id = a.evento_id
       WHERE a.referido_id = ?
       ORDER BY e.fecha DESC, e.hora DESC`,
      [params.id]
    );

    return NextResponse.json({ gestiones, eventos });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
