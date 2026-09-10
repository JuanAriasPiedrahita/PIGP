import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM eventos WHERE id = ?", [params.id]);
    if (rows.length === 0) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { nombre, ubicacion, fecha, hora } = await req.json();

    const errors: Record<string, string> = {};
    if (!String(nombre || "").trim()) errors.nombre = "El nombre es obligatorio";
    if (!String(ubicacion || "").trim()) errors.ubicacion = "La ubicación es obligatoria";
    if (!fecha) errors.fecha = "La fecha es obligatoria";
    if (!hora) errors.hora = "La hora es obligatoria";
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Datos inválidos", fields: errors }, { status: 400 });
    }

    const [result] = await pool.query<import("mysql2").ResultSetHeader>(
      "UPDATE eventos SET nombre=?, ubicacion=?, fecha=?, hora=? WHERE id=?",
      [String(nombre).trim(), String(ubicacion).trim(), fecha, hora, params.id]
    );
    if (result.affectedRows === 0) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    return NextResponse.json({ id: Number(params.id) });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await pool.query("DELETE FROM eventos WHERE id = ?", [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
