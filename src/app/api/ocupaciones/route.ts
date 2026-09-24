import { NextRequest, NextResponse } from "next/server";
import { simpleCatalogHandlers } from "@/lib/simpleCatalog";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

const h = simpleCatalogHandlers("ocupaciones");

/**
 * A diferencia de un catálogo simple, incluye el total de líderes con esa
 * ocupación (único lugar donde vive `ocupacion_id`), para el listado de
 * Configuración → Ocupaciones.
 */
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT o.id, o.descripcion, COUNT(l.id) AS total
       FROM ocupaciones o
       LEFT JOIN lideres l ON l.ocupacion_id = o.id
       GROUP BY o.id, o.descripcion
       ORDER BY o.descripcion ASC`
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
