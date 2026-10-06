import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { requireCoordinadorLogistica } from "@/lib/requireLider";

/**
 * Búsqueda de referidos para el buscador de asistentes de /captura/eventos.
 * Solo para líderes "Coordinador logística". Busca entre TODOS los
 * referidos (no solo los del líder autenticado) — igual que el admin, que
 * también puede agregar como asistente a cualquier referido de cualquier
 * líder; la asistencia a un evento no depende de quién lo refirió.
 */
export async function GET(req: NextRequest) {
  const lider = await requireCoordinadorLogistica(req);
  if (!lider) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const q = req.nextUrl.searchParams.get("q");
    if (!q || !q.trim()) return NextResponse.json([]);

    const like = `%${q.trim()}%`;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT r.id, r.nombre, r.apellidos, r.cedula, b.nombre AS barrio_nombre
       FROM referidos r
       LEFT JOIN barrios b ON b.id = r.barrio_id
       WHERE r.nombre LIKE ? OR r.apellidos LIKE ? OR r.cedula LIKE ?
       ORDER BY r.nombre
       LIMIT 20`,
      [like, like, like]
    );
    return NextResponse.json(rows);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
