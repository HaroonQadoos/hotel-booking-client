import { useEffect, useState } from 'react';
import * as api from '../api';
import type { AvailableRoom, Room } from '../api';
import { Container } from '../components/Container';
import { Hero } from '../components/Hero';
import { Notice } from '../components/Notice';
import { RoomCard } from '../components/RoomCard';
import { StayForm } from '../components/StayForm';
import { formatDay, formatPrice, plural } from '../format';
import { useStay } from '../stay';

type Rooms = Room[] | AvailableRoom[];

// The front page: pick dates, see what is free. With no dates in the URL it
// shows the catalogue, so a first visit is never an empty form.
export function Home() {
  const [stay, setStay] = useStay();
  const [rooms, setRooms] = useState<Rooms | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = stay ? api.searchAvailability(stay) : api.getRooms();
    load
      .then((result) => {
        if (cancelled) return;
        setRooms(result);
        setError('');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setRooms([]);
        setError(err instanceof api.ApiError ? err.message : 'Something went wrong. Try again.');
      });

    return () => {
      cancelled = true;
    };
    // `stay` is rebuilt from the URL on every render; its parts are stable.
  }, [stay?.checkIn, stay?.checkOut, stay?.guests]); // eslint-disable-line react-hooks/exhaustive-deps

  // The catalogue is sorted cheapest-first by the API, so the first room
  // sets the "from" price. Availability results are sorted the same way.
  const cheapest = rooms && rooms.length > 0 ? rooms[0].pricePerNight : null;

  const summary = stay
    ? `${formatDay(stay.checkIn)} – ${formatDay(stay.checkOut)} · ${plural(stay.guests, 'guest')}`
    : 'All room types';

  return (
    <>
      <Hero
        footer={
          <>
            <a
              href="#search"
              aria-label="Scroll to search"
              className="grid h-14 w-14 place-items-center rounded-full border border-cream/30 bg-ink-deep/40 text-cream no-underline backdrop-blur-sm transition-colors duration-[120ms] hover:bg-ink-deep/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
            >
              <span aria-hidden="true" className="text-[20px] leading-none">↓</span>
            </a>
            {cheapest !== null ? (
              <p className="text-right text-[14px] text-mist">
                <span className="block font-serif text-[26px] leading-tight text-cream">
                  From {formatPrice(cheapest)} a night
                </span>
                {plural(rooms?.length ?? 0, 'room type')}, booked by the night
              </p>
            ) : null}
          </>
        }
      >
        <p className="mb-3 text-[12px] font-medium tracking-[0.14em] text-brass-lit uppercase">
          The hotel
        </p>
        <h1 className="mb-4 max-w-[14ch] font-serif text-[44px] leading-[1.02] font-normal tracking-[0.005em] text-cream sm:text-[72px]">
          Rooms by the night, on the water.
        </h1>
        <p className="max-w-[46ch] text-[16px] text-mist sm:text-[17px]">
          Choose your dates and see exactly what is free. No account needed to look; one to book.
        </p>
      </Hero>

      <Container className="pb-12">
        {/* Pulled up over the hero's fade so the two read as one composition. */}
        <section
          id="search"
          className="relative -mt-10 mb-8 scroll-mt-28 rounded-card bg-paper px-6 pt-5 pb-1 text-ink shadow-card sm:mx-6 sm:-mt-12"
        >
          <StayForm
            // Remount when the URL changes so a back/forward navigation
            // refills the form with the dates it lands on.
            key={`${stay?.checkIn}-${stay?.checkOut}-${stay?.guests}`}
            initial={stay}
            onSubmit={setStay}
            submitLabel="Search"
          />
        </section>

        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-serif text-[30px] leading-none text-cream">
            {stay ? 'Available for your stay' : 'Our rooms'}
          </h2>
          {rooms ? <p className="text-[14px] text-mist">{summary}</p> : null}
        </div>

        {error ? <Notice tone="error">{error}</Notice> : null}

        {rooms === null ? (
          <p className="text-mist">Loading rooms…</p>
        ) : rooms.length === 0 && !error ? (
          <Notice>
            No room type sleeps {stay ? plural(stay.guests, 'guest') : 'that many'}. Try a smaller party.
          </Notice>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard key={room.id} room={room} stay={stay} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
