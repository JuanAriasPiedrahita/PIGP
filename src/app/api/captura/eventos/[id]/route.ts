import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { requireCoordinadorLogistica } from "@/lib/requireLider";

/**
 * Edición de un evento desde /captura: mismo GET/PUT que el panel admin
 * (/api/eventos/[id]), pero solo para líderes con el atributo "Coordinador
 * logística" (ver requireCoordinadorLogistica). Sin DELETE: eliminar
 * eventos sigue siendo exclusivo del admin.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const lider = await requireCoordinadorLogistica(req);
  if (!lider) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

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
  const lider = await requireCoordinadorLogistica(req);
  if (!lider) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  try {
    const { nombre, ubicacion, fecha, hora, duracion_horas } = await req.json();

    const errors: Record<string, string> = {};
    if (!String(nombre || "").trim()) errors.nombre = "El nombre es obligatorio";
    if (!String(ubicacion || "").trim()) errors.ubicacion = "La ubicación es obligatoria";
    if (!fecha) errors.fecha = "La fecha es obligatoria";
    if (!hora) errors.hora = "La hora es obligatoria";
    const duracion = Number(duracion_horas);
    if (duracion_horas === "" || duracion_horas == null || !Number.isInteger(duracion) || duracion < 1 || duracion > 99) {
      errors.duracion_horas = "La duración debe ser un número entero de horas (1 a 99)";
    }
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Datos inválidos", fields: errors }, { status: 400 });
    }

    const [result] = await pool.query<import("mysql2").ResultSetHeader>(
      "UPDATE eventos SET nombre=?, ubicacion=?, fecha=?, hora=?, duracion_horas=? WHERE id=?",
      [String(nombre).trim(), String(ubicacion).trim(), fecha, hora, duracion, params.id]
    );
    if (result.affectedRows === 0) return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
    return NextResponse.json({ id: Number(params.id) });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
