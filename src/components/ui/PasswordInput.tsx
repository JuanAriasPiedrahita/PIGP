"use client";

import { useState } from "react";
import { FieldWrap } from "./FormControls";

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  hint?: string;
  autoComplete?: string;
}

export function PasswordInput({ label, value, onChange, error, required, hint, autoComplete }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <FieldWrap label={label} error={error} required={required} hint={hint}>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete || "new-password"}
          className={`field-input pr-10 ${error ? "field-input-error" : ""}`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-slate-600"
          aria-label={visible ? "Ocultar clave" : "Mostrar clave"}
          tabIndex={-1}
        >
          {visible ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4.5 w-4.5" width="18" height="18">
              <path d="M3 3l18 18" strokeLinecap="round" />
              <path d="M10.6 10.6a2 2 0 002.8 2.8" strokeLinecap="round" />
              <path d="M9.4 5.5A9.8 9.8 0 0112 5c5 0 9 4.5 10 7-0.4 1-1.2 2.3-2.3 3.5M6.2 6.2C4 7.7 2.5 9.8 2 12c1 2.5 5 7 10 7 1.4 0 2.7-.3 3.9-.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="18" height="18">
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </FieldWrap>
  );
}
