import type { ReactNode } from 'react';

// FormError and FormNotice sit inside a paper card. This is the same idea for
// the dark ground: a page-level message above a list.
export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'error';
  children: ReactNode;
}) {
  const colours =
    tone === 'error'
      ? 'border-rust bg-rust/15 text-paper'
      : 'border-brass bg-brass/15 text-cream';
  return (
    <p
      className={`mb-5 rounded-r-card border-l-[3px] px-4 py-3 text-[14px] ${colours}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </p>
  );
}
