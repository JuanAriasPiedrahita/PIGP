"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import type { TipoAyuda, Gestor } from "@/lib/types";

export function useGestionCatalogos() {
  const [tiposAyuda, setTiposAyuda] = useState<TipoAyuda[]>([]);
  const [gestores, setGestores] = useState<Gestor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiGet<TipoAyuda[]>("/api/tipos-ayuda"), apiGet<Gestor[]>("/api/gestores")])
      .then(([t, g]) => {
        setTiposAyuda(t);
        setGestores(g);
      })
      .finally(() => setLoading(false));
  }, []);

  return { tiposAyuda, gestores, loading };
}
