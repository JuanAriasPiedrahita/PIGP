// Cálculo de edad a partir de la fecha de nacimiento. El año "centinela" (por
// defecto 1900) se usa como marcador de "fecha de nacimiento desconocida":
// si el líder nació ese año, se reporta edad 0 en vez de una edad absurda.

export function sentinelBirthYear(): number {
  return Number(process.env.SENTINEL_BIRTH_YEAR) || 1900;
}

export function calcularEdad(fechaNacimiento: string | null | undefined, sentinelYear: number): number {
  if (!fechaNacimiento) return 0;
  const nacimiento = new Date(fechaNacimiento);
  if (Number.isNaN(nacimiento.getTime())) return 0;
  if (nacimiento.getUTCFullYear() === sentinelYear) return 0;

  const hoy = new Date();
  let edad = hoy.getUTCFullYear() - nacimiento.getUTCFullYear();
  const noHaLlegadoElCumpleanos =
    hoy.getUTCMonth() < nacimiento.getUTCMonth() ||
    (hoy.getUTCMonth() === nacimiento.getUTCMonth() && hoy.getUTCDate() < nacimiento.getUTCDate());
  if (noHaLlegadoElCumpleanos) edad--;

  return Math.max(0, edad);
}
