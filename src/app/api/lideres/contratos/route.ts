import { NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { estadoContrato, mesesAlertaVencimiento } from "@/lib/contrato";

/** Contratos de los líderes marcados como contratista, para el dashboard. */
export async function GET() {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         l.id AS lider_id,
         CONCAT(l.nombre, ' ', l.apellidos) AS lider_nombre,
         l.objeto_contrato,
         d.descripcion AS dependencia_descripcion,
         l.vencimiento_contrato
       FROM lideres l
       LEFT JOIN dependencias d ON d.id = l.dependencia_id
       WHERE l.contratista = 1
       ORDER BY l.vencimiento_contrato ASC`
    );
    const meses = mesesAlertaVencimiento();
    const contratos = rows.map((r) => ({
      lider_id: r.lider_id,
      lider_nombre: r.lider_nombre,
      objeto_contrato: r.objeto_contrato,
      dependencia_descripcion: r.dependencia_descripcion,
      vencimiento_contrato: r.vencimiento_contrato,
      estado: estadoContrato(r.vencimiento_contrato, meses),
    }));
    return NextResponse.json(contratos);
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
