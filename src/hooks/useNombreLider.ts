import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** Nombre del líder autenticado en /captura; redirige a /login si la sesión no es válida. */
export function useNombreLider(): string | null {
  const router = useRouter();
  const [nombre, setNombre] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/captura/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => setNombre(data.nombre))
      .catch(() => router.replace("/login"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return nombre;
}
