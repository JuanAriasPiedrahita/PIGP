"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import type { Catalogos } from "@/hooks/useCatalogos";
import type { Zona, Puesto, Comuna, Barrio, Parentesco } from "@/lib/types";

const EMPTY: Catalogos = {
  zonas: [],
  puestos: [],
  comunas: [],
  barrios: [],
  profesiones: [],
  ocupaciones: [],
  parentescos: [],
  dependencias: [],
};

interface CapturaCatalogosResponse {
  zonas: Zona[];
  puestos: Puesto[];
  comunas: Comuna[];
  barrios: Barrio[];
  parentescos: Parentesco[];
}

/**
 * Catálogos de solo lectura para el formulario de referidos en /captura
 * (zonas, puestos, comunas, barrios, parentescos). No incluye profesiones,
 * ocupaciones ni dependencias porque esos campos son solo de líderes.
 */
export function useCapturaCatalogos() {
  const [data, setData] = useState<Catalogos>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGet<CapturaCatalogosResponse>("/api/captura/catalogos");
      setData({ ...EMPTY, ...res });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando catálogos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { ...data, loading, error, reload };
}
