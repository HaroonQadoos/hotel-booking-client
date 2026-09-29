import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import * as api from '../api';
import type { Room, Stay } from '../api';
import { useAuth } from '../auth';
import { Container } from '../components/Container';
import { Notice } from '../components/Notice';
import { RoomFeatures } from '../components/RoomFeatures';
import { StayForm } from '../components/StayForm';
import { ROOM_TYPE_LABEL, formatPrice, nightsBetween, plural } from '../format';
import { roomPhoto } from '../roomPhoto';
import { useStay } from '../stay';

export function RoomDetail() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stay, setStay] = useStay();

  const [room, setRoom] = useState<Room | null>(null);
  const [loadError, setLoadError] = useState('');
  const [bookError, setBookError] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getRoom(id)
      .then((result) => {
        if (!cancelled) setRoom(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(
          err instanceof api.ApiError && err.status === 404
            ? 'That room does not exist.'
            : 'Could not load this room. Try again.',
        );
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function book(next: Stay) {
    setStay(next);
    setBookError('');

    // Booking needs an account. Sending the guest to sign in with the exact
    // URL they were on — dates included — means they come straight back to a
    // filled-in form rather than to the front page.
    if (!user) {
      const from = `${location.pathname}?${new URLSearchParams({
        checkIn: next.checkIn,
        checkOut: next.checkOut,
        guests: String(next.guests),
      })}`;
      navigate('/login', { state: { from } });
      return;
    }

    setBooking(true);
    try {
      const created = await api.createBooking(id, next);
      navigate('/bookings', {
        state: {
          notice: `Booked ${created.room.name ?? 'your room'} for ${plural(created.nights, 'night')}. It is held as pending.`,
        },
      });
    } catch (err) {
      if (err instanceof api.ApiError) {
        // 409 is "someone got there first"; the dates need changing, not
        // retrying, and the wording should make that clear.
        setBookError(
          err.status === 409
            ? `${err.message} Try different dates.`
            : Object.values(err.fieldErrors)[0] ?? err.message,
        );
      } else {
        setBookError('Something went wrong. Try again.');
      }
    } finally {
      setBooking(false);
    }
  }

  if (loadError) {
    return (
      <Container className="pt-28 pb-10 sm:pt-36">
        <Notice tone="error">{loadError}</Notice>
        <Link to="/" className="text-brass-ink underline underline-offset-2 hover:text-ink">
          Back to all rooms
        </Link>
      </Container>
    );
  }
  if (!room) {
    return (
      <>
        {/* Same frame as the loaded banner, so the page does not jump. */}
        <div className="px-3 pt-3 sm:px-8 sm:pt-8">
          <div className="h-[62dvh] min-h-[420px] animate-pulse rounded-[28px] bg-ink-deep/90 sm:rounded-[36px]" />
        </div>
        <Container className="py-10">
          <p className="text-graphite-soft">Loading room…</p>
        </Container>
      </>
    );
  }

  const nights = stay ? nightsBetween(stay.checkIn, stay.checkOut) : 0;
  const backHref = stay
    ? `/?${new URLSearchParams({ checkIn: stay.checkIn, checkOut: stay.checkOut, guests: String(stay.guests) })}`
    : '/';

  return (
    <>
      {/* The banner: the room's photo in the same inset, rounded frame as the
          home page hero, with the floating nav bar over its top edge. */}
      <div className="px-3 pt-3 sm:px-8 sm:pt-8">
        <section className="relative isolate flex h-[62dvh] min-h-[420px] flex-col overflow-hidden rounded-[28px] bg-ink-deep sm:min-h-[480px] sm:rounded-[36px]">
          <img
            src={roomPhoto(room)}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-linear-to-t from-ink-deep/90 via-ink-deep/30 via-55% to-ink-deep/40"
          />

          <div className="flex flex-1 flex-col justify-end px-6 pt-28 pb-8 sm:px-12 sm:pb-12 lg:px-16 lg:pb-14">
            <Link
              to={backHref}
              className="mb-auto inline-flex w-fit items-center gap-2 rounded-full border border-cream/25 bg-ink-deep/40 px-4 py-2 text-[14px] text-cream no-underline backdrop-blur-sm transition-colors duration-[120ms] hover:bg-ink-deep/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass sm:mt-4"
            >
              <span aria-hidden="true">←</span> All rooms
            </Link>

            <p className="mb-3 text-[12px] font-medium tracking-[0.14em] text-brass-lit uppercase">
              {ROOM_TYPE_LABEL[room.type]} room
            </p>
            <h1 className="mb-5 max-w-[16ch] font-serif text-[44px] leading-[1.02] font-normal text-cream sm:text-[68px]">
              {room.name}
            </h1>
            <ul className="flex flex-wrap gap-2 text-[14px] text-cream">
              <li className="rounded-full border border-cream/25 bg-ink-deep/40 px-4 py-[7px] backdrop-blur-sm">
                Sleeps {room.capacity}
              </li>
              <li className="rounded-full border border-cream/25 bg-ink-deep/40 px-4 py-[7px] backdrop-blur-sm">
                From {formatPrice(room.pricePerNight)} a night
              </li>
              {room.amenities.length > 0 ? (
                <li className="hidden rounded-full border border-cream/25 bg-ink-deep/40 px-4 py-[7px] backdrop-blur-sm sm:block">
                  {room.amenities.length === 1 ? '1 amenity' : `${room.amenities.length} amenities`}
                </li>
              ) : null}
            </ul>
          </div>
        </section>
      </div>

      <Container className="pt-10 pb-16 sm:pt-12 lg:pb-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px] lg:items-start lg:gap-12">
          <article className="text-ink">
            <h2 className="mb-3 text-[12px] font-medium tracking-[0.14em] text-brass-ink uppercase">
              About the room
            </h2>
            <p className="mb-10 max-w-[62ch] font-serif text-[24px] leading-[1.35] text-ink sm:text-[28px]">
              {room.description}
            </p>

            {room.amenities.length > 0 ? (
              <>
                <h2 className="mb-4 text-[12px] font-medium tracking-[0.14em] text-brass-ink uppercase">
                  Amenities
                </h2>
                <ul className="grid grid-cols-1 gap-x-6 border-t border-paper-edge sm:grid-cols-2">
                  {room.amenities.map((amenity) => (
                    <li
                      key={amenity}
                      className="flex items-center gap-3 border-b border-paper-edge py-3 text-[15px] text-graphite"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0 text-brass">
                        <path d="M3 8.5l3 3 7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {amenity}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </article>

          {/* Pulled up over the banner on wide screens, like the home
              page's search card, and pinned while the details scroll. */}
          <aside className="rounded-[22px] border border-paper-edge bg-paper px-6 pt-6 pb-3 text-ink shadow-card lg:sticky lg:top-28 lg:-mt-40">
            <p className="mb-5 flex items-baseline justify-between gap-3">
              <span>
                <span className="font-serif text-[34px] leading-none">{formatPrice(room.pricePerNight)}</span>
                <span className="ml-1 text-[13px] text-graphite-soft">/ night</span>
              </span>
              <span className="text-[13px] text-graphite-soft">Sleeps {room.capacity}</span>
            </p>

          {bookError ? (
            <p
              className="mb-[18px] rounded-r-card border-l-[3px] border-rust bg-rust/10 px-3 py-[10px] text-[13.5px] text-rust-ink"
              role="alert"
            >
              {bookError}
            </p>
          ) : null}

          {!room.isActive ? (
            <p className="mb-4 text-[14px] text-graphite">This room type is no longer offered.</p>
          ) : (
            <StayForm
              key={`${stay?.checkIn}-${stay?.checkOut}-${stay?.guests}`}
              initial={stay}
              onSubmit={(next) => void book(next)}
              submitLabel={booking ? 'Booking…' : user ? 'Book' : 'Sign in to book'}
              maxGuests={room.capacity}
              disabled={booking}
              layout="stack"
            />
          )}

          {stay && nights > 0 ? (
            <dl className="mb-3 grid grid-cols-[1fr_auto] gap-y-1 border-t border-paper-edge pt-3 text-[14px]">
              <dt className="text-graphite-soft">
                {formatPrice(room.pricePerNight)} × {plural(nights, 'night')}
              </dt>
              <dd className="text-right">{formatPrice(room.pricePerNight * nights)}</dd>
              <dt className="font-medium">Total</dt>
              <dd className="text-right font-serif text-[20px]">{formatPrice(room.pricePerNight * nights)}</dd>
            </dl>
          ) : (
            <p className="mb-3 border-t border-paper-edge pt-3 text-[13px] text-graphite-soft">
              Choose dates to see the total.
            </p>
          )}
        </aside>
        </div>

        <RoomFeatures />
      </Container>
    </>
  );
}
