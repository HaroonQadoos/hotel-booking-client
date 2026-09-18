import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import * as api from '../api';
import type { Room, Stay } from '../api';
import { useAuth } from '../auth';
import { Container } from '../components/Container';
import { Notice } from '../components/Notice';
import { StayForm } from '../components/StayForm';
import { ROOM_TYPE_LABEL, formatPrice, nightsBetween, plural } from '../format';
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
      <Container className="pt-24 pb-10 sm:pt-28">
        <Notice tone="error">{loadError}</Notice>
        <Link to="/" className="text-brass-lit underline underline-offset-2 hover:text-cream">
          Back to all rooms
        </Link>
      </Container>
    );
  }
  if (!room) {
    return (
      <Container className="pt-24 pb-10 sm:pt-28">
        <p className="text-mist">Loading room…</p>
      </Container>
    );
  }

  const nights = stay ? nightsBetween(stay.checkIn, stay.checkOut) : 0;

  return (
    <Container className="pt-24 pb-10 sm:pt-28">
      <Link
        to={stay ? `/?${new URLSearchParams({ checkIn: stay.checkIn, checkOut: stay.checkOut, guests: String(stay.guests) })}` : '/'}
        className="mb-5 inline-block text-[14px] text-mist no-underline hover:text-cream"
      >
        ← All rooms
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px] lg:items-start">
        <article className="rounded-card bg-paper px-7 pt-7 pb-7 text-ink shadow-card">
          <p className="mb-1 text-[12px] font-medium tracking-[0.08em] text-graphite-soft uppercase">
            {ROOM_TYPE_LABEL[room.type]} · sleeps {room.capacity}
          </p>
          <h1 className="mb-4 font-serif text-[36px] leading-[1.1]">{room.name}</h1>
          <p className="mb-6 text-[15px] leading-relaxed text-graphite">{room.description}</p>

          {room.amenities.length > 0 ? (
            <>
              <h2 className="mb-2 text-[12px] font-medium tracking-[0.08em] text-graphite-soft uppercase">
                Amenities
              </h2>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-[6px] text-[14px] text-graphite">
                {room.amenities.map((amenity) => (
                  <li key={amenity} className="before:mr-2 before:text-brass before:content-['•']">
                    {amenity}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </article>

        <aside className="rounded-card bg-paper px-6 pt-5 pb-3 text-ink shadow-card">
          <p className="mb-4">
            <span className="font-serif text-[30px] leading-none">{formatPrice(room.pricePerNight)}</span>
            <span className="ml-1 text-[13px] text-graphite-soft">/ night</span>
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
    </Container>
  );
}
