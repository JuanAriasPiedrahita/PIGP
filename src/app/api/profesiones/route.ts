import { NextRequest, NextResponse } from "next/server";
import { simpleCatalogHandlers } from "@/lib/simpleCatalog";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

const h = simpleCatalogHandlers("profesiones");

/**
 * A diferencia de un catálogo simple, incluye el total de líderes con esa
 * profesión (único lugar donde vive `profesion_id`), para el listado de
 * Configuración → Profesiones.
 */
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT p.id, p.descripcion, COUNT(l.id) AS total
       FROM profesiones p
       LEFT JOIN lideres l ON l.profesion_id = p.id
       GROUP BY p.id, p.descripcion
       ORDER BY p.descripcion ASC`
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
