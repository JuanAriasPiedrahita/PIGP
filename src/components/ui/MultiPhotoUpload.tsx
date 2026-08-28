"use client";

import { useEffect, useRef, useState } from "react";
import { Lightbox } from "./Lightbox";

interface Props {
  existentes: string[];
  onExistentesChange: (rutas: string[]) => void;
  onNuevosChange: (archivos: File[]) => void;
  disabled?: boolean;
}

function ZoomIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" strokeLinecap="round" />
    </svg>
  );
}

/** Selector de varias fotos: muestra miniaturas de las ya guardadas (removibles, ampliables) y permite agregar nuevas. */
export function MultiPhotoUpload({ existentes, onExistentesChange, onNuevosChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [nuevos, setNuevos] = useState<{ file: File; preview: string }[]>([]);
  const [ampliada, setAmpliada] = useState<string | null>(null);

  useEffect(() => {
    return () => nuevos.forEach((n) => URL.revokeObjectURL(n.preview));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function agregarArchivos(files: FileList | null) {
    if (!files) return;
    const nuevosConPreview = Array.from(files).map((file) => ({ file, preview: URL.createObjectURL(file) }));
    const combinados = [...nuevos, ...nuevosConPreview];
    setNuevos(combinados);
    onNuevosChange(combinados.map((n) => n.file));
    if (inputRef.current) inputRef.current.value = "";
  }

  function quitarExistente(ruta: string) {
    onExistentesChange(existentes.filter((r) => r !== ruta));
  }

  function quitarNuevo(index: number) {
    URL.revokeObjectURL(nuevos[index].preview);
    const combinados = nuevos.filter((_, i) => i !== index);
    setNuevos(combinados);
    onNuevosChange(combinados.map((n) => n.file));
  }

  const hayFotos = existentes.length > 0 || nuevos.length > 0;

  return (
    <div className="space-y-2">
      {hayFotos && (
        <div className="flex flex-wrap gap-2">
          {existentes.map((ruta) => (
            <div key={ruta} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setAmpliada(ruta)}
                className="absolute inset-0 flex items-center justify-center bg-slate-900/0 text-transparent transition-colors group-hover:bg-slate-900/40 group-hover:text-white"
                aria-label="Ampliar foto"
              >
                <ZoomIcon />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ruta} alt="Foto de la gestión" className="h-full w-full object-cover" />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => quitarExistente(ruta)}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-red-600"
                  aria-label="Quitar foto"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {nuevos.map((n, i) => (
            <div key={n.preview} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setAmpliada(n.preview)}
                className="absolute inset-0 flex items-center justify-center bg-slate-900/0 text-transparent transition-colors group-hover:bg-slate-900/40 group-hover:text-white"
                aria-label="Ampliar foto"
              >
                <ZoomIcon />
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={n.preview} alt="Foto nueva" className="h-full w-full object-cover" />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => quitarNuevo(i)}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-red-600"
                  aria-label="Quitar foto"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        disabled={disabled}
        onChange={(e) => agregarArchivos(e.target.files)}
        className="hidden"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="btn-secondary !px-2.5 !py-1 text-xs disabled:opacity-40"
      >
        Agregar fotos
      </button>

      <Lightbox src={ampliada} onClose={() => setAmpliada(null)} />
    </div>
  );
}
