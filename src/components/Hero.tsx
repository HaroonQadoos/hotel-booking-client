import type { ReactNode } from 'react';

// A photograph filling the first screen, inset from the top and sides just
// enough to show its rounded corners, with the floating nav bar sitting on
// top of it. Not in a Container on purpose: it spans the whole viewport, and
// the page column starts below it. Two shades keep the words legible: one
// from the bottom, one from the left where the headline is.
export function Hero({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="px-3 py-3 sm:px-8 sm:py-8">
      {/* min-height, not height: on a short landscape phone the copy still
          needs room, and the card grows rather than clipping it. */}
      <section className="relative isolate flex min-h-[calc(100dvh-12px)] flex-col overflow-hidden rounded-[28px] bg-ink-deep sm:min-h-[calc(100dvh-16px)] sm:rounded-[36px]">
        <img
          src="/hero.jpg"
          alt=""
          // Decorative; the headline carries the meaning.
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[50%_60%]"
          fetchPriority="high"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-ink-deep/85 via-ink-deep/25 via-55% to-ink-deep/30"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-r from-ink-deep/60 via-ink-deep/15 via-50% to-transparent"
        />

        {/* pt clears the floating nav bar; the copy sits in the lower half. */}
        <div className="relative flex flex-1 flex-col justify-end px-6 pt-32 pb-20 sm:px-12 sm:pb-24 lg:px-16">
          {children}
          {footer ? (
            <div className="mt-8 flex flex-wrap items-end justify-between gap-6 sm:mt-12">{footer}</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
