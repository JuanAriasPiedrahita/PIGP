import type { Sexo } from "@/lib/types";

/** Clase de color de texto según el sexo: azul para hombre, rojo para mujer. */
export function sexoTextClass(sexo: Sexo): string {
  return sexo === "MASCULINO" ? "text-blue-600" : "text-red-600";
}
