import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import type { Parametros } from "@/lib/types";

interface ParametrosRow extends RowDataPacket, Parametros {}

let cache: Parametros | null = null;

/** Lee los parámetros configurables (fila única, id=1), cacheados en memoria hasta el próximo `actualizarParametros`. */
export async function getParametros(): Promise<Parametros> {
  if (cache) return cache;
  const [rows] = await pool.query<ParametrosRow[]>(
    `SELECT sentinel_birth_year, contrato_meses_alerta, gestiones_vencimiento_dias_alerta,
            lideres_page_size, plantilla_gestion_nueva_asunto, plantilla_cumpleanos_lider_asunto,
            plantilla_vencimiento_gestion_asunto, despacho_automatico_cumpleanos,
            despacho_automatico_vencimiento_gestion
     FROM parametros WHERE id = 1`
  );
  cache = rows[0];
  return cache;
}

type ParametrosEditables = Omit<
  Parametros,
  "plantilla_gestion_nueva_asunto" | "plantilla_cumpleanos_lider_asunto" | "plantilla_vencimiento_gestion_asunto"
>;

export async function actualizarParametros(data: ParametrosEditables): Promise<void> {
  await pool.query(
    `UPDATE parametros SET
       sentinel_birth_year = ?, contrato_meses_alerta = ?, gestiones_vencimiento_dias_alerta = ?,
       lideres_page_size = ?, despacho_automatico_cumpleanos = ?,
       despacho_automatico_vencimiento_gestion = ?
     WHERE id = 1`,
    [
      data.sentinel_birth_year,
      data.contrato_meses_alerta,
      data.gestiones_vencimiento_dias_alerta,
      data.lideres_page_size,
      data.despacho_automatico_cumpleanos,
      data.despacho_automatico_vencimiento_gestion,
    ]
  );
  cache = null;
}

type CampoAsuntoPlantilla =
  | "plantilla_gestion_nueva_asunto"
  | "plantilla_cumpleanos_lider_asunto"
  | "plantilla_vencimiento_gestion_asunto";

/** Actualiza el asunto de una sola plantilla de correo (Configuración > Plantillas). */
export async function actualizarAsuntoPlantilla(campo: CampoAsuntoPlantilla, valor: string): Promise<void> {
  await pool.query(`UPDATE parametros SET ${campo} = ? WHERE id = 1`, [valor]);
  cache = null;
}
