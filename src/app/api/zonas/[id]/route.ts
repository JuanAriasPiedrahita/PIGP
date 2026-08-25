import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { codigo, nombre } = body;
    if (!codigo || !/^[0-9]{2}$/.test(codigo)) {
      return NextResponse.json({ error: "El código de zona debe tener exactamente 2 dígitos (ej: 01)." }, { status: 400 });
    }
    await pool.query("UPDATE zonas SET codigo = ?, nombre = ? WHERE id = ?", [codigo, nombre || null, params.id]);
    return NextResponse.json({ id: Number(params.id), codigo, nombre });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await pool.query("DELETE FROM zonas WHERE id = ?", [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
