import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import * as api from '../api';
import type { Booking, VenueBooking } from '../api';
import { Container } from '../components/Container';
import { KeyTag } from '../components/KeyTag';
import { Notice } from '../components/Notice';
import { PageTitle } from '../components/PageTitle';
import { StatusBadge } from '../components/StatusBadge';
import { VENUE_TYPE_LABEL, formatDay, formatPrice, formatSlot, plural, todayIso } from '../format';

// A stay that has not started can still be cancelled; the API refuses once
// check-in has passed, so the button is hidden rather than left to fail.
function canCancel(booking: Booking): boolean {
  return booking.status !== 'cancelled' && booking.checkIn >= todayIso();
}

// The same rule for a venue: the API refuses once the day has passed.
function canCancelVenue(booking: VenueBooking): boolean {
  return booking.status !== 'cancelled' && dayOf(booking) >= todayIso();
}

// The API may send the date as a timestamp at UTC midnight; the calendar day
// is all that matters.
function dayOf(booking: VenueBooking): string {
  return booking.date.slice(0, 10);
}

// A venue slot is over once its last hour has passed, not at midnight, so a
// morning swim stops counting as upcoming by the afternoon.
function isUpcomingVenue(booking: VenueBooking): boolean {
  if (booking.status === 'cancelled') return false;
  const today = todayIso();
  return dayOf(booking) > today || (dayOf(booking) === today && booking.endHour > new Date().getHours());
}

const cancelButton =
  'cursor-pointer rounded-card border border-paper-edge bg-transparent px-3 py-[7px] text-[13.5px] font-medium text-graphite transition-colors duration-[120ms] enabled:hover:border-rust enabled:hover:text-rust-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:cursor-not-allowed disabled:opacity-55';

