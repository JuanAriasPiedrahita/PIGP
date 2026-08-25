"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { StatCard } from "@/components/dashboard/StatCard";
import { useToast } from "@/components/ui/Toast";

interface DashboardData {
  totalLideres: number;
  lideresActivos: number;
  lideresInactivos: number;
  totalReferidos: number;
  referidosQueVotaron: number;
  referidosDamnificados: number;
  porComuna: { comuna: string; total: number }[];
  topLideres: { id: number; nombre: string; total_referidos: number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    apiGet<DashboardData>("/api/dashboard")
      .then(setData)
      .catch((err) => toast.show(err.message, "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maxComuna = data ? Math.max(1, ...data.porComuna.map((c) => c.total)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Resumen general</h2>
        <p className="text-sm text-slate-500">Estado actual de la red de colaboradores de la campaña.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-24 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total de líderes"
              value={data?.totalLideres ?? 0}
              sublabel={`${data?.lideresActivos ?? 0} activos · ${data?.lideresInactivos ?? 0} inactivos`}
              accent="brand"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" strokeLinecap="round" />
                </svg>
              }
            />
            <StatCard
              label="Total de referidos"
              value={data?.totalReferidos ?? 0}
              sublabel={`${data?.referidosQueVotaron ?? 0} votaron la vez pasada`}
              accent="emerald"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24">
                  <circle cx="9" cy="7" r="3.2" />
                  <circle cx="17" cy="9.5" r="2.6" />
                  <path d="M2.5 21c0-3.6 3-5.8 6.5-5.8s6.5 2.2 6.5 5.8" strokeLinecap="round" />
                </svg>
              }
            />
            <StatCard
              label="Promedio referidos / líder"
              value={data && data.totalLideres > 0 ? (data.totalReferidos / data.totalLideres).toFixed(1) : "0"}
              accent="amber"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24">
                  <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 7h7v7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
            <StatCard
              label="Damnificados terremoto"
              value={data?.referidosDamnificados ?? 0}
              accent="slate"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="24" height="24">
                  <path d="M3 12l4-8 4 6 3-4 7 6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3 19h18" strokeLinecap="round" />
                </svg>
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="card p-5">
              <h3 className="mb-4 text-sm font-semibold text-slate-700">Líderes por comuna</h3>
              <div className="space-y-3">
                {data?.porComuna.length ? (
                  data.porComuna.map((c) => (
                    <div key={c.comuna}>
                      <div className="mb-1 flex justify-between text-xs text-slate-500">
                        <span>{c.comuna}</span>
                        <span>{c.total}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100">
                        <div
                          className="h-2 rounded-full bg-brand-600"
                          style={{ width: `${(c.total / maxComuna) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">Aún no hay comunas registradas.</p>
                )}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="mb-4 text-sm font-semibold text-slate-700">Líderes con más referidos</h3>
              <ul className="divide-y divide-slate-100">
                {data?.topLideres.length ? (
                  data.topLideres.map((l, idx) => (
                    <li key={l.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-slate-700">{l.nombre}</span>
                      </div>
                      <span className="badge bg-brand-50 text-brand-700">{l.total_referidos} referidos</span>
                    </li>
                  ))
                ) : (
                  <p className="py-2 text-sm text-slate-400">Aún no hay líderes registrados.</p>
                )}
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/lideres" className="btn-primary">
              Gestionar líderes
            </Link>
            <Link href="/referidos" className="btn-secondary">
              Gestionar referidos
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
