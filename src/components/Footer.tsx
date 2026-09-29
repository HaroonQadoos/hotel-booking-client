import { useLenis } from 'lenis/react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { BRAND } from '../brand';
import { KeyTag } from './KeyTag';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass';
const footLink = `text-[15px] text-mist no-underline transition-colors duration-[120ms] hover:text-cream ${focusRing}`;
const columnTitle = 'mb-4 text-[11px] font-medium tracking-[0.14em] text-brass-lit uppercase';

// The page's closing card: the same inset, rounded, deep-navy frame as the
// hero at the top, so a page opens and closes on the same note. Only links
// to pages that exist — no invented phone numbers or social handles.
export function Footer() {
  const { user, ready, signOut } = useAuth();
  const lenis = useLenis();
  const year = new Date().getFullYear();

  // Lenis is off for guests who prefer reduced motion; fall back to a jump.
  const toTop = () => (lenis ? lenis.scrollTo(0) : window.scrollTo(0, 0));

  return (
    <footer className="px-3 pb-3 sm:px-8 sm:pb-8">
      <div className="relative isolate overflow-hidden rounded-[28px] bg-ink-deep px-6 pt-12 pb-6 text-cream sm:rounded-[36px] sm:px-12 sm:pt-16 lg:px-16">
        {/* A warm glow in one corner so the navy is not a flat slab. */}
        <div
          aria-hidden="true"
          className="absolute -top-40 -right-40 -z-10 h-[420px] w-[420px] rounded-full bg-brass/20 blur-[120px]"
        />

        <div className="flex flex-col gap-8 border-b border-cream/10 pb-12 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-3 text-[12px] font-medium tracking-[0.14em] text-brass-lit uppercase">Your next night</p>
            <h2 className="max-w-[16ch] font-serif text-[40px] leading-[1.02] font-normal text-cream sm:text-[60px]">
              A room on the water is waiting.
            </h2>
          </div>
          <Link
            to="/" state={{ scrollTo: 'search' }}
            className={`group inline-flex w-fit items-center gap-3 rounded-full bg-cream py-2 pr-2 pl-6 text-[15px] font-medium text-ink-deep no-underline transition-colors duration-[120ms] hover:bg-white ${focusRing}`}
          >
            Check availability
            <span className="grid h-10 w-10 place-items-center rounded-full bg-ink-deep text-cream transition-colors duration-200 group-hover:bg-brass group-hover:text-ink-deep">
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 md:grid-cols-[1.6fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className={`mb-4 inline-flex items-center gap-2 no-underline ${focusRing}`}>
              <span className="flex text-brass">
                <KeyTag size={28} />
              </span>
              <span className="font-serif text-[26px] tracking-[0.01em] text-cream">{BRAND}</span>
            </Link>
            <p className="max-w-[36ch] text-[15px] leading-relaxed text-mist">
              Rooms by the night, on the water. Choose your dates, see exactly what is free, and book in a minute.
            </p>
          </div>

          <nav aria-label="Stay">
            <h3 className={columnTitle}>Stay</h3>
            <ul className="flex flex-col gap-3">
              <li>
                <Link to="/" className={footLink}>
                  All rooms
                </Link>
              </li>
              <li>
                <Link to="/" state={{ scrollTo: 'search' }} className={footLink}>
                  Check availability
                </Link>
              </li>
              {user ? (
                <li>
                  <Link to="/bookings" className={footLink}>
                    My bookings
                  </Link>
                </li>
              ) : null}
            </ul>
          </nav>

          <nav aria-label="Account">
            <h3 className={columnTitle}>Account</h3>
            {ready ? (
              <ul className="flex flex-col gap-3">
                {user ? (
                  <>
                    <li className="text-[15px] text-cream">{user.name}</li>
                    <li>
                      <button
                        type="button"
                        onClick={() => void signOut()}
                        className={`cursor-pointer border-0 bg-transparent p-0 ${footLink}`}
                      >
                        Sign out
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link to="/login" className={footLink}>
                        Sign in
                      </Link>
                    </li>
                    <li>
                      <Link to="/signup" className={footLink}>
                        Create account
                      </Link>
                    </li>
                    <li>
                      <Link to="/forgot-password" className={footLink}>
                        Forgot password
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            ) : null}
          </nav>
        </div>

        {/* The wordmark, set huge and faint, as the card's last word. */}
        <p
          aria-hidden="true"
          className="pointer-events-none -mb-[0.2em] text-center font-serif text-[27vw] leading-[0.8] tracking-[-0.02em] text-cream/[0.06] select-none lg:text-[300px]"
        >
          {BRAND}
        </p>

        <div className="relative flex flex-col-reverse items-start gap-4 border-t border-cream/10 pt-6 text-[13px] text-mist sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {BRAND}. Booked by the night.
          </p>
          <button
            type="button"
            onClick={toTop}
            className={`inline-flex cursor-pointer items-center gap-2 rounded-full border border-cream/20 bg-transparent px-4 py-2 text-[13px] text-cream transition-colors duration-[120ms] hover:bg-cream/10 ${focusRing}`}
          >
            Back to top
            <span aria-hidden="true">↑</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
