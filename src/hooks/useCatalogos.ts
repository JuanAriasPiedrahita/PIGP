"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import type { Zona, Puesto, Comuna, Barrio, Profesion, Ocupacion, Parentesco, Dependencia } from "@/lib/types";

export interface Catalogos {
  zonas: Zona[];
  puestos: Puesto[];
  comunas: Comuna[];
  barrios: Barrio[];
  profesiones: Profesion[];
  ocupaciones: Ocupacion[];
  parentescos: Parentesco[];
  dependencias: Dependencia[];
}

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

/**
 * Carga todos los catálogos de una vez (son listas pequeñas) para alimentar
 * los combos en cascada de los formularios de Líderes y Referidos.
 */
export function useCatalogos() {
  const [data, setData] = useState<Catalogos>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [zonas, puestos, comunas, barrios, profesiones, ocupaciones, parentescos, dependencias] = await Promise.all([
        apiGet<Zona[]>("/api/zonas"),
        apiGet<Puesto[]>("/api/puestos"),
        apiGet<Comuna[]>("/api/comunas"),
        apiGet<Barrio[]>("/api/barrios"),
        apiGet<Profesion[]>("/api/profesiones"),
        apiGet<Ocupacion[]>("/api/ocupaciones"),
        apiGet<Parentesco[]>("/api/parentescos"),
        apiGet<Dependencia[]>("/api/dependencias"),
      ]);
      setData({ zonas, puestos, comunas, barrios, profesiones, ocupaciones, parentescos, dependencias });
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
