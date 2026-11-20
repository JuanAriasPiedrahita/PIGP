import { NextRequest, NextResponse } from "next/server";
import { leerPlantilla, guardarPlantilla } from "@/lib/plantillas";

export const dynamic = "force-dynamic";

const ENV_VAR = "PLANTILLA_VENCIMIENTO_GESTION_FILE";
const DEFAULT_PATH = "plantillas/vencimiento_gestion.txt";

export async function GET() {
  const contenido = await leerPlantilla(ENV_VAR, DEFAULT_PATH);
  return NextResponse.json({ contenido });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const contenido = typeof body.contenido === "string" ? body.contenido : "";
  await guardarPlantilla(ENV_VAR, DEFAULT_PATH, contenido);
  return NextResponse.json({ ok: true });
}
