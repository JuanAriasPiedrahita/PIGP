export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const cron = await import("node-cron");
  const { enviarCumpleanosDeHoy } = await import("@/lib/cumpleanosLideres");
  const { enviarVencimientosDeHoy } = await import("@/lib/vencimientoGestiones");

  cron.schedule(
    "0 6 * * *",
    () => {
      if (process.env.DESPACHO_AUTOMATICO_CUMPLEANOS !== "1") {
        console.log("Despacho automático de cumpleaños de líderes deshabilitado (DESPACHO_AUTOMATICO_CUMPLEANOS != 1), se omite.");
        return;
      }
      enviarCumpleanosDeHoy().catch((err) => console.error("Error en el cron de cumpleaños de líderes:", err));
    },
    { timezone: "America/Bogota" }
  );
  console.log("Cron de cumpleaños de líderes registrado (6:00am hora Bogotá).");

  cron.schedule(
    "30 6 * * *",
    () => {
      if (process.env.DESPACHO_AUTOMATICO_VENCIMIENTO_GESTION !== "1") {
        console.log("Despacho automático de vencimiento de gestiones deshabilitado (DESPACHO_AUTOMATICO_VENCIMIENTO_GESTION != 1), se omite.");
        return;
      }
      enviarVencimientosDeHoy().catch((err) => console.error("Error en el cron de vencimiento de gestiones:", err));
    },
    { timezone: "America/Bogota" }
  );
  console.log("Cron de vencimiento de gestiones registrado (6:30am hora Bogotá).");
}
