import { useState } from 'react';
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
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="mb-[15px]">
      <div className="mb-[5px] flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-graphite">
          {label}
        </label>
        {labelAside}
      </div>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputBase} ${isPassword ? 'pr-[70px]' : ''} ${error ? inputInvalid : inputOk}`}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            disabled={disabled}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className=" cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 px-1 text-[12px] font-medium text-brass-ink underline underline-offset-2 hover:text-ink disabled:text-graphite-soft"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        ) : null}
      </div>
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
