import { NextRequest, NextResponse } from "next/server";
import { leerPlantilla, guardarPlantilla } from "@/lib/plantillas";
import { getParametros, actualizarAsuntoPlantilla } from "@/lib/parametros";

export const dynamic = "force-dynamic";

const ENV_VAR = "PLANTILLA_CUMPLEANOS_LIDER_FILE";
const DEFAULT_PATH = "plantillas/cumpleanos_lider.txt";

export async function GET() {
  const contenido = await leerPlantilla(ENV_VAR, DEFAULT_PATH);
  const asunto = (await getParametros()).plantilla_cumpleanos_lider_asunto;
  return NextResponse.json({ contenido, asunto });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const contenido = typeof body.contenido === "string" ? body.contenido : "";
  const asunto = String(body.asunto || "").trim();
  if (!asunto || asunto.length > 200) {
    return NextResponse.json({ error: "Hay valores inválidos", fields: { asunto: "Obligatorio, máximo 200 caracteres" } }, { status: 400 });
  }
  await guardarPlantilla(ENV_VAR, DEFAULT_PATH, contenido);
  await actualizarAsuntoPlantilla("plantilla_cumpleanos_lider_asunto", asunto);
  return NextResponse.json({ ok: true });
}
