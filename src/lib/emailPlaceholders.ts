import type { Sexo } from "@/lib/types";

export const LIDER_PLACEHOLDERS: [string, string][] = [
  ["$nombre", "nombre"],
  ["$apellido", "apellido"],
  ["$o", '"o" (masc.) / "a" (fem.) — ej: estimad$o'],
  ["$a", '"" (masc.) / "a" (fem.) — ej: señor$a'],
  ["$sexo", "hombre / mujer"],
  ["$genero", "masculino / femenino"],
  ["$direccion", "dirección"],
  ["$barrio", "barrio"],
  ["$comuna", "comuna"],
  ["$puesto", "puesto de votación"],
  ["$email", "email"],
  ["$telefono", "celular"],
];

/** Placeholders de gestión (gestor/tipo de ayuda/referido), usados tanto en "Gestiones nuevas" como en "Vencimiento gestiones". */
export const GESTION_PLACEHOLDERS: [string, string][] = [
  ["$nombre", "nombre del gestor responsable"],
  ["$ayuda", "descripción del tipo de ayuda"],
  ["$fecha", "fecha límite de la gestión"],
  ["$observaciones", "observaciones registradas"],
  ["$referido", "nombre completo del referido que requiere la gestión"],
  ["$telefono", "celular del referido"],
];

/** Placeholders de contrato (líder contratista), usados en "Vencimiento contratos". */
export const CONTRATO_PLACEHOLDERS: [string, string][] = [
  ["$nombre", "nombre del líder contratista"],
  ["$apellido", "apellidos del líder contratista"],
  ["$objeto", "objeto del contrato"],
  ["$vencimiento", "fecha de vencimiento del contrato"],
  ["$dependencia", "dependencia a la que pertenece el contrato"],
];

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
