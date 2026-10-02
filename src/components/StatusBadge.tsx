import type { BookingStatus } from '../api';

// One word, one colour. Pending is brass because it is where every booking
// starts — it waits there until the front desk accepts it.
const styles: Record<BookingStatus, string> = {
  pending: 'border-brass/50 bg-brass/10 text-brass-ink',
  confirmed: 'border-graphite/40 bg-graphite/10 text-graphite',
  cancelled: 'border-rust/40 bg-rust/10 text-rust-ink',
};

const labels: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-block rounded-card border px-2 py-[2px] text-[12px] font-medium tracking-[0.02em] uppercase ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
