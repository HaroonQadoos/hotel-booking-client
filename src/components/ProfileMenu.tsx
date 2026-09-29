import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api';
import type { AuthUser } from '../api';
import { todayIso } from '../format';

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass';

/** "haroon qadoos" → "H". A blank name still gets a mark. */
function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?';
}

// The round brass-lettered badge that stands for the signed-in guest.
export function Avatar({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-brass font-serif leading-none text-ink-deep ${
        size === 'md' ? 'h-12 w-12 text-[24px]' : 'h-9 w-9 text-[19px]'
      }`}
    >
      {initialOf(name)}
    </span>
  );
}

const joined = new Intl.DateTimeFormat(undefined, { month: 'short', year: 'numeric' });

interface Details {
  memberSince: string | null;
  upcoming: number | null;
  total: number | null;
}

// A small account card that drops out of the bar under the avatar, in the
// same dark glass as the phone menu. The parent positions it and decides
// when it is open; this only fills it in.
export function ProfileMenu({
  id,
  user,
  onClose,
  onSignOut,
}: {
  id: string;
  user: AuthUser;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const [details, setDetails] = useState<Details>({ memberSince: null, upcoming: null, total: null });

  // Fetched on each open, so a booking made a minute ago is counted.
  useEffect(() => {
    let cancelled = false;
    api
      .getProfile()
      .then((profile) => {
        if (!cancelled) setDetails((d) => ({ ...d, memberSince: joined.format(new Date(profile.createdAt)) }));
      })
      .catch(() => undefined);
    api
      .getMyBookings()
      .then((bookings) => {
        if (cancelled) return;
        const today = todayIso();
        setDetails((d) => ({
          ...d,
          total: bookings.length,
          upcoming: bookings.filter((b) => b.status !== 'cancelled' && b.checkOut > today).length,
        }));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div
      id={id}
      role="dialog"
      aria-label="Your profile"
      className="rounded-[24px] border border-cream/10 bg-ink-deep/95 p-2 text-cream shadow-[0_24px_50px_-20px_rgba(0,0,0,0.85)] backdrop-blur-md"
    >
      <div className="flex items-center gap-3 px-3 pt-3 pb-4">
        <Avatar name={user.name} size="md" />
        <div className="min-w-0">
          <p className="truncate font-serif text-[20px] leading-tight">{user.name}</p>
          <p className="truncate text-[13px] text-mist">{user.email}</p>
        </div>
      </div>

      <dl className="mx-1 mb-2 grid grid-cols-2 gap-2">
        <Stat label="Upcoming" value={details.upcoming} />
        <Stat label="Bookings" value={details.total} />
      </dl>

      <dl className="mx-3 mb-3 text-[13px]">
        <Row label="Account" value={user.role === 'admin' ? 'Administrator' : 'Guest'} />
        <Row label="Member since" value={details.memberSince ?? '—'} />
      </dl>

      <div className="flex flex-col gap-1 border-t border-cream/10 pt-2">
        <Link
          to="/bookings"
          onClick={onClose}
          className={`flex items-center justify-between rounded-2xl px-3 py-[10px] text-[14px] text-cream no-underline transition-colors duration-[120ms] hover:bg-cream/5 ${focusRing}`}
        >
          My bookings
          <span aria-hidden="true" className="text-mist">→</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            onClose();
            onSignOut();
          }}
          className={`mt-1 flex w-full cursor-pointer items-center justify-center rounded-full border-0 bg-brass px-3 py-[10px] text-[14px] font-semibold text-ink-deep transition-colors duration-[120ms] hover:bg-brass-lit ${focusRing}`}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-2xl bg-cream/5 px-3 py-[10px]">
      <dt className="text-[10.5px] font-medium tracking-[0.12em] text-brass-lit uppercase">{label}</dt>
      <dd className="mt-1 font-serif text-[24px] leading-none">{value ?? '—'}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-[5px]">
      <dt className="text-mist">{label}</dt>
      <dd className="text-cream">{value}</dd>
    </div>
  );
}
