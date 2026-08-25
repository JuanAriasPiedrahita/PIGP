import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { isValidCedula, isValidCelular, isValidEmail } from "@/lib/validations";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM referidos WHERE id = ?", [params.id]);
    if (rows.length === 0) return NextResponse.json({ error: "Referido no encontrado" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const {
      lider_id, cedula, nombre, apellidos, sexo, celular, email, direccion,
      comuna_id, barrio_id, zona_id, puesto_id, fecha_nacimiento, parentesco_id,
      voto_anterior, damnificado_terremoto,
      vehiculo, redes_sociales, orador_publico, cantante, testigo_electoral,
    } = body;

    const errors: Record<string, string> = {};
    if (!lider_id) errors.lider_id = "Seleccione el líder";
    if (!nombre?.trim()) errors.nombre = "El nombre es obligatorio";
    if (!apellidos?.trim()) errors.apellidos = "Los apellidos son obligatorios";
    if (!["MASCULINO", "FEMENINO"].includes(sexo)) errors.sexo = "Seleccione el sexo";
    if (!isValidCedula(cedula || "")) errors.cedula = "Cédula inválida";
    if (!isValidCelular(celular || "")) errors.celular = "Celular inválido";
    if (!isValidEmail(email || "")) errors.email = "Email inválido";
    if (!direccion?.trim()) errors.direccion = "La dirección es obligatoria";
    if (!comuna_id) errors.comuna_id = "Seleccione la comuna";
    if (!barrio_id) errors.barrio_id = "Seleccione el barrio";
    if (!zona_id) errors.zona_id = "Seleccione la zona de votación";
    if (!puesto_id) errors.puesto_id = "Seleccione el puesto de votación";
    if (!fecha_nacimiento) errors.fecha_nacimiento = "La fecha de nacimiento es obligatoria";
    if (!parentesco_id) errors.parentesco_id = "Seleccione el parentesco";
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Datos inválidos", fields: errors }, { status: 400 });
    }

    await pool.query(
      `UPDATE referidos SET lider_id=?, cedula=?, nombre=?, apellidos=?, sexo=?, celular=?, email=?, direccion=?,
        comuna_id=?, barrio_id=?, zona_id=?, puesto_id=?, fecha_nacimiento=?, parentesco_id=?,
        voto_anterior=?, damnificado_terremoto=?, vehiculo=?, redes_sociales=?, orador_publico=?, cantante=?, testigo_electoral=?
       WHERE id=?`,
      [
        lider_id, cedula.trim(), nombre.trim(), apellidos.trim(), sexo, celular.trim(), email?.trim() || null, direccion.trim(),
        comuna_id, barrio_id, zona_id, puesto_id, fecha_nacimiento, parentesco_id,
        voto_anterior ? 1 : 0, damnificado_terremoto ? 1 : 0,
        vehiculo ? 1 : 0, redes_sociales ? 1 : 0, orador_publico ? 1 : 0, cantante ? 1 : 0, testigo_electoral ? 1 : 0,
        params.id,
      ]
    );

    return NextResponse.json({ id: Number(params.id) });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await pool.query("DELETE FROM referidos WHERE id = ?", [params.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
