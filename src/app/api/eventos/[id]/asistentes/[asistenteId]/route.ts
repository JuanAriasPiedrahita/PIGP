import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; asistenteId: string } }) {
  try {
    await pool.query("DELETE FROM evento_asistentes WHERE id = ? AND evento_id = ?", [params.asistenteId, params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
