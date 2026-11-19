import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import type { Sexo } from "@/lib/types";
import { reemplazarPlaceholders } from "@/lib/emailPlaceholders";
import { sendMail, getEmailDelayMs, waitEmailDelay } from "@/lib/mailer";

const LIDERES_SQL = `
  SELECT l.id, l.nombre, l.apellidos, l.sexo, l.direccion, l.email, l.celular,
         b.nombre AS barrio_nombre,
         co.descripcion AS comuna_descripcion,
         p.nombre AS puesto_nombre
  FROM lideres l
  LEFT JOIN barrios b ON b.id = l.barrio_id
  LEFT JOIN comunas co ON co.id = l.comuna_id
  LEFT JOIN puestos p ON p.id = l.puesto_id
  WHERE l.id IN (?)
`;

interface LiderEmailRow extends RowDataPacket {
  id: number;
  nombre: string;
  apellidos: string;
  sexo: Sexo;
  direccion: string | null;
  email: string | null;
  celular: string | null;
  barrio_nombre: string | null;
  comuna_descripcion: string | null;
  puesto_nombre: string | null;
}

export async function POST(req: NextRequest) {
  try {
    const { liderIds, asunto, cuerpo } = await req.json();

    if (!Array.isArray(liderIds) || liderIds.length === 0) {
      return NextResponse.json({ error: "Debe seleccionar al menos un líder" }, { status: 400 });
    }
    if (!asunto || !String(asunto).trim()) {
      return NextResponse.json({ error: "El asunto es obligatorio" }, { status: 400 });
    }
    if (!cuerpo || !String(cuerpo).trim()) {
      return NextResponse.json({ error: "El cuerpo del mensaje es obligatorio" }, { status: 400 });
    }

    const [rows] = await pool.query<LiderEmailRow[]>(LIDERES_SQL, [liderIds]);

    const omitidos: { id: number; nombre: string }[] = [];
    const fallidos: { id: number; nombre: string; error: string }[] = [];
    let enviados = 0;
    const delayMs = getEmailDelayMs();

    for (let i = 0; i < rows.length; i++) {
      const l = rows[i];
      const nombreCompleto = `${l.nombre} ${l.apellidos}`;

      if (!l.email) {
        omitidos.push({ id: l.id, nombre: nombreCompleto });
        continue;
      }

      const asuntoFinal = reemplazarPlaceholders(String(asunto), l);
      const cuerpoFinal = reemplazarPlaceholders(String(cuerpo), l);

      try {
        await sendMail(l.email, asuntoFinal, cuerpoFinal);
        enviados++;
      } catch (err) {
        fallidos.push({ id: l.id, nombre: nombreCompleto, error: err instanceof Error ? err.message : "Error desconocido" });
      }

      if (i < rows.length - 1) await waitEmailDelay(delayMs);
    }

    return NextResponse.json({ enviados, omitidos, fallidos });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
