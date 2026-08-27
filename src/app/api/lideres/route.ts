import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import bcrypt from "bcryptjs";
import { savePhoto } from "@/lib/upload";
import { isValidCedula, isValidCelular, isValidEmail } from "@/lib/validations";
import { parseContratista } from "@/lib/contratista";
import { calcularEdad, sentinelBirthYear } from "@/lib/edad";

const LIST_SQL = `
  SELECT
    l.id, l.nombre, l.apellidos, l.sexo, l.cedula, l.celular, l.email,
    l.comuna_id, l.barrio_id, l.direccion, l.zona_id, l.puesto_id,
    l.profesion_id, l.ocupacion_id, l.fecha_nacimiento, l.estado, l.foto, l.usuario,
    l.vehiculo, l.redes_sociales, l.orador_publico, l.cantante, l.testigo_electoral,
    l.contratista, l.objeto_contrato, l.vencimiento_contrato, l.dependencia_id,
    l.created_at, l.updated_at,
    co.descripcion AS comuna_descripcion,
    b.nombre AS barrio_nombre,
    z.codigo AS zona_codigo,
    p.nombre AS puesto_nombre,
    pr.descripcion AS profesion_descripcion,
    oc.descripcion AS ocupacion_descripcion,
    dep.descripcion AS dependencia_descripcion,
    (SELECT COUNT(*) FROM referidos r WHERE r.lider_id = l.id) AS total_referidos
  FROM lideres l
  LEFT JOIN comunas co ON co.id = l.comuna_id
  LEFT JOIN barrios b ON b.id = l.barrio_id
  LEFT JOIN zonas z ON z.id = l.zona_id
  LEFT JOIN puestos p ON p.id = l.puesto_id
  LEFT JOIN profesiones pr ON pr.id = l.profesion_id
  LEFT JOIN ocupaciones oc ON oc.id = l.ocupacion_id
  LEFT JOIN dependencias dep ON dep.id = l.dependencia_id
`;

const ATRIBUTO_PARAMS = ["vehiculo", "redes_sociales", "orador_publico", "cantante", "testigo_electoral"] as const;

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const q = params.get("q");
    let sql = LIST_SQL;
    const conditions: string[] = [];
    const args: (string | number)[] = [];

    const eqFilters: [string, string | null][] = [
      ["l.comuna_id", params.get("comuna_id")],
      ["l.barrio_id", params.get("barrio_id")],
      ["l.puesto_id", params.get("puesto_id")],
    ];
    for (const [column, value] of eqFilters) {
      if (value) {
        conditions.push(`${column} = ?`);
        args.push(value);
      }
    }

    if (params.get("contratista") === "true") {
      conditions.push("l.contratista = 1");
    } else if (params.get("contratista") === "false") {
      conditions.push("l.contratista = 0");
    }

    for (const atributo of ATRIBUTO_PARAMS) {
      if (params.get(atributo) === "true") {
        conditions.push(`l.${atributo} = 1`);
      }
    }

    if (q) {
      conditions.push("(l.nombre LIKE ? OR l.apellidos LIKE ? OR l.cedula LIKE ?)");
      const like = `%${q}%`;
      args.push(like, like, like);
    }

    if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY l.created_at DESC";
    const [rows] = await pool.query<RowDataPacket[]>(sql, args);
    const sentinel = sentinelBirthYear();
    const rowsConEdad = rows.map((r) => ({ ...r, edad: calcularEdad(r.fecha_nacimiento as string, sentinel) }));
    return NextResponse.json(rowsConEdad);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

const BOOL_FIELDS = ["vehiculo", "redes_sociales", "orador_publico", "cantante", "testigo_electoral"] as const;

export async function POST(req: NextRequest) {
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
    const clave = String(form.get("clave") || "");

    const errors: Record<string, string> = {};
    if (!nombre) errors.nombre = "El nombre es obligatorio";
    if (!apellidos) errors.apellidos = "Los apellidos son obligatorios";
    if (!["MASCULINO", "FEMENINO"].includes(sexo)) errors.sexo = "Seleccione el sexo";
    if (!isValidCedula(cedula)) errors.cedula = "Cédula inválida (solo números, 5 a 15 dígitos)";
    if (!isValidCelular(celular)) errors.celular = "Celular inválido";
    if (!isValidEmail(email)) errors.email = "Email inválido";
    if (!comuna_id) errors.comuna_id = "Seleccione la comuna";
    if (!barrio_id) errors.barrio_id = "Seleccione el barrio";
    if (!direccion) errors.direccion = "La dirección es obligatoria";
    if (!zona_id) errors.zona_id = "Seleccione la zona de votación";
    if (!puesto_id) errors.puesto_id = "Seleccione el puesto de votación";
    if (!fecha_nacimiento) errors.fecha_nacimiento = "La fecha de nacimiento es obligatoria";
    // Usuario y clave son opcionales: un líder puede quedar sin acceso a /captura por ahora.
    if (clave && clave.length < 4) errors.clave = "La clave debe tener al menos 4 caracteres";

    const { data: contratistaData, error: contratistaError } = parseContratista(form);
    if (contratistaError) errors.contratista = contratistaError;

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Datos inválidos", fields: errors }, { status: 400 });
    }

    let fotoPath: string | null = null;
    const fotoFile = form.get("foto");
    if (fotoFile instanceof File && fotoFile.size > 0) {
      fotoPath = await savePhoto(fotoFile);
    }

    const claveHash = clave ? await bcrypt.hash(clave, 10) : null;
    const bools = BOOL_FIELDS.map((f) => (form.get(f) === "true" || form.get(f) === "on" ? 1 : 0));

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO lideres
        (nombre, apellidos, sexo, cedula, celular, email, comuna_id, barrio_id, direccion,
         zona_id, puesto_id, profesion_id, ocupacion_id, fecha_nacimiento, estado, foto,
         usuario, clave, vehiculo, redes_sociales, orador_publico, cantante, testigo_electoral,
         contratista, objeto_contrato, vencimiento_contrato, dependencia_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        nombre, apellidos, sexo, cedula, celular, email || null, comuna_id, barrio_id, direccion,
        zona_id, puesto_id, profesion_id || null, ocupacion_id || null, fecha_nacimiento, estado, fotoPath,
        usuario || null, claveHash, ...bools,
        contratistaData.contratista, contratistaData.objeto_contrato, contratistaData.vencimiento_contrato, contratistaData.dependencia_id,
      ]
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
