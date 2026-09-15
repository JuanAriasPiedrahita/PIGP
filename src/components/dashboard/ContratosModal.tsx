"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { apiGet } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { Contrato } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

const ESTADO_ROW_CLASS: Record<Contrato["estado"], string> = {
  vencido: "bg-red-50",
  proximo: "bg-amber-50",
  vigente: "",
};

const ESTADO_BADGE: Record<Contrato["estado"], string> = {
  vencido: "bg-red-100 text-red-700",
  proximo: "bg-amber-100 text-amber-700",
  vigente: "bg-emerald-50 text-emerald-700",
};

const ESTADO_LABEL: Record<Contrato["estado"], string> = {
  vencido: "Vencido",
  proximo: "Por vencer",
  vigente: "Vigente",
};

export function ContratosModal({ open, onClose }: Props) {
  const router = useRouter();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiGet<Contrato[]>("/api/lideres/contratos")
      .then(setContratos)
      .catch((err) => toast.show(err instanceof Error ? err.message : "Error cargando los contratos", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} title="Contratos de líderes contratistas" widthClass="max-w-3xl">
      {loading ? (
        <div className="space-y-2 py-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}
        </div>
      ) : contratos.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">No hay líderes marcados como contratistas.</p>
      ) : (
        <div className="thin-scroll overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3 font-medium">Líder</th>
                <th className="px-3 py-2 font-medium">Objeto del contrato</th>
                <th className="px-3 py-2 font-medium">Dependencia</th>
                <th className="px-3 py-2 font-medium">Vencimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contratos.map((c, i) => (
                <tr
                  key={i}
                  onClick={() => router.push(`/lideres?lider_id=${c.lider_id}`)}
                  className={`cursor-pointer hover:brightness-95 ${ESTADO_ROW_CLASS[c.estado]}`}
                >
                  <td className="py-2 pr-3 font-medium text-slate-800">{c.lider_nombre}</td>
                  <td className="px-3 py-2 text-slate-600">{c.objeto_contrato}</td>
                  <td className="px-3 py-2 text-slate-600">{c.dependencia_descripcion || "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`badge ${ESTADO_BADGE[c.estado]}`}>
                      {c.vencimiento_contrato?.slice(0, 10)} · {ESTADO_LABEL[c.estado]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
