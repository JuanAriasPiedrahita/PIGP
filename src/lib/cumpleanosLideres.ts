import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { reemplazarPlaceholders, type LiderPlaceholderData } from "@/lib/emailPlaceholders";
import { leerPlantilla } from "@/lib/plantillas";
import { sendMail, getEmailDelayMs, waitEmailDelay } from "@/lib/mailer";
import { logCumpleanosEnviado } from "@/lib/accessLog";
import { getParametros } from "@/lib/parametros";

const ENV_VAR = "PLANTILLA_CUMPLEANOS_LIDER_FILE";
const DEFAULT_PATH = "plantillas/cumpleanos_lider.txt";

interface LiderCumpleanosRow extends RowDataPacket, LiderPlaceholderData {
  id: number;
}

const LIDERES_SQL = `
  SELECT l.id, l.nombre, l.apellidos, l.sexo, l.direccion, l.email, l.celular,
         b.nombre AS barrio_nombre,
         co.descripcion AS comuna_descripcion,
         p.nombre AS puesto_nombre
  FROM lideres l
  LEFT JOIN barrios b ON b.id = l.barrio_id
  LEFT JOIN comunas co ON co.id = l.comuna_id
  LEFT JOIN puestos p ON p.id = l.puesto_id
  WHERE l.estado = 'ACTIVO'
    AND l.email IS NOT NULL AND l.email <> ''
    AND MONTH(l.fecha_nacimiento) = ?
    AND DAY(l.fecha_nacimiento) = ?
`;

/** Mes/día de "hoy" en hora Bogotá, para no depender de la zona horaria del contenedor ni del servidor de BD. */
function hoyEnBogota(): { mes: number; dia: number } {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const mes = Number(partes.find((p) => p.type === "month")?.value);
  const dia = Number(partes.find((p) => p.type === "day")?.value);
  return { mes, dia };
}

/** Revisa qué líderes activos cumplen años hoy (hora Bogotá) y les envía el correo de felicitación. */
export async function enviarCumpleanosDeHoy(): Promise<void> {
  const plantilla = await leerPlantilla(ENV_VAR, DEFAULT_PATH);
  if (!plantilla.trim()) {
    console.log("Cumpleaños de líderes: no hay plantilla configurada, no se envía nada.");
    return;
  }

  const { mes, dia } = hoyEnBogota();
  const [rows] = await pool.query<LiderCumpleanosRow[]>(LIDERES_SQL, [mes, dia]);

  if (rows.length === 0) return;

  const asunto = (await getParametros()).plantilla_cumpleanos_lider_asunto;
  let enviados = 0;
  let fallidos = 0;
  const delayMs = getEmailDelayMs();

  for (let i = 0; i < rows.length; i++) {
    const l = rows[i];
    try {
      const cuerpo = reemplazarPlaceholders(plantilla, l);
      await sendMail(l.email as string, reemplazarPlaceholders(asunto, l), cuerpo);
      enviados++;
      await logCumpleanosEnviado({ nombre: `${l.nombre} ${l.apellidos}`, email: l.email as string });
    } catch (err) {
      fallidos++;
      console.error(`Cumpleaños de líderes: no se pudo enviar a ${l.nombre} ${l.apellidos} (id ${l.id}):`, err);
    }
    if (i < rows.length - 1) await waitEmailDelay(delayMs);
  }

  console.log(`Cumpleaños de líderes: ${enviados} enviado(s), ${fallidos} fallido(s), de ${rows.length} líder(es) que cumplen hoy.`);
}
