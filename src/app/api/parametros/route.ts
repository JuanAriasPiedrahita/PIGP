import { NextRequest, NextResponse } from "next/server";
import { getParametros, actualizarParametros } from "@/lib/parametros";
import { friendlyDbError } from "@/lib/db";
import { isValidEmail } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getParametros());
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}

function numeroEntero(valor: unknown, min: number, max: number): number | null {
  const n = Number(valor);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const anioActual = new Date().getFullYear();

    const sentinel_birth_year = numeroEntero(body.sentinel_birth_year, 1900, anioActual);
    const contrato_meses_alerta = numeroEntero(body.contrato_meses_alerta, 1, 24);
    const gestiones_vencimiento_dias_alerta = numeroEntero(body.gestiones_vencimiento_dias_alerta, 0, 90);
    const lideres_page_size = numeroEntero(body.lideres_page_size, 5, 100);
    const correo_gestion_contratos = String(body.correo_gestion_contratos || "").trim();

    const fields: Record<string, string> = {};
    if (sentinel_birth_year === null) fields.sentinel_birth_year = `Debe ser un año entre 1900 y ${anioActual}`;
    if (contrato_meses_alerta === null) fields.contrato_meses_alerta = "Debe ser un número entero entre 1 y 24";
    if (gestiones_vencimiento_dias_alerta === null) fields.gestiones_vencimiento_dias_alerta = "Debe ser un número entero entre 0 y 90";
    if (lideres_page_size === null) fields.lideres_page_size = "Debe ser un número entero entre 5 y 100";
    if (correo_gestion_contratos && (!isValidEmail(correo_gestion_contratos) || correo_gestion_contratos.length > 150)) {
      fields.correo_gestion_contratos = "Debe ser un email válido, máximo 150 caracteres";
    }

    if (Object.keys(fields).length > 0) {
      return NextResponse.json({ error: "Hay valores inválidos", fields }, { status: 400 });
    }

    const data = {
      sentinel_birth_year: sentinel_birth_year!,
      contrato_meses_alerta: contrato_meses_alerta!,
      gestiones_vencimiento_dias_alerta: gestiones_vencimiento_dias_alerta!,
      lideres_page_size: lideres_page_size!,
      despacho_automatico_cumpleanos: Boolean(body.despacho_automatico_cumpleanos),
      despacho_automatico_vencimiento_gestion: Boolean(body.despacho_automatico_vencimiento_gestion),
      correo_gestion_contratos,
    };

    await actualizarParametros(data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const { message, status } = friendlyDbError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
