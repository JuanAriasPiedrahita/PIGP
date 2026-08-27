import { NextRequest, NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { saveImage, deleteImage } from "@/lib/upload";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM gestiones WHERE id = ?", [params.id]);
    if (rows.length === 0) return NextResponse.json({ error: "Gestión no encontrada" }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

const ESTADOS = ["PENDIENTE", "NO_VIABLE", "RESUELTO"] as const;

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const form = await req.formData();

    const tipo_ayuda_id = form.get("tipo_ayuda_id");
    const gestor_id = form.get("gestor_id");
    const fecha_limite = String(form.get("fecha_limite") || "");
    const observaciones = String(form.get("observaciones") || "").trim();
    const estado = String(form.get("estado") || "PENDIENTE");
    const costoRaw = String(form.get("costo") || "").trim();

    const errors: Record<string, string> = {};
    if (!tipo_ayuda_id) errors.tipo_ayuda_id = "Seleccione el tipo de ayuda";
    if (!gestor_id) errors.gestor_id = "Seleccione el responsable";
    if (!fecha_limite) errors.fecha_limite = "La fecha límite es obligatoria";
    if (!ESTADOS.includes(estado as (typeof ESTADOS)[number])) errors.estado = "Estado inválido";
    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: "Datos inválidos", fields: errors }, { status: 400 });
    }

    const [existingRows] = await pool.query<RowDataPacket[]>("SELECT fotos FROM gestiones WHERE id = ?", [params.id]);
    if (existingRows.length === 0) return NextResponse.json({ error: "Gestión no encontrada" }, { status: 404 });
    const fotosExistentesEnBD: string[] = existingRows[0].fotos || [];

    const resuelto = estado === "RESUELTO";
    const costo = resuelto && costoRaw ? Number(costoRaw) : null;

    let fotos: string[] | null = null;
    if (resuelto) {
      // El cliente envía qué fotos existentes se conservan (pudo haber quitado alguna).
      let conservadas: string[] = fotosExistentesEnBD;
      const conservadasRaw = form.get("fotos_existentes");
      if (typeof conservadasRaw === "string") {
        try {
          conservadas = JSON.parse(conservadasRaw);
        } catch {
          conservadas = fotosExistentesEnBD;
        }
      }
      const eliminadas = fotosExistentesEnBD.filter((f) => !conservadas.includes(f));
      await Promise.all(eliminadas.map((f) => deleteImage(f)));

      const nuevos = form.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);
      const nuevasRutas = await Promise.all(nuevos.map((f) => saveImage(f, "gestiones")));
      fotos = [...conservadas, ...nuevasRutas];
    } else {
      // Si ya no está resuelto, se limpian costo y fotos (y se borran los archivos).
      await Promise.all(fotosExistentesEnBD.map((f) => deleteImage(f)));
    }

    await pool.query(
      `UPDATE gestiones SET tipo_ayuda_id=?, gestor_id=?, fecha_limite=?, observaciones=?, estado=?, costo=?, fotos=?
       WHERE id=?`,
      [tipo_ayuda_id, gestor_id, fecha_limite, observaciones || null, estado, costo, fotos && fotos.length ? JSON.stringify(fotos) : null, params.id]
    );

    return NextResponse.json({ id: Number(params.id) });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT fotos FROM gestiones WHERE id = ?", [params.id]);
    await pool.query("DELETE FROM gestiones WHERE id = ?", [params.id]);
    const fotos: string[] = rows[0]?.fotos || [];
    await Promise.all(fotos.map((f) => deleteImage(f)));
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