function BookingRow({
  booking,
  onCancel,
  cancelling,
}: {
  booking: Booking;
  onCancel: (booking: Booking) => void;
  cancelling: boolean;
}) {
  const muted = booking.status === 'cancelled';
  return (
    <li
      className={`rounded-card bg-paper px-6 py-5 text-ink shadow-card ${muted ? 'opacity-70' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="font-serif text-[24px] leading-tight">
              <Link to={`/rooms/${booking.room.id}`} className="no-underline hover:underline">
                {booking.room.name ?? 'Room'}
              </Link>
            </h2>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-[14px] text-graphite">
            {formatDay(booking.checkIn)} → {formatDay(booking.checkOut)} ·{' '}
            {plural(booking.nights, 'night')} · {plural(booking.guests, 'guest')}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-serif text-[24px]">{formatPrice(booking.totalPrice)}</span>
          {canCancel(booking) ? (
            <button type="button" onClick={() => onCancel(booking)} disabled={cancelling} className={cancelButton}>
              {cancelling ? 'Cancelling…' : 'Cancel'}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function VenueBookingRow({
  booking,
  onCancel,
  cancelling,
}: {
  booking: VenueBooking;
  onCancel: (booking: VenueBooking) => void;
  cancelling: boolean;
}) {
  const muted = booking.status === 'cancelled';
  return (
    <li
      className={`rounded-card bg-paper px-6 py-5 text-ink shadow-card ${muted ? 'opacity-70' : ''}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          {booking.venue.type ? (
            <p className="text-[12px] font-medium tracking-[0.08em] text-graphite-soft uppercase">
              {VENUE_TYPE_LABEL[booking.venue.type]}
            </p>
          ) : null}
          <div className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="font-serif text-[24px] leading-tight">
              <Link to={`/venues/${booking.venue.id}`} className="no-underline hover:underline">
                {booking.venue.name ?? 'Venue'}
              </Link>
            </h2>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-[14px] text-graphite">
            {formatDay(dayOf(booking))} · {formatSlot(booking.startHour, booking.endHour)} ·{' '}
            {plural(booking.hours, 'hour')} · {plural(booking.guests, 'guest')}
          </p>
          {booking.notes ? (
            <p className="mt-1 max-w-[60ch] text-[13.5px] text-graphite-soft">“{booking.notes}”</p>
          ) : null}
        </div>

        <div className="flex items-center gap-4">
          <span className="font-serif text-[24px]">{formatPrice(booking.totalPrice)}</span>
          {canCancelVenue(booking) ? (
            <button type="button" onClick={() => onCancel(booking)} disabled={cancelling} className={cancelButton}>
              {cancelling ? 'Cancelling…' : 'Cancel'}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

type Tab = 'rooms' | 'venues';

export function MyBookings() {
  // A one-time confirmation handed over by the room page after booking.
  const handedNotice = (useLocation().state as { notice?: string } | null)?.notice;

  // Rooms and venues are two tabs; the choice is in the URL so the venue
  // page can land a guest straight on theirs after a request.
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'venues' ? 'venues' : 'rooms';

  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [venueBookings, setVenueBookings] = useState<VenueBooking[] | null>(null);
  const [notice, setNotice] = useState(handedNotice ?? '');
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getMyBookings()
      .then((result) => {
        if (!cancelled) setBookings(result);
      })
      .catch(() => {
        if (cancelled) return;
        setBookings([]);
        setError('Could not load your bookings. Try again.');
      });
    // Loaded alongside, not on first visit to the tab, so its count is
    // there from the start.
    api
      .getMyVenueBookings()
      .then((result) => {
        if (!cancelled) setVenueBookings(result);
      })
      .catch(() => {
        if (cancelled) return;
        setVenueBookings([]);
        setError('Could not load your venue bookings. Try again.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function cancel(booking: Booking) {
    const label = `${booking.room.name ?? 'this room'}, ${formatDay(booking.checkIn)}`;
    if (!window.confirm(`Cancel your booking for ${label}?`)) return;

    setError('');
    setNotice('');
    setCancellingId(booking.id);
    try {
      const updated = await api.cancelBooking(booking.id);
      setBookings((list) => list?.map((b) => (b.id === updated.id ? updated : b)) ?? null);
      setNotice(`Cancelled ${label}.`);
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'Could not cancel. Try again.');
    } finally {
      setCancellingId(null);
    }
  }

  async function cancelVenue(booking: VenueBooking) {
    const label = `${booking.venue.name ?? 'this venue'}, ${formatDay(dayOf(booking))} ${formatSlot(booking.startHour, booking.endHour)}`;
    if (!window.confirm(`Cancel your booking for ${label}?`)) return;

    setError('');
    setNotice('');
    setCancellingId(booking.id);
    try {
      const updated = await api.cancelVenueBooking(booking.id);
      setVenueBookings((list) => list?.map((b) => (b.id === updated.id ? updated : b)) ?? null);
      setNotice(`Cancelled ${label}.`);
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'Could not cancel. Try again.');
    } finally {
      setCancellingId(null);
    }
  }

  const today = todayIso();
  const upcoming = bookings?.filter((b) => b.status !== 'cancelled' && b.checkOut > today) ?? [];
  const past = bookings?.filter((b) => !upcoming.includes(b)) ?? [];
  const upcomingVenues = venueBookings?.filter(isUpcomingVenue) ?? [];
  const pastVenues = venueBookings?.filter((b) => !upcomingVenues.includes(b)) ?? [];
  const total = bookings && venueBookings ? bookings.length + venueBookings.length : null;

  return (
    // Clears the floating bar with room to breathe, and leaves space before
    // the footer so a short list does not look squeezed.
    <Container className="pt-32 pb-20 sm:pt-40 sm:pb-28">
      <PageTitle
        eyebrow="Your stays"
        aside={total ? plural(total, 'booking') : undefined}
      >
        My bookings
      </PageTitle>

      {error ? <Notice tone="error">{error}</Notice> : notice ? <Notice>{notice}</Notice> : null}

      <div role="tablist" aria-label="Booking type" className="mb-8 flex gap-2">
        <TabButton active={tab === 'rooms'} count={bookings?.length} onClick={() => setParams({}, { replace: true })}>
          Rooms
        </TabButton>
        <TabButton
          active={tab === 'venues'}
          count={venueBookings?.length}
          onClick={() => setParams({ tab: 'venues' }, { replace: true })}
        >
          Venues
        </TabButton>
      </div>

      {tab === 'venues' ? (
        venueBookings === null ? (
          <p className="text-graphite-soft">Loading your venue bookings…</p>
        ) : venueBookings.length === 0 ? (
          <EmptyState
            title="No venues booked"
            body="Book the conference room, the pool or the party hall by the hour, and the request will appear here with its time and status."
            to="/venues"
            action="Browse venues"
          />
        ) : (
          <div role="tabpanel">
            <Section title="Upcoming" empty="Nothing coming up.">
              {upcomingVenues.map((b) => (
                <VenueBookingRow key={b.id} booking={b} onCancel={(x) => void cancelVenue(x)} cancelling={cancellingId === b.id} />
              ))}
            </Section>
            {pastVenues.length > 0 ? (
              <Section title="Past and cancelled">
                {pastVenues.map((b) => (
                  <VenueBookingRow key={b.id} booking={b} onCancel={(x) => void cancelVenue(x)} cancelling={cancellingId === b.id} />
                ))}
              </Section>
            ) : null}
          </div>
        )
      ) : bookings === null ? (
        <p className="text-graphite-soft">Loading your bookings…</p>
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No stays yet"
          body="When you book a room it will appear here, with your dates, the total and the option to cancel."
          to="/"
          state={{ scrollTo: 'search' }}
          action="Find a room"
        />
      ) : (
        <div role="tabpanel">
          <Section title="Upcoming" empty="Nothing coming up.">
            {upcoming.map((b) => (
              <BookingRow key={b.id} booking={b} onCancel={(x) => void cancel(x)} cancelling={cancellingId === b.id} />
            ))}
          </Section>
          {past.length > 0 ? (
            <Section title="Past and cancelled">
              {past.map((b) => (
                <BookingRow key={b.id} booking={b} onCancel={(x) => void cancel(x)} cancelling={cancellingId === b.id} />
              ))}
            </Section>
          ) : null}
        </div>
      )}
    </Container>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty?: string;
  children: ReactNode[];
}) {
  return (
    <section className="mb-12">
      <h2 className="mb-4 text-[12px] font-medium tracking-[0.14em] text-brass-ink uppercase">{title}</h2>
      {children.length === 0 ? (
        <p className="text-[14px] text-graphite-soft">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-3">{children}</ul>
      )}
    </section>
  );
}

function TabButton({
  active,
  count,
  onClick,
  children,
}: {
  active: boolean;
  count?: number;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-[7px] text-[14px] transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ${
        active ? 'border-ink-deep bg-ink-deep text-cream' : 'border-paper-edge bg-transparent text-graphite hover:border-ink-deep hover:text-ink'
      }`}
    >
      {children}
      {count !== undefined ? (
        <span className={`text-[12px] tabular-nums ${active ? 'text-brass-lit' : 'text-graphite-soft'}`}>{count}</span>
      ) : null}
    </button>
  );
}

// The friendly blank page for a tab with nothing in it yet.
function EmptyState({
  title,
  body,
  to,
  state,
  action,
}: {
  title: string;
  body: string;
  to: string;
  state?: { scrollTo: string };
  action: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-[28px] border border-paper-edge bg-paper px-6 py-14 text-center sm:py-20">
      <span className="mb-6 grid h-16 w-16 place-items-center rounded-full bg-ink-deep text-brass-lit">
        <KeyTag size={28} />
      </span>
      <h2 className="mb-2 font-serif text-[32px] leading-tight font-normal text-ink">{title}</h2>
      <p className="mb-8 max-w-[40ch] text-[15px] text-graphite">{body}</p>
      <Link
        to={to}
        state={state}
        className="inline-flex items-center gap-3 rounded-full bg-ink-deep py-2 pr-2 pl-6 text-[15px] font-medium text-cream no-underline transition-colors duration-[120ms] hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        {action}
        <span className="grid h-10 w-10 place-items-center rounded-full bg-brass text-ink-deep">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </Link>
    </div>
  );
}
