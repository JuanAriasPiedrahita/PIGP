import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { leerPlantilla, reemplazarPlaceholdersPlantilla } from "@/lib/plantillas";
import { sendMail, getEmailDelayMs, waitEmailDelay } from "@/lib/mailer";
import { isValidEmail } from "@/lib/validations";
import { logVencimientoContratoEnviado } from "@/lib/accessLog";
import { getParametros } from "@/lib/parametros";

const ENV_VAR = "PLANTILLA_VENCIMIENTO_CONTRATO_FILE";
const DEFAULT_PATH = "plantillas/vencimiento_contrato.txt";

interface ContratoVencimientoRow extends RowDataPacket {
  id: number;
  nombre: string;
  apellidos: string;
  objeto_contrato: string | null;
  vencimiento_contrato: string;
  dependencia_descripcion: string | null;
}

const CONTRATOS_SQL = `
  SELECT l.id, l.nombre, l.apellidos, l.objeto_contrato, l.vencimiento_contrato,
         d.descripcion AS dependencia_descripcion
  FROM lideres l
  LEFT JOIN dependencias d ON d.id = l.dependencia_id
  WHERE l.contratista = 1
    AND l.vencimiento_contrato = ?
`;

/** Fecha de "hoy + N meses" en hora Bogotá, como "YYYY-MM-DD", para comparar contra `vencimiento_contrato` (columna DATE). */
function fechaObjetivoMesesBogota(mesesAlerta: number): string {
  const partesHoy = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const valor = (tipo: string) => Number(partesHoy.find((p) => p.type === tipo)?.value);
  const hoy = new Date(Date.UTC(valor("year"), valor("month") - 1, valor("day")));
  hoy.setUTCMonth(hoy.getUTCMonth() + mesesAlerta);
  return hoy.toISOString().slice(0, 10);
}

/** Revisa qué contratos de líderes contratistas vencen exactamente dentro de `contrato_meses_alerta` meses (hora Bogotá) y avisa al correo de gestión de contratos. */
export async function enviarVencimientosContratoDeHoy(): Promise<void> {
  const plantilla = await leerPlantilla(ENV_VAR, DEFAULT_PATH);
  if (!plantilla.trim()) {
    console.log("Vencimiento de contratos: no hay plantilla configurada, no se envía nada.");
    return;
  }

  const parametros = await getParametros();
  const destinatario = parametros.correo_gestion_contratos;
  if (!destinatario || !isValidEmail(destinatario)) {
    console.log("Vencimiento de contratos: no hay un correo de gestión de contratos válido configurado, no se envía nada.");
    return;
  }

  const fechaObjetivo = fechaObjetivoMesesBogota(parametros.contrato_meses_alerta);
  const [rows] = await pool.query<ContratoVencimientoRow[]>(CONTRATOS_SQL, [fechaObjetivo]);

  if (rows.length === 0) return;

  const asunto = parametros.plantilla_vencimiento_contrato_asunto;
  let enviados = 0;
  let fallidos = 0;
  const delayMs = getEmailDelayMs();

  for (let i = 0; i < rows.length; i++) {
    const l = rows[i];
    try {
      const valoresPlaceholders = {
        nombre: l.nombre,
        apellido: l.apellidos,
        objeto: l.objeto_contrato || "",
        vencimiento: l.vencimiento_contrato.slice(0, 10),
        dependencia: l.dependencia_descripcion || "",
      };
      const cuerpo = reemplazarPlaceholdersPlantilla(plantilla, valoresPlaceholders);
      await sendMail(destinatario, reemplazarPlaceholdersPlantilla(asunto, valoresPlaceholders), cuerpo);
      await logVencimientoContratoEnviado({ lider: `${l.nombre} ${l.apellidos}`, email: destinatario });
      enviados++;
    } catch (err) {
      fallidos++;
      console.error(`Vencimiento de contratos: no se pudo enviar la alerta del contrato de ${l.nombre} ${l.apellidos} (líder id ${l.id}):`, err);
    }
    if (i < rows.length - 1) await waitEmailDelay(delayMs);
  }

  console.log(
    `Vencimiento de contratos: ${enviados} enviado(s), ${fallidos} fallido(s), de ${rows.length} contrato(s) que vencen en ${parametros.contrato_meses_alerta} mes(es).`
  );
}
