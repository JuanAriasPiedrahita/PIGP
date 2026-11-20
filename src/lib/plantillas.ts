import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";

function resolvePlantillaFile(envVar: string, defaultPath: string): string {
  const configurado = process.env[envVar]?.trim() || defaultPath;
  return path.isAbsolute(configurado) ? configurado : path.join(process.cwd(), configurado);
}

/** Lee el contenido de una plantilla de correo (texto plano). Si el archivo no existe aún, devuelve "". */
export async function leerPlantilla(envVar: string, defaultPath: string): Promise<string> {
  try {
    return await readFile(resolvePlantillaFile(envVar, defaultPath), "utf-8");
  } catch {
    return "";
  }
}

export async function guardarPlantilla(envVar: string, defaultPath: string, contenido: string): Promise<void> {
  const archivo = resolvePlantillaFile(envVar, defaultPath);
  await mkdir(path.dirname(archivo), { recursive: true });
  await writeFile(archivo, contenido, "utf-8");
}

/** Reemplaza placeholders tipo "$nombre" en una plantilla de correo según un mapa de valores. */
export function reemplazarPlaceholdersPlantilla(texto: string, valores: Record<string, string>): string {
  return texto.replace(/\$(\w+)/g, (match, clave: string) => {
    const valor = valores[clave.toLowerCase()];
    return valor !== undefined ? valor : match;
  });
}
