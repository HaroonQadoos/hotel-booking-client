import type { ReactNode } from 'react';

// Page-level heading on the dark ground. CardTitle is its counterpart on
// paper; the two differ in colour and size, not in voice.
export function PageTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <h1 className="font-serif text-[36px] leading-none font-normal tracking-[0.005em] text-cream">
        {children}
      </h1>
      {aside ? <div className="text-[14px] text-mist">{aside}</div> : null}
    </div>
  );
}
