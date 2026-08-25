import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { comuna_id, nombre } = body;
    if (!comuna_id || !nombre) {
      return NextResponse.json({ error: "Comuna y nombre del barrio son obligatorios." }, { status: 400 });
    }
    await pool.query("UPDATE barrios SET comuna_id = ?, nombre = ? WHERE id = ?", [comuna_id, nombre, params.id]);
    return NextResponse.json({ id: Number(params.id), comuna_id, nombre });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await pool.query("DELETE FROM barrios WHERE id = ?", [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
