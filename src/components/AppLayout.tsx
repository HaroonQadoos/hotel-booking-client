import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';
import { BRAND } from '../brand';
import { KeyTag } from './KeyTag';

const navLink =
  'rounded-card px-3 py-[6px] text-[14px] whitespace-nowrap no-underline transition-colors duration-[120ms] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass';
const navIdle = 'text-mist hover:text-cream';
const navActive = 'bg-brass/15 text-brass-lit';

// The frame for every page a guest browses: a slim header on the dark ground
// with the wordmark, the two places to go, and where the session stands.
// Unlike CardLayout it is wide — a room list does not fit on a 400px card.
export function AppLayout() {
  const { user, ready, signOut } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-cream/10">
        <div className="mx-auto flex w-full max-w-[1040px] items-center gap-2 px-4 py-4 sm:gap-4 sm:px-5">
          <Link
            to="/"
            className="flex items-center gap-[9px] no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
          >
            <span className="flex text-brass">
              <KeyTag size={28} />
            </span>
            <span className="font-serif text-[24px] tracking-[0.01em] text-cream">{BRAND}</span>
          </Link>

          <nav className="flex items-center gap-1 sm:ml-2" aria-label="Main">
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
          <div className="ml-auto flex items-center gap-3 text-[14px]">
            {!ready ? null : user ? (
              <>
                <span className="hidden text-mist sm:inline">{user.name}</span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className={`${navLink} ${navIdle} cursor-pointer border border-cream/15 bg-transparent`}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={`${navLink} ${navIdle}`}>
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className={`${navLink} border border-brass text-brass-lit hover:bg-brass/15`}
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1040px] flex-1 px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
