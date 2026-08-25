import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { zona_id, numero, nombre, num_mesas } = body;
    if (!zona_id || !numero || !/^[0-9]{2}$/.test(numero) || !nombre) {
      return NextResponse.json({ error: "Zona, número de puesto (2 dígitos) y nombre son obligatorios." }, { status: 400 });
    }
    await pool.query(
      "UPDATE puestos SET zona_id = ?, numero = ?, nombre = ?, num_mesas = ? WHERE id = ?",
      [zona_id, numero, nombre, num_mesas || 1, params.id]
    );
    return NextResponse.json({ id: Number(params.id), zona_id, numero, nombre, num_mesas });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await pool.query("DELETE FROM puestos WHERE id = ?", [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
