import { NextRequest, NextResponse } from "next/server";
import { simpleCatalogHandlers } from "@/lib/simpleCatalog";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

const h = simpleCatalogHandlers("dependencias");

/**
 * A diferencia de un catálogo simple, incluye el total de líderes
 * contratistas con esa dependencia (`dependencia_id` solo se llena cuando
 * `contratista = 1`), para el listado de Configuración → Dependencias.
 */
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT d.id, d.descripcion, COUNT(l.id) AS total
       FROM dependencias d
       LEFT JOIN lideres l ON l.dependencia_id = d.id AND l.contratista = 1
       GROUP BY d.id, d.descripcion
       ORDER BY d.descripcion ASC`
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
