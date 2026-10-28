import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { encryptClave, decryptClave } from "@/lib/liderClave";
import { saveImage, deleteImage } from "@/lib/upload";
import { isValidCedula, isValidCelular, isValidEmail } from "@/lib/validations";
import { requireLider } from "@/lib/requireLider";

const BOOL_FIELDS = ["vehiculo", "redes_sociales", "orador_publico", "cantante", "testigo_electoral"] as const;

/** Datos propios del líder autenticado para "Mi Cuenta" en /captura (sin estado/contratista/coordinador_logistica). */
export async function GET(req: NextRequest) {
  const lider = await requireLider(req);
  if (!lider) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, nombre, apellidos, sexo, cedula, celular, email, comuna_id, barrio_id, direccion, zona_id,
        puesto_id, profesion_id, ocupacion_id, fecha_nacimiento, foto, usuario, clave,
        vehiculo, redes_sociales, orador_publico, cantante, testigo_electoral
       FROM lideres WHERE id = ?`,
      [lider.id]
    );
    if (rows.length === 0) return NextResponse.json({ error: "Líder no encontrado" }, { status: 404 });
    const { clave, ...datos } = rows[0];
    return NextResponse.json({ ...datos, clave: decryptClave(clave as string | null) });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

/** Actualiza los datos propios del líder autenticado (el id nunca viene del cliente). */
export async function PUT(req: NextRequest) {
  const lider = await requireLider(req);
  if (!lider) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

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
    if (clave && clave.length < 4) errors.clave = "La clave debe tener al menos 4 caracteres";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Datos inválidos", fields: errors }, { status: 400 });
    }

    const [existingRows] = await pool.query<RowDataPacket[]>("SELECT foto FROM lideres WHERE id = ?", [lider.id]);
    if (existingRows.length === 0) return NextResponse.json({ error: "Líder no encontrado" }, { status: 404 });
    const existingFoto: string | null = existingRows[0].foto;

    let fotoPath = existingFoto;
    const fotoFile = form.get("foto");
    if (fotoFile instanceof File && fotoFile.size > 0) {
      fotoPath = await saveImage(fotoFile, "lideres");
      await deleteImage(existingFoto);
    }

    const bools = BOOL_FIELDS.map((f) => (form.get(f) === "true" || form.get(f) === "on" ? 1 : 0));

    if (clave) {
      const claveCifrada = encryptClave(clave);
      await pool.query(
        `UPDATE lideres SET nombre=?, apellidos=?, sexo=?, cedula=?, celular=?, email=?, comuna_id=?, barrio_id=?,
          direccion=?, zona_id=?, puesto_id=?, profesion_id=?, ocupacion_id=?, fecha_nacimiento=?, foto=?,
          usuario=?, clave=?, vehiculo=?, redes_sociales=?, orador_publico=?, cantante=?, testigo_electoral=?
         WHERE id=?`,
        [
          nombre, apellidos, sexo, cedula, celular, email || null, comuna_id, barrio_id,
          direccion, zona_id, puesto_id, profesion_id || null, ocupacion_id || null, fecha_nacimiento, fotoPath,
          usuario || null, claveCifrada, ...bools, lider.id,
        ]
      );
    } else {
      await pool.query(
        `UPDATE lideres SET nombre=?, apellidos=?, sexo=?, cedula=?, celular=?, email=?, comuna_id=?, barrio_id=?,
          direccion=?, zona_id=?, puesto_id=?, profesion_id=?, ocupacion_id=?, fecha_nacimiento=?, foto=?,
          usuario=?, vehiculo=?, redes_sociales=?, orador_publico=?, cantante=?, testigo_electoral=?
         WHERE id=?`,
        [
          nombre, apellidos, sexo, cedula, celular, email || null, comuna_id, barrio_id,
          direccion, zona_id, puesto_id, profesion_id || null, ocupacion_id || null, fecha_nacimiento, fotoPath,
          usuario || null, ...bools, lider.id,
        ]
      );
    }

    return NextResponse.json({ id: lider.id });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
