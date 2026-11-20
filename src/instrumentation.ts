export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const cron = await import("node-cron");
  const { enviarCumpleanosDeHoy } = await import("@/lib/cumpleanosLideres");

  cron.schedule(
    "0 6 * * *",
    () => {
      enviarCumpleanosDeHoy().catch((err) => console.error("Error en el cron de cumpleaños de líderes:", err));
    },
    { timezone: "America/Bogota" }
  );
}
