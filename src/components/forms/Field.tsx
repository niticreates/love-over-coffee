import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function Field({ label, name, error, hint, children }: { label: string; name: string; error?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p id={`${name}-error`} className="field-error" role="alert">{error}</p>}
    </div>
  );
}

export function TextInput({ name, error, ...rest }: InputHTMLAttributes<HTMLInputElement> & { name: string; error?: string }) {
  return <input id={name} name={name} className="input" aria-invalid={error ? true : undefined} aria-describedby={error ? `${name}-error` : undefined} {...rest} />;
}

export function TextArea({ name, error, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { name: string; error?: string }) {
  return <textarea id={name} name={name} className="input min-h-[120px]" aria-invalid={error ? true : undefined} aria-describedby={error ? `${name}-error` : undefined} {...rest} />;
}
