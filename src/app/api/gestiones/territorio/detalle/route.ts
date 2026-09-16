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

/**
 * Detalle de las gestiones de un tipo de ayuda que caen en una columna del
 * resumen (ver /api/gestiones/territorio). tipo_ayuda_id y columna son
 * siempre obligatorios; comuna_id/barrio_id/gestor_id son un filtro extra
 * opcional — cuando el resumen ya estaba filtrado por tipo de ayuda (en vez
 * de por comuna/barrio/gestor), no hace falta ninguno de los tres.
 */
export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const comunaId = params.get("comuna_id");
    const barrioId = params.get("barrio_id");
    const gestorId = params.get("gestor_id");
    const tipoAyudaId = params.get("tipo_ayuda_id");
    const columna = params.get("columna") as Columna | null;

    if (!tipoAyudaId) {
      return NextResponse.json({ error: "Falta tipo_ayuda_id" }, { status: 400 });
    }
    if (!columna || !COLUMNAS.includes(columna)) {
      return NextResponse.json({ error: "Parámetro columna inválido" }, { status: 400 });
    }

    const condiciones = ["g.tipo_ayuda_id = ?", CONDICION[columna]];
    const valores: string[] = [tipoAyudaId];
    if (gestorId) {
      condiciones.unshift("g.gestor_id = ?");
      valores.unshift(gestorId);
    } else if (barrioId) {
      condiciones.unshift("r.barrio_id = ?");
      valores.unshift(barrioId);
    } else if (comunaId) {
      condiciones.unshift("r.comuna_id = ?");
      valores.unshift(comunaId);
    }

    const sql = `
      SELECT
        g.id, g.estado, g.fecha_limite, g.fecha_resolucion, g.costo,
        CONCAT(r.nombre, ' ', r.apellidos) AS colaborador,
        ge.nombre AS responsable
      FROM gestiones g
      JOIN referidos r ON r.id = g.referido_id
      JOIN gestores ge ON ge.id = g.gestor_id
      WHERE ${condiciones.join(" AND ")}
      ORDER BY COALESCE(g.fecha_resolucion, g.fecha_limite) DESC
    `;
    const [rows] = await pool.query<RowDataPacket[]>(sql, valores);
    return NextResponse.json(rows);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
