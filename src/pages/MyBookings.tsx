import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as api from '../api';
import type { Booking } from '../api';
import { Notice } from '../components/Notice';
import { PageTitle } from '../components/PageTitle';
import { StatusBadge } from '../components/StatusBadge';
import { formatDay, formatPrice, plural, todayIso } from '../format';

// A stay that has not started can still be cancelled; the API refuses once
// check-in has passed, so the button is hidden rather than left to fail.
function canCancel(booking: Booking): boolean {
  return booking.status !== 'cancelled' && booking.checkIn >= todayIso();
}

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
            <button
              type="button"
              onClick={() => onCancel(booking)}
              disabled={cancelling}
              className="cursor-pointer rounded-card border border-paper-edge bg-transparent px-3 py-[7px] text-[13.5px] font-medium text-graphite transition-colors duration-[120ms] enabled:hover:border-rust enabled:hover:text-rust-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:cursor-not-allowed disabled:opacity-55"
            >
              {cancelling ? 'Cancelling…' : 'Cancel'}
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export function MyBookings() {
  // A one-time confirmation handed over by the room page after booking.
  const handedNotice = (useLocation().state as { notice?: string } | null)?.notice;

  const [bookings, setBookings] = useState<Booking[] | null>(null);
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

  const today = todayIso();
  const upcoming = bookings?.filter((b) => b.status !== 'cancelled' && b.checkOut > today) ?? [];
  const past = bookings?.filter((b) => !upcoming.includes(b)) ?? [];

  return (
    <>
      <PageTitle>My bookings</PageTitle>

      {error ? <Notice tone="error">{error}</Notice> : notice ? <Notice>{notice}</Notice> : null}

      {bookings === null ? (
        <p className="text-mist">Loading your bookings…</p>
      ) : bookings.length === 0 ? (
        <p className="text-mist">
          You have no bookings yet.{' '}
          <Link to="/" className="text-brass-lit underline underline-offset-2 hover:text-cream">
            Find a room
          </Link>
        </p>
      ) : (
        <>
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
        </>
      )}
    </>
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
    <section className="mb-8">
      <h2 className="mb-3 text-[12px] font-medium tracking-[0.08em] text-mist uppercase">{title}</h2>
      {children.length === 0 ? (
        <p className="text-[14px] text-mist">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-3">{children}</ul>
      )}
    </section>
  );
}
