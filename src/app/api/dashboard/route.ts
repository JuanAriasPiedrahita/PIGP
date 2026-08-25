import { NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    const [[lideresRow]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total, SUM(estado='ACTIVO') AS activos, SUM(estado='INACTIVO') AS inactivos FROM lideres"
    ) as unknown as [RowDataPacket[]];
    const [[referidosRow]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total, SUM(voto_anterior=1) AS votaron, SUM(damnificado_terremoto=1) AS damnificados FROM referidos"
    ) as unknown as [RowDataPacket[]];
    const [porComuna] = await pool.query<RowDataPacket[]>(
      `SELECT co.descripcion AS comuna, COUNT(l.id) AS total
       FROM comunas co LEFT JOIN lideres l ON l.comuna_id = co.id
       GROUP BY co.id, co.descripcion ORDER BY co.descripcion`
    );
    const [topLideres] = await pool.query<RowDataPacket[]>(
      `SELECT l.id, CONCAT(l.nombre, ' ', l.apellidos) AS nombre, COUNT(r.id) AS total_referidos
       FROM lideres l LEFT JOIN referidos r ON r.lider_id = l.id
       GROUP BY l.id, l.nombre, l.apellidos
       ORDER BY total_referidos DESC LIMIT 5`
    );

    return NextResponse.json({
      totalLideres: Number(lideresRow?.total || 0),
      lideresActivos: Number(lideresRow?.activos || 0),
      lideresInactivos: Number(lideresRow?.inactivos || 0),
      totalReferidos: Number(referidosRow?.total || 0),
      referidosQueVotaron: Number(referidosRow?.votaron || 0),
      referidosDamnificados: Number(referidosRow?.damnificados || 0),
      porComuna,
      topLideres,
    });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
