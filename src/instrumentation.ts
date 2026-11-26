export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const cron = await import("node-cron");
  const { enviarCumpleanosDeHoy } = await import("@/lib/cumpleanosLideres");
  const { enviarVencimientosDeHoy } = await import("@/lib/vencimientoGestiones");
  const { enviarVencimientosContratoDeHoy } = await import("@/lib/vencimientoContratos");
  const { getParametros } = await import("@/lib/parametros");

  cron.schedule(
    "0 6 * * *",
    async () => {
      const parametros = await getParametros();
      if (!parametros.despacho_automatico_cumpleanos) {
        console.log("Despacho automático de cumpleaños de líderes deshabilitado (Configuración > Parámetros), se omite.");
        return;
      }
      enviarCumpleanosDeHoy().catch((err) => console.error("Error en el cron de cumpleaños de líderes:", err));
    },
    { timezone: "America/Bogota" }
  );
  console.log("Cron de cumpleaños de líderes registrado (6:00am hora Bogotá).");

  cron.schedule(
    "30 6 * * *",
    async () => {
      const parametros = await getParametros();
      if (!parametros.despacho_automatico_vencimiento_gestion) {
        console.log("Despacho automático de vencimiento de gestiones deshabilitado (Configuración > Parámetros), se omite.");
        return;
      }
      enviarVencimientosDeHoy().catch((err) => console.error("Error en el cron de vencimiento de gestiones:", err));
    },
    { timezone: "America/Bogota" }
  );
  console.log("Cron de vencimiento de gestiones registrado (6:30am hora Bogotá).");

  cron.schedule(
    "0 7 * * *",
    async () => {
      const parametros = await getParametros();
      if (!parametros.despacho_automatico_vencimiento_contrato) {
        console.log("Despacho automático de vencimiento de contratos deshabilitado (Configuración > Parámetros), se omite.");
        return;
      }
      enviarVencimientosContratoDeHoy().catch((err) => console.error("Error en el cron de vencimiento de contratos:", err));
    },
    { timezone: "America/Bogota" }
  );
  console.log("Cron de vencimiento de contratos registrado (7:00am hora Bogotá).");
}
