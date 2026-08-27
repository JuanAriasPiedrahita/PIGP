import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { isValidCedula, isValidCelular, isValidEmail } from "@/lib/validations";
import { requireLider } from "@/lib/requireLider";

/** Verifica que el referido exista y pertenezca al líder autenticado. */
async function ownsReferido(liderId: number, referidoId: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT lider_id FROM referidos WHERE id = ?", [referidoId]);
  return rows.length > 0 && rows[0].lider_id === liderId;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const lider = await requireLider(req);
  if (!lider) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    if (!(await ownsReferido(lider.id, params.id))) {
      return NextResponse.json({ error: "Referido no encontrado" }, { status: 404 });
    }
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM referidos WHERE id = ?", [params.id]);
    return NextResponse.json(rows[0]);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const lider = await requireLider(req);
  if (!lider) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    if (!(await ownsReferido(lider.id, params.id))) {
      return NextResponse.json({ error: "Referido no encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const {
      cedula, nombre, apellidos, sexo, celular, email, direccion,
      comuna_id, barrio_id, zona_id, puesto_id, fecha_nacimiento, parentesco_id,
      voto_anterior, damnificado_terremoto,
      vehiculo, redes_sociales, orador_publico, cantante, testigo_electoral,
    } = body;

    const errors: Record<string, string> = {};
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
      `UPDATE referidos SET cedula=?, nombre=?, apellidos=?, sexo=?, celular=?, email=?, direccion=?,
        comuna_id=?, barrio_id=?, zona_id=?, puesto_id=?, fecha_nacimiento=?, parentesco_id=?,
        voto_anterior=?, damnificado_terremoto=?, vehiculo=?, redes_sociales=?, orador_publico=?, cantante=?, testigo_electoral=?
       WHERE id=? AND lider_id=?`,
      [
        cedula.trim(), nombre.trim(), apellidos.trim(), sexo, celular.trim(), email?.trim() || null, direccion.trim(),
        comuna_id, barrio_id, zona_id, puesto_id, fecha_nacimiento, parentesco_id,
        voto_anterior ? 1 : 0, damnificado_terremoto ? 1 : 0,
        vehiculo ? 1 : 0, redes_sociales ? 1 : 0, orador_publico ? 1 : 0, cantante ? 1 : 0, testigo_electoral ? 1 : 0,
        params.id, lider.id,
      ]
    );

    return NextResponse.json({ id: Number(params.id) });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const lider = await requireLider(req);
  if (!lider) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    if (!(await ownsReferido(lider.id, params.id))) {
      return NextResponse.json({ error: "Referido no encontrado" }, { status: 404 });
    }
    await pool.query("DELETE FROM referidos WHERE id = ? AND lider_id = ?", [params.id, lider.id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
