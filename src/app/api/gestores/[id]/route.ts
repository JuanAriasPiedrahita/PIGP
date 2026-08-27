import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import { isValidEmail } from "@/lib/validations";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const nombre = String(body.nombre || "").trim();
    const email = String(body.email || "").trim();
    if (!nombre) {
      return NextResponse.json({ error: "El nombre del gestor es obligatorio" }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    await pool.query("UPDATE gestores SET nombre = ?, email = ? WHERE id = ?", [nombre, email || null, params.id]);
    return NextResponse.json({ id: Number(params.id), nombre, email: email || null });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await pool.query("DELETE FROM gestores WHERE id = ?", [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
