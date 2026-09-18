import type { ReactNode } from 'react';
import { Container } from './Container';

// A photograph set into the page as a rounded card, with the floating nav
// bar sitting on top of it. Two shades keep the words legible: one from the
// bottom, one from the left where the headline is.
export function Hero({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <Container className="pt-3 sm:pt-4">
      <section className="relative isolate flex min-h-[600px] flex-col overflow-hidden rounded-[28px] bg-ink-deep sm:min-h-[680px] sm:rounded-[36px]">
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
        <div className="relative flex flex-1 flex-col justify-end px-6 pt-32 pb-20 sm:px-12 sm:pb-24">
          {children}
          {footer ? (
            <div className="mt-8 flex flex-wrap items-end justify-between gap-6 sm:mt-12">{footer}</div>
          ) : null}
        </div>
      </section>
    </Container>
  );
}
