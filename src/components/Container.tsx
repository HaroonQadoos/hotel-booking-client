import type { ReactNode } from 'react';

// The reading column every page and the header share. Pages opt into it per
// section, so a hero can run edge to edge while the content below does not.
export function Container({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>;
}
