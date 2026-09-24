import { NextRequest, NextResponse } from "next/server";
import { simpleCatalogHandlers } from "@/lib/simpleCatalog";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

const h = simpleCatalogHandlers("parentescos");

/**
 * A diferencia de un catálogo simple, incluye el total de referidos con ese
 * parentesco, para el listado de Configuración → Parentescos.
 */
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT pa.id, pa.descripcion, COUNT(r.id) AS total
       FROM parentescos pa
       LEFT JOIN referidos r ON r.parentesco_id = pa.id
       GROUP BY pa.id, pa.descripcion
       ORDER BY pa.descripcion ASC`
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
