import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';
import { BRAND } from '../brand';
import { KeyTag } from './KeyTag';

const navLink =
  'rounded-full px-[14px] py-[7px] text-[14px] whitespace-nowrap no-underline transition-colors duration-[120ms] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass';
const navIdle = 'text-mist hover:text-cream';
const navActive = 'bg-cream/10 text-cream';

// The white pill on the right of the bar — the one action a visitor is most
// likely to want next.
const pillCta =
  'rounded-full bg-cream px-[18px] py-[9px] text-[14px] font-medium whitespace-nowrap text-ink-deep no-underline ' +
  'transition-colors duration-[120ms] hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass';

// The frame for every page a guest browses. The bar is a floating pill fixed
// to the top rather than a full-width strip, so on the home page it sits on
// the hero photograph; other pages leave room for it with top padding.
export function AppLayout() {
  const { user, ready, signOut } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex justify-center px-4 pt-4 sm:pt-6">
        <div className="pointer-events-auto flex w-full max-w-[860px] items-center gap-1 rounded-full border border-cream/10 bg-ink-deep/85 py-2 pr-2 pl-5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md sm:gap-2">
          <Link
            to="/"
            className="mr-2 flex items-center gap-[8px] no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            <span className="flex text-brass">
              <KeyTag size={24} />
            </span>
            <span className="font-serif text-[22px] tracking-[0.01em] text-cream">{BRAND}</span>
          </Link>

          <nav className="flex items-center gap-1 sm:mx-auto" aria-label="Main">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `${navLink} ${isActive ? navActive : navIdle}`}
            >
              Rooms
            </NavLink>
            {user ? (
              <NavLink
                to="/bookings"
                className={({ isActive }) => `${navLink} ${isActive ? navActive : navIdle}`}
              >
                My bookings
              </NavLink>
            ) : null}
          </nav>

          {/* Nothing until the session is known — a "Sign in" that flips to a
              name a moment later reads as a glitch. */}
          <div className="ml-auto flex items-center gap-1 sm:ml-0 sm:gap-2">
            {!ready ? null : user ? (
              <>
                <span className="hidden px-2 text-[14px] text-mist md:inline">{user.name}</span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className={`${pillCta} cursor-pointer border-0`}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={`${navLink} ${navIdle}`}>
                  Sign in
                </Link>
                {/* Hidden on phones: with the wordmark and nav there is no
                    room, and the sign-in page links to sign-up anyway. */}
                <Link to="/signup" className={`${pillCta} hidden sm:inline-block`}>
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* No column here: a page decides which of its sections sit in one. */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
