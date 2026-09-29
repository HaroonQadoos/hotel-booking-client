import { ReactLenis, useLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';
import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

// Lenis owns the scroll position, so a new page has to ask it to go back to
// the top — the browser's own reset would be smoothed away.
function ResetOnNavigate() {
  const { pathname } = useLocation();
  const lenis = useLenis();
  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true });
  }, [pathname, lenis]);
  return null;
}

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Eased page scrolling for the whole site. Guests who ask for reduced motion
// keep the browser's native scroll. `anchors` makes links like "#search"
// glide instead of jump; touch scrolling stays native, which phones do best.
export function SmoothScroll({ children }: { children: ReactNode }) {
  if (reducedMotion) return <>{children}</>;

  return (
    <ReactLenis root options={{ lerp: 0.1, anchors: true }}>
      <ResetOnNavigate />
      {children}
    </ReactLenis>
  );
}
