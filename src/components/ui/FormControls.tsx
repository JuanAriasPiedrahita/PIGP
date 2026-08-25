"use client";

import { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

interface FieldWrapProps {
  label: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  hint?: string;
}

export function FieldWrap({ label, error, required, children, hint }: FieldWrapProps) {
  return (
    <div>
      <label className="field-label">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, required, hint, className, ...rest }: InputProps) {
  return (
    <FieldWrap label={label} error={error} required={required} hint={hint}>
      <input
        {...rest}
        required={undefined}
        className={`field-input ${error ? "field-input-error" : ""} ${className || ""}`}
      />
    </FieldWrap>
  );
}

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ label, error, required, options, placeholder, className, ...rest }: SelectProps) {
  return (
    <FieldWrap label={label} error={error} required={required}>
      <select
        {...rest}
        required={undefined}
        className={`field-input ${error ? "field-input-error" : ""} ${className || ""}`}
      >
        <option value="">{placeholder || "Seleccione..."}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrap>
  );
}

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: ReactNode;
}

export function Checkbox({ label, checked, onChange, icon }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
      />
      {icon}
      <span>{label}</span>
    </label>
  );
}

interface RadioGroupProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}

export function RadioGroup({ label, name, value, onChange, options }: RadioGroupProps) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <div className="flex gap-4">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === String(opt.value)}
              onChange={(e) => onChange(e.target.value)}
              className="h-4 w-4 border-slate-300 text-brand-700 focus:ring-brand-500"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  );
}
