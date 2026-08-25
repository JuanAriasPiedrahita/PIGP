import { ComunasManager } from "@/components/comunas/ComunasManager";

export default function ComunasPage() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Comunas y barrios</h2>
        <p className="text-sm text-slate-500">La ciudad se divide en comunas y cada comuna tiene varios barrios.</p>
      </div>
      <ComunasManager />
    </div>
  );
}
