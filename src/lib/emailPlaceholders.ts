import type { Sexo } from "@/lib/types";

export interface LiderPlaceholderData {
  nombre: string;
  apellidos: string;
  sexo: Sexo;
  direccion: string | null;
  barrio_nombre?: string | null;
  comuna_descripcion?: string | null;
  puesto_nombre?: string | null;
  email: string | null;
  celular: string | null;
}

/**
 * Reemplaza placeholders tipo "$nombre" en un texto usando los datos de un
 * líder. Las variantes masculino/femenino ($o, $a, $sexo, $genero) dependen
 * de `lider.sexo`. Se captura la palabra completa después del "$" para que
 * "$apellido" no sea interpretado como el placeholder "$a" seguido de texto.
 */
export function reemplazarPlaceholders(texto: string, lider: LiderPlaceholderData): string {
  const esMasculino = lider.sexo === "MASCULINO";
  const valores: Record<string, string> = {
    nombre: lider.nombre,
    apellido: lider.apellidos,
    o: esMasculino ? "o" : "a",
    a: esMasculino ? "" : "a",
    sexo: esMasculino ? "hombre" : "mujer",
    genero: esMasculino ? "masculino" : "femenino",
    direccion: lider.direccion || "",
    barrio: lider.barrio_nombre || "",
    comuna: lider.comuna_descripcion || "",
    puesto: lider.puesto_nombre || "",
    email: lider.email || "",
    telefono: lider.celular || "",
  };

  return texto.replace(/\$(\w+)/g, (match, clave: string) => {
    const valor = valores[clave.toLowerCase()];
    return valor !== undefined ? valor : match;
  });
}
