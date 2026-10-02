import { formatPrice } from '../format';

// The small brass tag that marks a price as reduced. Brass rather than red:
// a sale is good news here, and rust is kept for errors and cancellations.
export function SaleBadge({ percent, className = '' }: { percent: number; className?: string }) {
  return (
    <span
      className={`inline-block rounded-full bg-brass px-2 py-[2px] text-[12px] leading-[1.4] font-semibold text-ink-deep tabular-nums ${className}`}
    >
      <span className="sr-only">{percent}% off</span>
      <span aria-hidden="true">−{percent}%</span>
    </span>
  );
}

// The price before the sale, struck through beside the one that applies.
// Colour comes from the caller, since it sits on paper and on photos alike.
export function WasPrice({ amount, className = '' }: { amount: number; className?: string }) {
  return (
    <s className={`decoration-1 ${className}`}>
      <span className="sr-only">was </span>
      {formatPrice(amount)}
    </s>
  );
}
