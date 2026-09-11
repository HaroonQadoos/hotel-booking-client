import type { ReactNode } from 'react';

interface FieldProps {
  id: string;
  label: string;
  /** Rendered right-aligned on the label row — e.g. a "Forgot password?" link. */
  labelAside?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  hint?: string;
  error?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

const inputBase =
  'w-full rounded-card border bg-paper-raised px-3 py-[11px] text-[15px] text-ink ' +
  'transition-[border-color,box-shadow] duration-[120ms] ' +
  'focus-visible:outline-none focus-visible:ring-[3px] ' +
  'disabled:bg-paper-dim disabled:text-graphite-soft';

const inputOk = 'border-paper-edge focus-visible:border-brass focus-visible:ring-brass/25';
const inputInvalid = 'border-rust focus-visible:border-rust focus-visible:ring-rust/20';

export function Field({
  id,
  label,
  labelAside,
  value,
  onChange,
  type = 'text',
  hint,
  error,
  autoComplete,
  autoFocus,
  disabled,
}: FieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="mb-[15px]">
      <div className="mb-[5px] flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-graphite">
          {label}
        </label>
        {labelAside}
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${inputBase} ${error ? inputInvalid : inputOk}`}
      />
      {error ? (
        <p className="mt-[5px] text-[12.5px] text-rust" id={`${id}-error`}>
          {error}
        </p>
      ) : hint ? (
        <p className="mt-[5px] text-[12.5px] text-graphite-soft" id={`${id}-hint`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
