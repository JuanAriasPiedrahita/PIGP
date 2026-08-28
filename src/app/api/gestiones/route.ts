import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { saveImage } from "@/lib/upload";

const LIST_SQL = `
  SELECT
    g.id, g.referido_id, g.tipo_ayuda_id, g.gestor_id, g.fecha_limite, g.observaciones,
    g.estado, g.costo, g.fecha_resolucion, g.fotos, g.created_at, g.updated_at,
    ta.descripcion AS tipo_ayuda_descripcion,
    ge.nombre AS gestor_nombre
  FROM gestiones g
  LEFT JOIN tipos_ayuda ta ON ta.id = g.tipo_ayuda_id
  LEFT JOIN gestores ge ON ge.id = g.gestor_id
`;

export async function GET(req: NextRequest) {
  try {
    const referidoId = req.nextUrl.searchParams.get("referido_id");
    if (!referidoId) {
      return NextResponse.json({ error: "Falta el parámetro referido_id" }, { status: 400 });
    }
    const sql = LIST_SQL + " WHERE g.referido_id = ? ORDER BY g.fecha_limite ASC";
    const [rows] = await pool.query<RowDataPacket[]>(sql, [referidoId]);
    return NextResponse.json(rows);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

const ESTADOS = ["PENDIENTE", "NO_VIABLE", "RESUELTO"] as const;

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const referido_id = form.get("referido_id");
    const tipo_ayuda_id = form.get("tipo_ayuda_id");
    const gestor_id = form.get("gestor_id");
    const fecha_limite = String(form.get("fecha_limite") || "");
    const observaciones = String(form.get("observaciones") || "").trim();
    const estado = String(form.get("estado") || "PENDIENTE");
    const costoRaw = String(form.get("costo") || "").trim();

    const errors: Record<string, string> = {};
    if (!referido_id) errors.referido_id = "Falta el referido";
    if (!tipo_ayuda_id) errors.tipo_ayuda_id = "Seleccione el tipo de ayuda";
    if (!gestor_id) errors.gestor_id = "Seleccione el responsable";
    if (!fecha_limite) errors.fecha_limite = "La fecha límite es obligatoria";
    if (!ESTADOS.includes(estado as (typeof ESTADOS)[number])) errors.estado = "Estado inválido";
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Datos inválidos", fields: errors }, { status: 400 });
    }

    const resuelto = estado === "RESUELTO";
    const costo = resuelto && costoRaw ? Number(costoRaw) : null;

    let fotos: string[] | null = null;
    if (resuelto) {
      const archivos = form.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);
      if (archivos.length > 0) {
        fotos = await Promise.all(archivos.map((f) => saveImage(f, "gestiones")));
      }
    }

    const fechaResolucion = resuelto ? new Date() : null;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO gestiones (referido_id, tipo_ayuda_id, gestor_id, fecha_limite, observaciones, estado, costo, fecha_resolucion, fotos)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [referido_id, tipo_ayuda_id, gestor_id, fecha_limite, observaciones || null, estado, costo, fechaResolucion, fotos ? JSON.stringify(fotos) : null]
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
