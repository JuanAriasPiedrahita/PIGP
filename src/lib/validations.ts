// Validaciones compartidas entre formularios (cliente) y API routes (servidor).

export function isRequired(v: unknown): boolean {
  return v !== undefined && v !== null && String(v).trim().length > 0;
}

export function isValidCedula(v: string): boolean {
  return /^[0-9]{5,15}$/.test(v.trim());
}

export function isValidCelular(v: string): boolean {
  return /^[0-9+()\-\s]{7,20}$/.test(v.trim());
}

export function isValidEmail(v: string): boolean {
  if (!v) return true; // email es opcional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function isValidCodigo2(v: string): boolean {
  return /^[0-9]{2}$/.test(v.trim());
}

export interface FieldErrors {
  [field: string]: string;
}

export const REQUIRED_MSG = "Este campo es obligatorio";
