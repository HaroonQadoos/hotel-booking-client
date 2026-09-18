import type { ReactNode } from 'react';
import { Container } from './Container';

// Full-bleed photograph under the header, fading into the page ground so
// the content below reads as continuing from it rather than sitting under a
// picture. The gradient is heaviest at the bottom, where the headline is.
export function Hero({ children }: { children: ReactNode }) {
  return (
    <section className="relative isolate overflow-hidden bg-ink-deep">
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
        className="absolute inset-0 bg-linear-to-b from-ink-deep/55 via-ink-deep/35 via-45% to-ink-deep"
      />
      {/* A second shade from the left, where the words are, so the headline
          never fights the busiest part of the picture. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-ink-deep/70 via-ink-deep/25 via-45% to-transparent"
      />
      <Container className="relative pt-20 pb-24 sm:pt-28 sm:pb-32">{children}</Container>
    </section>
  );
}
