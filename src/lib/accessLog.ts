import { appendFile } from "fs/promises";
import path from "path";
import type { NextRequest } from "next/server";

const DEFAULT_LOG_FILE = "access.log";

function resolveLogFile(): string {
  const configurado = process.env.ACCESS_LOG_FILE?.trim() || DEFAULT_LOG_FILE;
  return path.isAbsolute(configurado) ? configurado : path.join(process.cwd(), configurado);
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
  const ahora = new Date();
  const fecha = ahora.toISOString().slice(0, 10);
  const hora = ahora.toTimeString().slice(0, 8);
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
  const ahora = new Date();
  const fecha = ahora.toISOString().slice(0, 10);
  const hora = ahora.toTimeString().slice(0, 8);
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
  const ahora = new Date();
  const fecha = ahora.toISOString().slice(0, 10);
  const hora = ahora.toTimeString().slice(0, 8);
  const linea = `${fecha}\t${hora}\t${nombre}\tCorreo cumpleaños lider\t${email}\n`;
  try {
    await appendFile(resolveLogFile(), linea, "utf-8");
  } catch (err) {
    console.error("No se pudo escribir el log de cumpleaños:", err);
  }
}
