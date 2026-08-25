import { ZonasManager } from "@/components/zonas/ZonasManager";

export default function ZonasPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Zonas y puestos de votación</h2>
        <p className="text-sm text-slate-500">Cada zona se identifica con 2 dígitos; cada puesto pertenece a una zona.</p>
      </div>
      <ZonasManager />
    </div>
  );
}
