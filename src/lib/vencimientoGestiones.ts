import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";
import { leerPlantilla, reemplazarPlaceholdersPlantilla } from "@/lib/plantillas";
import { sendMail, getEmailDelayMs, waitEmailDelay } from "@/lib/mailer";
import { isValidEmail } from "@/lib/validations";
import { logVencimientoGestionEnviado } from "@/lib/accessLog";

const ENV_VAR = "PLANTILLA_VENCIMIENTO_GESTION_FILE";
const DEFAULT_PATH = "plantillas/vencimiento_gestion.txt";

interface GestionVencimientoRow extends RowDataPacket {
  id: number;
  fecha_limite: string;
  observaciones: string | null;
  gestor_nombre: string;
  gestor_email: string | null;
  tipo_ayuda_descripcion: string | null;
  referido_nombre: string;
  referido_apellidos: string;
  referido_celular: string | null;
}

const GESTIONES_SQL = `
  SELECT g.id, g.fecha_limite, g.observaciones,
         ge.nombre AS gestor_nombre, ge.email AS gestor_email,
         ta.descripcion AS tipo_ayuda_descripcion,
         r.nombre AS referido_nombre, r.apellidos AS referido_apellidos, r.celular AS referido_celular
  FROM gestiones g
  LEFT JOIN gestores ge ON ge.id = g.gestor_id
  LEFT JOIN tipos_ayuda ta ON ta.id = g.tipo_ayuda_id
  LEFT JOIN referidos r ON r.id = g.referido_id
  WHERE g.estado = 'PENDIENTE'
    AND g.fecha_limite = ?
`;

/** Fecha de "hoy + N días" en hora Bogotá, como "YYYY-MM-DD", para comparar contra `fecha_limite` (columna DATE). */
function fechaObjetivoBogota(diasAnticipacion: number): string {
  const partesHoy = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const valor = (tipo: string) => Number(partesHoy.find((p) => p.type === tipo)?.value);
  const hoy = new Date(Date.UTC(valor("year"), valor("month") - 1, valor("day")));
  hoy.setUTCDate(hoy.getUTCDate() + diasAnticipacion);
  return hoy.toISOString().slice(0, 10);
}

/** Revisa qué gestiones pendientes vencen dentro de N días (hora Bogotá) y avisa al gestor responsable. */
export async function enviarVencimientosDeHoy(): Promise<void> {
  const plantilla = await leerPlantilla(ENV_VAR, DEFAULT_PATH);
  if (!plantilla.trim()) {
    console.log("Vencimiento de gestiones: no hay plantilla configurada, no se envía nada.");
    return;
  }

  const diasAnticipacion = Number(process.env.GESTIONES_VENCIMIENTO_DIAS_ALERTA) || 2;
  const fechaObjetivo = fechaObjetivoBogota(diasAnticipacion);
  const [rows] = await pool.query<GestionVencimientoRow[]>(GESTIONES_SQL, [fechaObjetivo]);

  if (rows.length === 0) return;

  const asunto = process.env.PLANTILLA_VENCIMIENTO_GESTION_ASUNTO?.trim() || "Gestión próxima a vencer";
  let enviados = 0;
  let omitidos = 0;
  let fallidos = 0;
  const delayMs = getEmailDelayMs();

  for (let i = 0; i < rows.length; i++) {
    const g = rows[i];
    if (!g.gestor_email || !isValidEmail(g.gestor_email)) {
      omitidos++;
      continue;
    }
    try {
      const cuerpo = reemplazarPlaceholdersPlantilla(plantilla, {
        nombre: g.gestor_nombre,
        ayuda: g.tipo_ayuda_descripcion || "",
        fecha: g.fecha_limite.slice(0, 10),
        observaciones: g.observaciones || "",
        referido: `${g.referido_nombre} ${g.referido_apellidos}`,
        telefono: g.referido_celular || "",
      });
      await sendMail(g.gestor_email, asunto, cuerpo);
      await logVencimientoGestionEnviado({ gestor: g.gestor_nombre, email: g.gestor_email });
      enviados++;
    } catch (err) {
      fallidos++;
      console.error(`Vencimiento de gestiones: no se pudo enviar al gestor ${g.gestor_nombre} (gestión id ${g.id}):`, err);
    }
    if (i < rows.length - 1) await waitEmailDelay(delayMs);
  }

  console.log(
    `Vencimiento de gestiones: ${enviados} enviado(s), ${fallidos} fallido(s), ${omitidos} omitido(s) sin email, de ${rows.length} gestión(es) que vencen en ${diasAnticipacion} día(s).`
  );
}
