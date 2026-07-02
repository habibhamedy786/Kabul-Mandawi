import { InputHTMLAttributes, forwardRef, TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className = "", id, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label htmlFor={id} className="text-sm font-medium text-ink-800">{label}</label>}
    <input
      ref={ref}
      id={id}
      className={`rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 ${className}`}
      {...props}
    />
    {error && <span className="text-xs text-red-600">{error}</span>}
  </div>
));
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ label, error, className = "", id, ...props }, ref) => (
  <div className="flex flex-col gap-1.5">
    {label && <label htmlFor={id} className="text-sm font-medium text-ink-800">{label}</label>}
    <textarea
      ref={ref}
      id={id}
      className={`rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 ${className}`}
      {...props}
    />
    {error && <span className="text-xs text-red-600">{error}</span>}
  </div>
));
Textarea.displayName = "Textarea";

export function Select({ label, className = "", children, id, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={id} className="text-sm font-medium text-ink-800">{label}</label>}
      <select
        id={id}
        className={`rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
