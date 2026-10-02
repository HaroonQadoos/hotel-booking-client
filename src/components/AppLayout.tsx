import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';
import { BRAND } from '../brand';
import { Footer } from './Footer';
import { KeyTag } from './KeyTag';
import { Avatar, ProfileMenu } from './ProfileMenu';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass';

const navLink =
  'rounded-full px-[14px] py-[7px] text-[14px] whitespace-nowrap no-underline transition-colors duration-[120ms] ' +
  focusRing;
const navIdle = 'text-mist hover:text-cream';
const navActive = 'bg-cream/10 text-cream';

// The white pill on the right of the bar — the one action a visitor is most
// likely to want next.
const pillCta =
  'rounded-full bg-cream px-[18px] py-[9px] text-[14px] font-medium whitespace-nowrap text-ink-deep no-underline ' +
  'transition-colors duration-[120ms] hover:bg-white ' +
  focusRing;

// Rows in the phone menu: bigger targets than the bar's links.
const menuLink =
  'block rounded-2xl px-4 py-3 text-[16px] no-underline transition-colors duration-[120ms] ' + focusRing;
const menuIdle = 'text-mist hover:bg-cream/5 hover:text-cream';
const menuActive = 'bg-cream/10 text-cream';

// The frame for every page a guest browses. The bar is a floating pill laid
// over the top of the page rather than a full-width strip: on the home page
// that puts it inside the hero card. Other pages pad the top to clear it.
// On phones the links fold into a menu that drops out of the pill.
export function AppLayout() {
  const { user, ready, signOut } = useAuth();
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  // The menu remembers the page it was opened on, so following a link
  // closes it without an effect.
  const [menuOpenOn, setMenuOpenOn] = useState<string | null>(null);
  const menuOpen = menuOpenOn === pathname;
  const setMenuOpen = (open: boolean) => setMenuOpenOn(open ? pathname : null);
  // The profile card works the same way; opening one closes the other.
  const [profileOpenOn, setProfileOpenOn] = useState<string | null>(null);
  const profileOpen = profileOpenOn === pathname;
  const toggleProfile = () => {
    setMenuOpenOn(null);
    setProfileOpenOn(profileOpen ? null : pathname);
  };
  const bar = useRef<HTMLDivElement>(null);

  // Escape, or a press anywhere outside the bar and its drop-downs, closes
  // whichever one is open.
  useEffect(() => {
    if (!menuOpen && !profileOpen) return;
    const close = () => {
      setMenuOpenOn(null);
      setProfileOpenOn(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    const onPointer = (e: PointerEvent) => {
      if (!bar.current?.contains(e.target as Node)) close();
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [menuOpen, profileOpen]);

  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* Top offset = the hero's inset plus a margin inside its rounded edge.
          Only the home page has the tall hero; every other page sits the bar
          closer to the top and trims it, so their content starts sooner. */}
      <header
        className={`pointer-events-none fixed inset-x-0 z-20 flex justify-center px-6 sm:px-8 ${
          isHome ? 'top-3 pt-3 sm:top-6 sm:pt-8' : 'top-2 pt-2 sm:top-3 sm:pt-3'
        }`}
      >
        <div ref={bar} className="pointer-events-auto relative w-full max-w-[1280px]">
          <div className={`flex items-center gap-1 rounded-full border border-cream/10 bg-ink-deep/85 py-2 pr-2 pl-4 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md sm:gap-2 sm:pr-3 sm:pl-6 ${isHome ? 'sm:py-3' : 'sm:py-2'}`}>
            <Link to="/" className={`mr-2 flex items-center gap-[8px] no-underline ${focusRing}`}>
              <span className="flex text-brass">
                <KeyTag size={24} />
              </span>
              <span className="font-serif text-[22px] tracking-[0.01em] text-cream">{BRAND}</span>
            </Link>

            <nav className="mx-auto hidden items-center gap-1 sm:flex" aria-label="Main">
              <NavLink
                to="/categories"
                className={({ isActive }) => `${navLink} ${isActive ? navActive : navIdle}`}
              >
                Categories
              </NavLink>
              <NavLink
                to="/venues"
                className={({ isActive }) => `${navLink} ${isActive ? navActive : navIdle}`}
              >
                Venues
              </NavLink>
              <NavLink
                to="/bookings"
                className={({ isActive }) => `${navLink} ${isActive ? navActive : navIdle}`}
              >
                My bookings
              </NavLink>
            </nav>

            {/* Nothing until the session is known — a "Sign in" that flips to a
                name a moment later reads as a glitch. */}
            <div className="hidden items-center gap-2 sm:flex">
              {!ready ? null : user ? (
                <AvatarButton name={user.name} open={profileOpen} onClick={toggleProfile} />
              ) : (
                <>
                  <Link to="/login" className={`${navLink} ${navIdle}`}>
                    Sign in
                  </Link>
                  <Link to="/signup" className={pillCta}>
                    Create account
                  </Link>
                </>
              )}
            </div>

            {/* On phones the avatar sits beside the menu button. */}
            {ready && user ? (
              <div className="ml-auto sm:hidden">
                <AvatarButton name={user.name} open={profileOpen} onClick={toggleProfile} />
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => {
                setProfileOpenOn(null);
                setMenuOpen(!menuOpen);
              }}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-0 bg-cream/10 text-cream transition-colors duration-[120ms] hover:bg-cream/15 sm:hidden ${user ? 'ml-2' : 'ml-auto'} ${focusRing}`}
            >
              {/* Three brass-tipped bars that fold into an X. */}
              <span className="relative block h-[12px] w-[18px]" aria-hidden="true">
                <span
                  className={`absolute left-0 h-[1.5px] w-full rounded-full bg-current transition-all duration-200 ${menuOpen ? 'top-[5px] rotate-45' : 'top-0'}`}
                />
                <span
                  className={`absolute top-[5px] left-0 h-[1.5px] w-full rounded-full bg-current transition-opacity duration-200 ${menuOpen ? 'opacity-0' : 'opacity-100'}`}
                />
                <span
                  className={`absolute left-0 h-[1.5px] rounded-full bg-current transition-all duration-200 ${menuOpen ? 'top-[5px] w-full -rotate-45' : 'top-[10px] w-[12px]'}`}
                />
              </span>
            </button>
          </div>

          {/* The phone menu: a second rounded card dropping out of the bar. */}
          <div
            id="mobile-menu"
            hidden={!menuOpen}
            className="absolute inset-x-0 top-full mt-2 rounded-[28px] border border-cream/10 bg-ink-deep/95 p-2 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.8)] backdrop-blur-md sm:hidden"
          >
            <nav aria-label="Main" className="flex flex-col gap-1">
              <NavLink
                to="/categories"
                className={({ isActive }) => `${menuLink} ${isActive ? menuActive : menuIdle}`}
              >
                Categories
              </NavLink>
              <NavLink
                to="/venues"
                className={({ isActive }) => `${menuLink} ${isActive ? menuActive : menuIdle}`}
              >
                Venues
              </NavLink>
              <NavLink
                to="/bookings"
                className={({ isActive }) => `${menuLink} ${isActive ? menuActive : menuIdle}`}
              >
                My bookings
              </NavLink>
            </nav>

            {ready ? (
              <div className="mt-2 border-t border-cream/10 px-2 pt-3 pb-1">
                {user ? (
                  <>
                    <button
                      type="button"
                      onClick={toggleProfile}
                      className={`mb-2 flex w-full cursor-pointer items-center gap-3 rounded-2xl border-0 bg-transparent px-2 py-2 text-left text-[15px] text-cream transition-colors duration-[120ms] hover:bg-cream/5 ${focusRing}`}
                    >
                      <Avatar name={user.name} />
                      Your profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        void signOut();
                      }}
                      className={`${pillCta} block w-full cursor-pointer border-0 text-center`}
                    >
                      Sign out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link to="/signup" className={`${pillCta} block text-center`}>
                      Create account
                    </Link>
                    <Link
                      to="/login"
                      className={`block rounded-full border border-cream/20 px-[18px] py-[9px] text-center text-[14px] text-cream no-underline transition-colors duration-[120ms] hover:bg-cream/5 ${focusRing}`}
                    >
                      Sign in
                    </Link>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* The profile card: under the avatar on wide screens, full width
              under the bar on phones, like the menu. */}
          {user && profileOpen ? (
            <div className="absolute inset-x-0 top-full mt-2 sm:right-0 sm:left-auto sm:w-[300px]">
              <ProfileMenu
                id="profile-menu"
                user={user}
                onClose={() => setProfileOpenOn(null)}
                onSignOut={() => void signOut()}
              />
            </div>
          ) : null}
        </div>
      </header>

      {/* No column here: a page decides which of its sections sit in one. */}
      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

    </div>
  );
}

// The signed-in guest's initial in a brass circle; opens their profile card.
function AvatarButton({ name, open, onClick }: { name: string; open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls="profile-menu"
      aria-label="Your profile"
      title="Your profile"
      className={`cursor-pointer rounded-full border-0 bg-transparent p-0 transition-transform duration-[120ms] hover:scale-105 ${focusRing}`}
    >
      <Avatar name={name} />
    </button>
  );
}
