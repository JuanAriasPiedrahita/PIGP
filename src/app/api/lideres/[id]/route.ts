import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import bcrypt from "bcryptjs";
import { savePhoto, deletePhoto } from "@/lib/upload";
import { isValidCedula, isValidCelular, isValidEmail } from "@/lib/validations";
import { parseContratista } from "@/lib/contratista";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, nombre, apellidos, sexo, cedula, celular, email, comuna_id, barrio_id, direccion, zona_id, puesto_id, profesion_id, ocupacion_id, fecha_nacimiento, estado, foto, usuario, vehiculo, redes_sociales, orador_publico, cantante, testigo_electoral, contratista, objeto_contrato, vencimiento_contrato, dependencia_id FROM lideres WHERE id = ?",
      [params.id]
    );
    if (rows.length === 0) return NextResponse.json({ error: "Líder no encontrado" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

const BOOL_FIELDS = ["vehiculo", "redes_sociales", "orador_publico", "cantante", "testigo_electoral"] as const;

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const form = await req.formData();

    const nombre = String(form.get("nombre") || "").trim();
    const apellidos = String(form.get("apellidos") || "").trim();
    const sexo = String(form.get("sexo") || "");
    const cedula = String(form.get("cedula") || "").trim();
    const celular = String(form.get("celular") || "").trim();
    const email = String(form.get("email") || "").trim();
    const comuna_id = form.get("comuna_id");
    const barrio_id = form.get("barrio_id");
    const direccion = String(form.get("direccion") || "").trim();
    const zona_id = form.get("zona_id");
    const puesto_id = form.get("puesto_id");
    const profesion_id = form.get("profesion_id") || null;
    const ocupacion_id = form.get("ocupacion_id") || null;
    const fecha_nacimiento = String(form.get("fecha_nacimiento") || "");
    const estado = String(form.get("estado") || "ACTIVO");
    const usuario = String(form.get("usuario") || "").trim();
    const clave = String(form.get("clave") || ""); // vacío = no cambiar

    const errors: Record<string, string> = {};
    if (!nombre) errors.nombre = "El nombre es obligatorio";
    if (!apellidos) errors.apellidos = "Los apellidos son obligatorios";
    if (!["MASCULINO", "FEMENINO"].includes(sexo)) errors.sexo = "Seleccione el sexo";
    if (!isValidCedula(cedula)) errors.cedula = "Cédula inválida";
    if (!isValidCelular(celular)) errors.celular = "Celular inválido";
    if (!isValidEmail(email)) errors.email = "Email inválido";
    if (!comuna_id) errors.comuna_id = "Seleccione la comuna";
    if (!barrio_id) errors.barrio_id = "Seleccione el barrio";
    if (!direccion) errors.direccion = "La dirección es obligatoria";
    if (!zona_id) errors.zona_id = "Seleccione la zona de votación";
    if (!puesto_id) errors.puesto_id = "Seleccione el puesto de votación";
    if (!fecha_nacimiento) errors.fecha_nacimiento = "La fecha de nacimiento es obligatoria";
    if (!usuario) errors.usuario = "El usuario es obligatorio";
    if (clave && clave.length < 4) errors.clave = "La clave debe tener al menos 4 caracteres";

    const { data: contratistaData, error: contratistaError } = parseContratista(form);
    if (contratistaError) errors.contratista = contratistaError;

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Datos inválidos", fields: errors }, { status: 400 });
    }

    const [existingRows] = await pool.query<RowDataPacket[]>("SELECT foto FROM lideres WHERE id = ?", [params.id]);
    if (existingRows.length === 0) return NextResponse.json({ error: "Líder no encontrado" }, { status: 404 });
    const existingFoto: string | null = existingRows[0].foto;

    let fotoPath = existingFoto;
    const fotoFile = form.get("foto");
    if (fotoFile instanceof File && fotoFile.size > 0) {
      fotoPath = await savePhoto(fotoFile);
      await deletePhoto(existingFoto);
    }

    const bools = BOOL_FIELDS.map((f) => (form.get(f) === "true" || form.get(f) === "on" ? 1 : 0));

    const contratistaValues = [
      contratistaData.contratista, contratistaData.objeto_contrato, contratistaData.vencimiento_contrato, contratistaData.dependencia_id,
    ];

    if (clave) {
      const claveHash = await bcrypt.hash(clave, 10);
      await pool.query(
        `UPDATE lideres SET nombre=?, apellidos=?, sexo=?, cedula=?, celular=?, email=?, comuna_id=?, barrio_id=?,
          direccion=?, zona_id=?, puesto_id=?, profesion_id=?, ocupacion_id=?, fecha_nacimiento=?, estado=?, foto=?,
          usuario=?, clave=?, vehiculo=?, redes_sociales=?, orador_publico=?, cantante=?, testigo_electoral=?,
          contratista=?, objeto_contrato=?, vencimiento_contrato=?, dependencia_id=?
         WHERE id=?`,
        [
          nombre, apellidos, sexo, cedula, celular, email || null, comuna_id, barrio_id,
          direccion, zona_id, puesto_id, profesion_id || null, ocupacion_id || null, fecha_nacimiento, estado, fotoPath,
          usuario, claveHash, ...bools, ...contratistaValues, params.id,
        ]
      );
    } else {
      await pool.query(
        `UPDATE lideres SET nombre=?, apellidos=?, sexo=?, cedula=?, celular=?, email=?, comuna_id=?, barrio_id=?,
          direccion=?, zona_id=?, puesto_id=?, profesion_id=?, ocupacion_id=?, fecha_nacimiento=?, estado=?, foto=?,
          usuario=?, vehiculo=?, redes_sociales=?, orador_publico=?, cantante=?, testigo_electoral=?,
          contratista=?, objeto_contrato=?, vencimiento_contrato=?, dependencia_id=?
         WHERE id=?`,
        [
          nombre, apellidos, sexo, cedula, celular, email || null, comuna_id, barrio_id,
          direccion, zona_id, puesto_id, profesion_id || null, ocupacion_id || null, fecha_nacimiento, estado, fotoPath,
          usuario, ...bools, ...contratistaValues, params.id,
        ]
      );
    }

    return NextResponse.json({ id: Number(params.id) });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT foto FROM lideres WHERE id = ?", [params.id]);
    await pool.query("DELETE FROM lideres WHERE id = ?", [params.id]);
    if (rows.length > 0) await deletePhoto(rows[0].foto);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
