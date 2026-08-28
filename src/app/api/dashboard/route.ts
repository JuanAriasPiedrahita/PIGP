import { NextResponse } from "next/server";
import pool, { friendlyDbError } from "@/lib/db";
import type { RowDataPacket } from "mysql2";

export async function GET() {
  try {
    const [[lideresRow]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total, SUM(estado='ACTIVO') AS activos, SUM(estado='INACTIVO') AS inactivos, SUM(contratista=1) AS contratistas FROM lideres"
    ) as unknown as [RowDataPacket[]];
    const [[referidosRow]] = await pool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total, SUM(voto_anterior=1) AS votaron, SUM(damnificado_terremoto=1) AS damnificados FROM referidos"
    ) as unknown as [RowDataPacket[]];
    const [[gestionesRow]] = await pool.query<RowDataPacket[]>(
      `SELECT
         COUNT(*) AS total,
         SUM(estado='RESUELTO') AS resueltas,
         SUM(estado='PENDIENTE') AS pendientes,
         SUM(estado='NO_VIABLE') AS no_viables,
         SUM(estado='PENDIENTE' AND fecha_limite < CURDATE()) AS vencidas,
         SUM(CASE WHEN estado='RESUELTO' THEN costo ELSE 0 END) AS costo_total
       FROM gestiones`
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
    const [gestionesPorTipo] = await pool.query<RowDataPacket[]>(
      `SELECT ta.descripcion AS tipo, COUNT(g.id) AS total
       FROM tipos_ayuda ta JOIN gestiones g ON g.tipo_ayuda_id = ta.id
       GROUP BY ta.id, ta.descripcion
       ORDER BY total DESC LIMIT 5`
    );
    const [proximasAVencer] = await pool.query<RowDataPacket[]>(
      `SELECT g.id, g.referido_id, CONCAT(r.nombre, ' ', r.apellidos) AS referido_nombre,
              ta.descripcion AS tipo_ayuda, g.fecha_limite
       FROM gestiones g
       JOIN referidos r ON r.id = g.referido_id
       LEFT JOIN tipos_ayuda ta ON ta.id = g.tipo_ayuda_id
       WHERE g.estado = 'PENDIENTE'
       ORDER BY g.fecha_limite ASC LIMIT 5`
    );

    const totalGestiones = Number(gestionesRow?.total || 0);
    const gestionesResueltas = Number(gestionesRow?.resueltas || 0);

    return NextResponse.json({
      totalLideres: Number(lideresRow?.total || 0),
      lideresActivos: Number(lideresRow?.activos || 0),
      lideresInactivos: Number(lideresRow?.inactivos || 0),
      totalContratistas: Number(lideresRow?.contratistas || 0),
      totalReferidos: Number(referidosRow?.total || 0),
      referidosQueVotaron: Number(referidosRow?.votaron || 0),
      referidosDamnificados: Number(referidosRow?.damnificados || 0),
      totalGestiones,
      gestionesResueltas,
      gestionesPendientes: Number(gestionesRow?.pendientes || 0),
      gestionesNoViables: Number(gestionesRow?.no_viables || 0),
      gestionesVencidas: Number(gestionesRow?.vencidas || 0),
      tasaResolucion: totalGestiones > 0 ? Math.round((gestionesResueltas / totalGestiones) * 100) : 0,
      costoTotalInvertido: Number(gestionesRow?.costo_total || 0),
      porComuna,
      topLideres,
      gestionesPorTipo,
      proximasAVencer,
    });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
