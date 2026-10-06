import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface LiderSesionInfo {
  nombre: string;
  coordinadorLogistica: boolean;
}

/**
 * Sesión del líder autenticado en /captura, incluyendo si es "Coordinador
 * logística" (para habilitar edición de eventos y manejo de asistentes).
 * Redirige a /login si la sesión no es válida. Igual que useNombreLider
 * pero expone también el atributo de coordinador.
 */
export function useLiderSesion(): LiderSesionInfo | null {
  const router = useRouter();
  const [sesion, setSesion] = useState<LiderSesionInfo | null>(null);

  useEffect(() => {
    fetch("/api/captura/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setSesion({ nombre: data.nombre, coordinadorLogistica: !!data.coordinador_logistica }))
      .catch(() => router.replace("/login"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return sesion;
}
