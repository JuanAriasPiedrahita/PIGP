// Clasificación de contratos de líderes contratistas según su fecha de
// vencimiento. El umbral de "por vencer" es configurable vía .env
// (CONTRATO_MESES_ALERTA, en meses; por defecto 1).

export function mesesAlertaVencimiento(): number {
  return Number(process.env.CONTRATO_MESES_ALERTA) || 1;
}

export type EstadoContrato = "vencido" | "proximo" | "vigente";

export function estadoContrato(fechaVencimiento: string | null | undefined, meses: number): EstadoContrato {
  if (!fechaVencimiento) return "vigente";
  const hoy = new Date(new Date().toDateString());
  const vencimiento = new Date(fechaVencimiento);
  if (Number.isNaN(vencimiento.getTime())) return "vigente";
  if (vencimiento < hoy) return "vencido";

  const limiteAlerta = new Date(hoy);
  limiteAlerta.setMonth(limiteAlerta.getMonth() + meses);
  if (vencimiento <= limiteAlerta) return "proximo";

  return "vigente";
}
