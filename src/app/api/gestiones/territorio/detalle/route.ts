import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

const COLUMNAS = ["resueltas", "pendientes", "vencidas", "no_viables"] as const;
type Columna = (typeof COLUMNAS)[number];

const CONDICION: Record<Columna, string> = {
  resueltas: "g.estado = 'RESUELTO'",
  pendientes: "g.estado = 'PENDIENTE'",
  vencidas: "g.estado = 'PENDIENTE' AND g.fecha_limite < CURDATE()",
  no_viables: "g.estado = 'NO_VIABLE'",
};

/** Detalle de las gestiones de un tipo de ayuda que caen en una columna del resumen territorial (ver /api/gestiones/territorio). */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const comunaId = params.get("comuna_id");
    const barrioId = params.get("barrio_id");
    const tipoAyudaId = params.get("tipo_ayuda_id");
    const columna = params.get("columna") as Columna | null;

    if (!comunaId && !barrioId) {
      return NextResponse.json({ error: "Falta comuna_id o barrio_id" }, { status: 400 });
    }
    if (!tipoAyudaId) {
      return NextResponse.json({ error: "Falta tipo_ayuda_id" }, { status: 400 });
    }
    if (!columna || !COLUMNAS.includes(columna)) {
      return NextResponse.json({ error: "Parámetro columna inválido" }, { status: 400 });
    }

    const sql = `
      SELECT
        g.id, g.estado, g.fecha_limite, g.fecha_resolucion, g.costo,
        CONCAT(r.nombre, ' ', r.apellidos) AS colaborador,
        ge.nombre AS responsable
      FROM gestiones g
      JOIN referidos r ON r.id = g.referido_id
      JOIN gestores ge ON ge.id = g.gestor_id
      WHERE ${barrioId ? "r.barrio_id = ?" : "r.comuna_id = ?"}
        AND g.tipo_ayuda_id = ?
        AND ${CONDICION[columna]}
      ORDER BY COALESCE(g.fecha_resolucion, g.fecha_limite) DESC
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql, [barrioId || comunaId, tipoAyudaId]);
    return NextResponse.json(rows);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
