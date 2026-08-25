"use client";

import { useRef, useState, useEffect } from "react";

interface PhotoUploadProps {
  initialUrl?: string | null;
  onFileSelected: (file: File | null) => void;
}

/** Selector de foto con preview tamaño "carné" (estilo credencial). */
export function PhotoUpload({ initialUrl, onFileSelected }: PhotoUploadProps) {
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
      <button type="button" onClick={() => inputRef.current?.click()} className="btn-secondary !px-2.5 !py-1 text-xs">
        {preview ? "Cambiar foto" : "Subir foto"}
      </button>
    </div>
  );
}
