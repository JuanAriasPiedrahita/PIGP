// Parseo y validación de la sección "Contratista" del formulario de líder.
// Si el checkbox no está marcado, los campos dependientes se limpian (null).

export interface ContratistaFields {
  contratista: 0 | 1;
  objeto_contrato: string | null;
  vencimiento_contrato: string | null;
  dependencia_id: string | null;
}

export function parseContratista(form: FormData): { data: ContratistaFields; error?: string } {
  const marcado = form.get("contratista") === "true" || form.get("contratista") === "on";

  if (!marcado) {
    return { data: { contratista: 0, objeto_contrato: null, vencimiento_contrato: null, dependencia_id: null } };
  }

  const objeto_contrato = String(form.get("objeto_contrato") || "").trim();
  const vencimiento_contrato = String(form.get("vencimiento_contrato") || "").trim();
  const dependencia_id = form.get("dependencia_id");

  if (!objeto_contrato || !vencimiento_contrato || !dependencia_id) {
    return {
      data: { contratista: 1, objeto_contrato: null, vencimiento_contrato: null, dependencia_id: null },
      error: "Si es contratista, complete objeto del contrato, vencimiento y dependencia.",
    };
  }

  return {
    data: {
      contratista: 1,
      objeto_contrato,
      vencimiento_contrato,
      dependencia_id: String(dependencia_id),
    },
  };
}
