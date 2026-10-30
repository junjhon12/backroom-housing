import {
  type FC,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

const CONTROL =
  'w-full border border-ink bg-cream px-3 py-2.5 font-mono text-sm text-ink placeholder:text-ink/40 disabled:opacity-50';

export const Input: FC<InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input className={`${CONTROL} ${className}`} {...props} />
);

export const Textarea: FC<TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...props }) => (
  <textarea className={`${CONTROL} ${className}`} {...props} />
);

export const Select: FC<SelectHTMLAttributes<HTMLSelectElement>> = ({ className = '', ...props }) => (
  <select className={`${CONTROL} ${className}`} {...props} />
);

interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}

export const Field: FC<FieldProps> = ({ label, htmlFor, hint, children }) => (
  <div className="space-y-1.5">
    <label
      htmlFor={htmlFor}
      className="block text-[10px] font-medium uppercase tracking-[0.18em] text-ink/70"
    >
      {label}
    </label>
    {children}
    {hint && <p className="text-[11px] leading-relaxed text-ink/60">{hint}</p>}
  </div>
);
