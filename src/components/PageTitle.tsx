import type { ReactNode } from 'react';

// Page-level heading on the white page: a brass eyebrow over a large serif
// title. CardTitle is its counterpart inside a paper card.
export function PageTitle({
  children,
  eyebrow,
  aside,
}: {
  children: ReactNode;
  eyebrow?: string;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-paper-edge pb-8">
      <div>
        {eyebrow ? (
          <p className="mb-3 text-[12px] font-medium tracking-[0.14em] text-brass-ink uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="font-serif text-[44px] leading-none font-normal tracking-[0.005em] text-ink sm:text-[60px]">
          {children}
        </h1>
      </div>
      {aside ? <div className="text-[14px] text-graphite-soft">{aside}</div> : null}
    </div>
  );
}
