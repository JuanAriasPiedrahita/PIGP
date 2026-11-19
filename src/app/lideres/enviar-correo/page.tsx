"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPostJson } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

interface DestinatarioPreview {
  id: number;
  nombre: string;
  apellidos: string;
  email: string | null;
}

interface EnvioResultado {
  enviados: number;
  omitidos: { id: number; nombre: string }[];
  fallidos: { id: number; nombre: string; error: string }[];
}

const SESSION_KEY = "pigp:lideres:envio-correo";

const PLACEHOLDERS: [string, string][] = [
  ["$nombre", "nombre"],
  ["$apellido", "apellido"],
  ["$o", '"o" (masc.) / "a" (fem.) — ej: estimad$o'],
  ["$a", '"" (masc.) / "a" (fem.) — ej: señor$a'],
  ["$sexo", "hombre / mujer"],
  ["$genero", "masculino / femenino"],
  ["$direccion", "dirección"],
  ["$barrio", "barrio"],
  ["$comuna", "comuna"],
  ["$puesto", "puesto de votación"],
  ["$email", "email"],
  ["$telefono", "celular"],
];

export default function EnviarCorreoPage() {
  const router = useRouter();
  const toast = useToast();
  const [destinatarios, setDestinatarios] = useState<DestinatarioPreview[] | null>(null);
  const [asunto, setAsunto] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [sending, setSending] = useState(false);
  const [placeholdersOpen, setPlaceholdersOpen] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    try {
      setDestinatarios(raw ? JSON.parse(raw) : []);
    } catch {
      setDestinatarios([]);
    }
  }, []);

  if (destinatarios === null) return null;

  const conEmail = destinatarios.filter((d) => d.email);
  const sinEmail = destinatarios.filter((d) => !d.email);

  async function handleSend() {
    if (!asunto.trim() || !cuerpo.trim()) {
      toast.show("Complete el asunto y el cuerpo del mensaje", "error");
      return;
    }
    setSending(true);
    try {
      const resultado = await apiPostJson<EnvioResultado>("/api/lideres/enviar-correo", {
        liderIds: conEmail.map((d) => d.id),
        asunto,
        cuerpo,
      });
      const partes = [`${resultado.enviados} correo(s) enviado(s)`];
      if (resultado.fallidos.length) partes.push(`${resultado.fallidos.length} fallido(s)`);
      toast.show(partes.join(" · "), resultado.fallidos.length ? "error" : "success");
      sessionStorage.removeItem(SESSION_KEY);
      router.push("/lideres");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Error al enviar los correos", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-5">
      <Link href="/lideres" className="text-sm text-brand-600 hover:underline">
        ← Líderes
      </Link>

      <h1 className="text-2xl font-bold text-slate-900">Redactar Email a Líderes</h1>

      <div className="card space-y-3 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Destinatarios ({conEmail.length} con email)
        </p>
        {sinEmail.length > 0 && (
          <div className="border-t border-slate-100 pt-3">
            <p className="mb-2 text-sm text-amber-600">Sin email registrado:</p>
            <div className="flex flex-wrap gap-2">
              {sinEmail.map((d) => (
                <span key={d.id} className="badge bg-amber-50 text-amber-700">
                  {d.nombre} {d.apellidos}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card overflow-hidden p-0">
        <button
          className="flex w-full items-center gap-2 px-5 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
          onClick={() => setPlaceholdersOpen((v) => !v)}
        >
          <span>{placeholdersOpen ? "▼" : "▶"}</span> Placeholders disponibles
        </button>
        {placeholdersOpen && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-t border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-2 font-medium">Placeholder</th>
                <th className="px-5 py-2 font-medium">Reemplaza con</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PLACEHOLDERS.map(([ph, desc]) => (
                <tr key={ph}>
                  <td className="px-5 py-2">
                    <code className="text-brand-700">{ph}</code>
                  </td>
                  <td className="px-5 py-2 text-slate-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {conEmail.length === 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Ninguno de los líderes seleccionados tiene email registrado.
        </div>
      ) : (
        <div className="card space-y-4 p-5">
          <div>
            <label className="field-label">Asunto</label>
            <input
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              className="field-input"
              placeholder="Asunto del mensaje"
            />
          </div>
          <div>
            <label className="field-label">Cuerpo del mensaje</label>
            <textarea
              value={cuerpo}
              onChange={(e) => setCuerpo(e.target.value)}
              className="field-input min-h-[200px]"
              placeholder="Escriba el mensaje. Puede usar placeholders como $nombre, $sexo, etc."
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button className="btn-secondary" onClick={() => router.push("/lideres")} disabled={sending}>
              Cancelar
            </button>
            <button className="btn-primary" onClick={handleSend} disabled={sending}>
              {sending ? "Enviando..." : `Enviar a ${conEmail.length} líder(es)`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
