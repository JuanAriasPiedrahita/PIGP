"use client";

import { useRef, useState, useEffect } from "react";

interface PhotoUploadProps {
  initialUrl?: string | null;
  onFileSelected: (file: File | null) => void;
  onRemove?: () => void;
}

/** Selector de foto con preview tamaño "carné" (estilo credencial). */
export function PhotoUpload({ initialUrl, onFileSelected, onRemove }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(initialUrl || null);

  useEffect(() => {
    setPreview(initialUrl || null);
  }, [initialUrl]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    onFileSelected(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  }

  function handleRemove() {
    setPreview(null);
    onFileSelected(null);
    onRemove?.();
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="h-32 w-24 overflow-hidden rounded-md border-2 border-slate-200 bg-slate-100 shadow-sm">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Foto" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="36" height="36">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleChange} className="hidden" />
      {preview ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            title="Cambiar foto"
            aria-label="Cambiar foto"
            className="btn-secondary !px-2 !py-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleRemove}
            title="Eliminar foto"
            aria-label="Eliminar foto"
            className="btn-secondary !px-2 !py-1 text-red-500 hover:text-red-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} className="btn-secondary !px-2.5 !py-1 text-xs">
          Subir foto
        </button>
      )}
    </div>
  );
}
