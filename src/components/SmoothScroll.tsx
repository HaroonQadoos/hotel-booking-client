import { ReactLenis, useLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';
import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

// Where a navigation should land: the element a "#hash" or a
// `{ scrollTo: 'id' }` state names, or the top of a new page. Links to a
// section of another page use the state form — Lenis would otherwise catch a
// "/#search" link and look for #search on the page being left. Lenis owns
// the scroll position when it is on, so it is asked; otherwise the browser.
function ScrollOnNavigate() {
  const { pathname, hash: urlHash, state, key } = useLocation();
  const lenis = useLenis();
  const scrollTo = (state as { scrollTo?: string } | null)?.scrollTo;
  const hash = urlHash || (scrollTo ? `#${scrollTo}` : '');
  // A section link re-scrolls on every click (each is a new `key`); anything
  // else only on a new page, so a search that rewrites "?checkIn=…" stays put.
  const trigger = hash ? key : pathname;

  useEffect(() => {
    if (hash) {
      // Wait a frame so a page that just mounted has laid out its sections.
      const frame = requestAnimationFrame(() => {
        const target = document.querySelector<HTMLElement>(hash);
        if (!target) return;
        if (lenis) lenis.scrollTo(target);
        else target.scrollIntoView();
      });
      return () => cancelAnimationFrame(frame);
    }
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [trigger, hash, lenis]);

  return null;
}

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Eased page scrolling for the whole site. Guests who ask for reduced motion
// keep the browser's native scroll. `anchors` makes links like "#search"
// glide instead of jump; touch scrolling stays native, which phones do best.
export function SmoothScroll({ children }: { children: ReactNode }) {
  if (reducedMotion) {
    return (
      <>
        <ScrollOnNavigate />
        {children}
      </>
    );
  }

  return (
    <ReactLenis root options={{ lerp: 0.1, anchors: true }}>
      <ScrollOnNavigate />
      {children}
    </ReactLenis>
  );
}
