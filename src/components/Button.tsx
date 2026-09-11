import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base =
  'mt-[9px] w-full cursor-pointer rounded-card border px-4 py-3 text-[15px] ' +
  'transition-[background-color,transform] duration-[120ms] ' +
  'enabled:active:translate-y-px ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ' +
  'disabled:cursor-not-allowed disabled:opacity-55';

const variants: Record<Variant, string> = {
  primary:
    'border-transparent bg-brass font-semibold text-ink-deep enabled:hover:bg-brass-lit',
  ghost:
    'border-paper-edge bg-transparent font-medium text-graphite ' +
    'enabled:hover:bg-paper-dim enabled:hover:text-ink',
};

export function Button({ variant = 'primary', className = '', ...rest }: ButtonProps) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...rest} />;
}
