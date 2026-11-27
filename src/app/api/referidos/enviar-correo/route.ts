import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import type { Sexo } from "@/lib/types";
import { reemplazarPlaceholders } from "@/lib/emailPlaceholders";
import { sendMail, getEmailDelayMs, waitEmailDelay } from "@/lib/mailer";

const REFERIDOS_SQL = `
  SELECT r.id, r.nombre, r.apellidos, r.sexo, r.direccion, r.email, r.celular,
         b.nombre AS barrio_nombre,
         co.descripcion AS comuna_descripcion,
         p.nombre AS puesto_nombre
  FROM referidos r
  LEFT JOIN barrios b ON b.id = r.barrio_id
  LEFT JOIN comunas co ON co.id = r.comuna_id
  LEFT JOIN puestos p ON p.id = r.puesto_id
  WHERE r.id IN (?)
`;

interface ReferidoEmailRow extends RowDataPacket {
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
    const { referidoIds, asunto, cuerpo } = await req.json();

    if (!Array.isArray(referidoIds) || referidoIds.length === 0) {
      return NextResponse.json({ error: "Debe seleccionar al menos un referido" }, { status: 400 });
    }
    if (!asunto || !String(asunto).trim()) {
      return NextResponse.json({ error: "El asunto es obligatorio" }, { status: 400 });
    }
    if (!cuerpo || !String(cuerpo).trim()) {
      return NextResponse.json({ error: "El cuerpo del mensaje es obligatorio" }, { status: 400 });
    }

    const [rows] = await pool.query<ReferidoEmailRow[]>(REFERIDOS_SQL, [referidoIds]);

    const omitidos: { id: number; nombre: string }[] = [];
    const fallidos: { id: number; nombre: string; error: string }[] = [];
    let enviados = 0;
    const delayMs = getEmailDelayMs();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const nombreCompleto = `${r.nombre} ${r.apellidos}`;

      if (!r.email) {
        omitidos.push({ id: r.id, nombre: nombreCompleto });
        continue;
      }

      const asuntoFinal = reemplazarPlaceholders(String(asunto), r);
      const cuerpoFinal = reemplazarPlaceholders(String(cuerpo), r);

      try {
        await sendMail(r.email, asuntoFinal, cuerpoFinal);
        enviados++;
      } catch (err) {
        fallidos.push({ id: r.id, nombre: nombreCompleto, error: err instanceof Error ? err.message : "Error desconocido" });
      }

      if (i < rows.length - 1) await waitEmailDelay(delayMs);
    }

    return NextResponse.json({ enviados, omitidos, fallidos });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
