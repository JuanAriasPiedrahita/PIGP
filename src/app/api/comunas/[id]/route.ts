import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { codigo, descripcion } = body;
    if (!codigo || !descripcion) {
      return NextResponse.json({ error: "Código y descripción son obligatorios." }, { status: 400 });
    }
    await pool.query("UPDATE comunas SET codigo = ?, descripcion = ? WHERE id = ?", [codigo, descripcion, params.id]);
    return NextResponse.json({ id: Number(params.id), codigo, descripcion });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await pool.query("DELETE FROM comunas WHERE id = ?", [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
