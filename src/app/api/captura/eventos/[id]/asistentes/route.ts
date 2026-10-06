import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { requireCoordinadorLogistica } from "@/lib/requireLider";

/**
 * Asistentes de un evento desde /captura: mismo GET/POST que el panel admin
 * (/api/eventos/[id]/asistentes), solo para líderes "Coordinador logística".
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const lider = await requireCoordinadorLogistica(req);
  if (!lider) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         a.id, a.evento_id, a.referido_id, a.created_at,
         r.nombre AS referido_nombre, r.apellidos AS referido_apellidos,
         r.cedula AS referido_cedula, r.celular AS referido_celular
       FROM evento_asistentes a
       JOIN referidos r ON r.id = a.referido_id
       WHERE a.evento_id = ?
       ORDER BY a.created_at DESC`,
      [params.id]
    );
    return NextResponse.json(rows);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const lider = await requireCoordinadorLogistica(req);
  if (!lider) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const { referido_id } = await req.json();
    if (!referido_id) {
      return NextResponse.json({ error: "Seleccione un referido" }, { status: 400 });
    }

    const [eventoRows] = await pool.query<RowDataPacket[]>("SELECT id FROM eventos WHERE id = ?", [params.id]);
    if (eventoRows.length === 0) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO evento_asistentes (evento_id, referido_id) VALUES (?, ?)",
      [params.id, referido_id]
    );
    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
