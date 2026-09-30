import type { ReactNode } from 'react';

// FormError and FormNotice sit inside a paper card. This is the same idea at
// page level: a message above a list, on the light ground.
export function Notice({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'error';
  children: ReactNode;
}) {
  const colours =
    tone === 'error'
      ? 'border-rust bg-rust/10 text-rust-ink'
      : 'border-brass bg-brass/10 text-brass-ink';
  return (
    <p
      className={`mb-5 rounded-r-card border-l-[3px] px-4 py-3 text-[14px] ${colours}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      {children}
    </p>
  );
}
