import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { descripcion } = body;
    if (!descripcion) {
      return NextResponse.json({ error: "La descripción de la comuna es obligatoria." }, { status: 400 });
    }
    await pool.query("UPDATE comunas SET descripcion = ? WHERE id = ?", [descripcion, params.id]);
    return NextResponse.json({ id: Number(params.id), descripcion });
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
