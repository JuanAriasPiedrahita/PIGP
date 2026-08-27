import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { isValidCedula, isValidCelular, isValidEmail } from "@/lib/validations";
import { requireLider } from "@/lib/requireLider";

const LIST_SQL = `
  SELECT
    r.id, r.lider_id, r.cedula, r.nombre, r.apellidos, r.sexo, r.celular, r.email, r.direccion,
    r.comuna_id, r.barrio_id, r.zona_id, r.puesto_id, r.fecha_nacimiento, r.parentesco_id,
    r.voto_anterior, r.damnificado_terremoto,
    r.vehiculo, r.redes_sociales, r.orador_publico, r.cantante, r.testigo_electoral,
    r.created_at, r.updated_at,
    co.descripcion AS comuna_descripcion,
    b.nombre AS barrio_nombre,
    z.codigo AS zona_codigo,
    p.nombre AS puesto_nombre,
    pa.descripcion AS parentesco_descripcion
  FROM referidos r
  LEFT JOIN comunas co ON co.id = r.comuna_id
  LEFT JOIN barrios b ON b.id = r.barrio_id
  LEFT JOIN zonas z ON z.id = r.zona_id
  LEFT JOIN puestos p ON p.id = r.puesto_id
  LEFT JOIN parentescos pa ON pa.id = r.parentesco_id
  WHERE r.lider_id = ?
`;

/** Lista únicamente los referidos del líder autenticado en /captura. */
export async function GET(req: NextRequest) {
  const lider = await requireLider(req);
  if (!lider) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
    const q = req.nextUrl.searchParams.get("q");
    let sql = LIST_SQL;
    const args: (string | number)[] = [lider.id];
    if (q) {
      sql += " AND (r.nombre LIKE ? OR r.apellidos LIKE ? OR r.cedula LIKE ?)";
      const like = `%${q}%`;
      args.push(like, like, like);
    }
    sql += " ORDER BY r.created_at DESC";
    const [rows] = await pool.query<RowDataPacket[]>(sql, args);
    return NextResponse.json(rows);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

/** Crea un referido para el líder autenticado (el lider_id nunca viene del cliente). */
export async function POST(req: NextRequest) {
  const lider = await requireLider(req);
  if (!lider) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  try {
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

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO referidos
        (lider_id, cedula, nombre, apellidos, sexo, celular, email, direccion,
         comuna_id, barrio_id, zona_id, puesto_id, fecha_nacimiento, parentesco_id,
         voto_anterior, damnificado_terremoto, vehiculo, redes_sociales, orador_publico, cantante, testigo_electoral)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        lider.id, cedula.trim(), nombre.trim(), apellidos.trim(), sexo, celular.trim(), email?.trim() || null, direccion.trim(),
        comuna_id, barrio_id, zona_id, puesto_id, fecha_nacimiento, parentesco_id,
        voto_anterior ? 1 : 0, damnificado_terremoto ? 1 : 0,
        vehiculo ? 1 : 0, redes_sociales ? 1 : 0, orador_publico ? 1 : 0, cantante ? 1 : 0, testigo_electoral ? 1 : 0,
      ]
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
