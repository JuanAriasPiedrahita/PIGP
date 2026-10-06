import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import { requireCoordinadorLogistica } from "@/lib/requireLider";

/** Quitar un asistente desde /captura: solo líderes "Coordinador logística". */
export async function DELETE(req: NextRequest, { params }: { params: { id: string; asistenteId: string } }) {
  const lider = await requireCoordinadorLogistica(req);
  if (!lider) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    await pool.query("DELETE FROM evento_asistentes WHERE id = ? AND evento_id = ?", [params.asistenteId, params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
