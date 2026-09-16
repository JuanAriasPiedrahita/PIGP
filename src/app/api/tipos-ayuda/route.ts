import { NextRequest, NextResponse } from "next/server";
import { simpleCatalogHandlers } from "@/lib/simpleCatalog";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

const h = simpleCatalogHandlers("tipos_ayuda");

/**
 * A diferencia de los demás catálogos simples, tipos_ayuda incluye el total
 * de gestiones resueltas y pendientes de cada tipo (las vencidas cuentan
 * como pendientes), para el listado de Configuración → Tipos de ayuda.
 */
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ta.id, ta.descripcion,
         COALESCE(SUM(g.estado = 'RESUELTO'), 0) AS resueltas,
         COALESCE(SUM(g.estado = 'PENDIENTE'), 0) AS pendientes
       FROM tipos_ayuda ta
       LEFT JOIN gestiones g ON g.tipo_ayuda_id = ta.id
       GROUP BY ta.id, ta.descripcion
       ORDER BY ta.descripcion ASC`
    );
    return NextResponse.json(rows);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest) {
  return h.create(req);
}
