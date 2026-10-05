import { useEffect, useState } from 'react';
import * as api from '../api';
import type { AvailableRoom, Room } from '../api';
import { Container } from '../components/Container';
import { Faqs } from '../components/Faqs';
import { Hero } from '../components/Hero';
import { HotelMap } from '../components/HotelMap';
import { Notice } from '../components/Notice';
import { RoomCarousel } from '../components/RoomCarousel';
import { StayForm } from '../components/StayForm';
import { VenueTeaser } from '../components/VenueTeaser';
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

  // The API sorts by list price, and a sale can undercut a cheaper room, so
  // the "from" price is the lowest price a guest would actually pay today.
  const cheapest =
    rooms && rooms.length > 0 ? Math.min(...rooms.map((room) => room.effectivePricePerNight)) : null;

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
          className="relative z-10 mx-auto -mt-12 mb-12 max-w-[1120px] scroll-mt-24 sm:-mt-14 sm:scroll-mt-36"
        >
          <StayForm
            // Remount when the URL changes so a back/forward navigation
            // refills the form with the dates it lands on.
            key={`${stay?.checkIn}-${stay?.checkOut}-${stay?.guests}`}
            initial={stay}
            onSubmit={setStay}
            submitLabel="Search"
            layout="pill"
          />
        </section>

        {error ? <Notice tone="error">{error}</Notice> : null}

        {rooms === null ? (
          <p className="text-mist">Loading rooms…</p>
        ) : rooms.length === 0 && !error ? (
          <Notice>
            No room type sleeps {stay ? plural(stay.guests, 'guest') : 'that many'}. Try a smaller party.
          </Notice>
        ) : (
          <RoomCarousel
            title={stay ? 'Available for your stay' : 'Our rooms'}
            aside={summary}
            rooms={rooms}
            stay={stay}
          />
        )}

        <VenueTeaser />

        <HotelMap />

        <Faqs />
      </Container>
    </>
  );
}
