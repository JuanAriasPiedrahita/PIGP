import { appendFile } from "fs/promises";
import path from "path";
import type { NextRequest } from "next/server";

const DEFAULT_LOG_FILE = "access.log";

function resolveLogFile(): string {
  const configurado = process.env.ACCESS_LOG_FILE?.trim() || DEFAULT_LOG_FILE;
  return path.isAbsolute(configurado) ? configurado : path.join(process.cwd(), configurado);
}

/**
 * Fecha y hora actuales en hora Bogotá, sin depender de la zona horaria del
 * contenedor (por defecto UTC) ni del servidor — mismo criterio que
 * `hoyEnBogota()` en cumpleanosLideres.ts.
 */
function fechaHoraBogota(): { fecha: string; hora: string } {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return {
    fecha: `${valor("year")}-${valor("month")}-${valor("day")}`,
    hora: `${valor("hour")}:${valor("minute")}:${valor("second")}`,
  };
}

/** IP real del cliente, tomada de los headers que reenvía nginx (ver proxy_set_header en producción). */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "desconocida";
}

interface LogAccessParams {
  usuario: string;
  ip: string;
  userAgent: string;
  resultado: "OK" | "FALLIDO";
}

export async function logAccess({ usuario, ip, userAgent, resultado }: LogAccessParams): Promise<void> {
  const { fecha, hora } = fechaHoraBogota();
  const linea = `${fecha}\t${hora}\t${usuario}\t${ip}\t${userAgent}\t${resultado}\n`;
  try {
    await appendFile(resolveLogFile(), linea, "utf-8");
  } catch (err) {
    console.error("No se pudo escribir el log de accesos:", err);
  }
}

interface LogActionParams {
  usuario: string;
  ip: string;
  accion: string;
}

/** Registra una acción de administrador (modificar/eliminar líder o referido) en el mismo log de accesos. */
export async function logAction({ usuario, ip, accion }: LogActionParams): Promise<void> {
  const { fecha, hora } = fechaHoraBogota();
  const linea = `${fecha}\t${hora}\t${usuario}\t${ip}\t${accion}\n`;
  try {
    await appendFile(resolveLogFile(), linea, "utf-8");
  } catch (err) {
    console.error("No se pudo escribir el log de acciones:", err);
  }
}

interface LogCumpleanosParams {
  nombre: string;
  email: string;
}

/** Registra el envío de un correo de cumpleaños a un líder en el mismo log de accesos. */
export async function logCumpleanosEnviado({ nombre, email }: LogCumpleanosParams): Promise<void> {
  const { fecha, hora } = fechaHoraBogota();
  const linea = `${fecha}\t${hora}\t${nombre}\tCorreo cumpleaños lider\t${email}\n`;
  try {
    await appendFile(resolveLogFile(), linea, "utf-8");
  } catch (err) {
    console.error("No se pudo escribir el log de cumpleaños:", err);
  }
}

interface LogVencimientoGestionParams {
  gestor: string;
  email: string;
}

/** Registra el envío de un correo de vencimiento de gestión al gestor responsable en el mismo log de accesos. */
export async function logVencimientoGestionEnviado({ gestor, email }: LogVencimientoGestionParams): Promise<void> {
  const { fecha, hora } = fechaHoraBogota();
  const linea = `${fecha}\t${hora}\t${gestor}\tCorreo vencimiento gestion\t${email}\n`;
  try {
    await appendFile(resolveLogFile(), linea, "utf-8");
  } catch (err) {
    console.error("No se pudo escribir el log de vencimiento de gestión:", err);
  }
}

interface LogVencimientoContratoParams {
  lider: string;
  email: string;
}

/** Registra el envío de un correo de vencimiento de contrato al correo de gestión de contratos, en el mismo log de accesos. */
export async function logVencimientoContratoEnviado({ lider, email }: LogVencimientoContratoParams): Promise<void> {
  const { fecha, hora } = fechaHoraBogota();
  const linea = `${fecha}\t${hora}\t${lider}\tCorreo vencimiento contrato\t${email}\n`;
  try {
    await appendFile(resolveLogFile(), linea, "utf-8");
  } catch (err) {
    console.error("No se pudo escribir el log de vencimiento de contrato:", err);
  }
}
