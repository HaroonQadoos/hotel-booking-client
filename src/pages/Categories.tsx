import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api';
import type { Room, RoomType } from '../api';
import { Container } from '../components/Container';
import { Notice } from '../components/Notice';
import { ROOM_TYPE_LABEL, formatPrice, plural } from '../format';

// How each kind of room is introduced. The rooms themselves — names, prices,
// how many they sleep — come from the API; only the framing lives here.
const CATEGORY: Record<RoomType, { photo: string; blurb: string }> = {
  single: {
    photo: '/rooms/single.jpg',
    blurb: 'A quiet room of your own. Everything a solo traveller needs for a good night, and nothing to share.',
  },
  double: {
    photo: '/rooms/double.jpg',
    blurb: 'Room for two, or for a family. More floor space, a bigger bed and a view worth waking up to.',
  },
  suite: {
    photo: '/rooms/suite.jpg',
    blurb: 'Our largest rooms, with a separate place to sit and the best of the hotel’s finishes.',
  },
};

// The order the categories are shown in, smallest room first.
const ORDER: RoomType[] = ['single', 'double', 'suite'];

interface Category {
  type: RoomType;
  rooms: Room[];
  fromPrice: number;
  minGuests: number;
  maxGuests: number;
}

// Only categories the hotel actually has a room in make the page.
function groupRooms(rooms: Room[]): Category[] {
  return ORDER.flatMap((type) => {
    const inType = rooms.filter((room) => room.type === type);
    if (inType.length === 0) return [];
    const capacities = inType.map((room) => room.capacity);
    return [
      {
        type,
        rooms: inType,
        fromPrice: Math.min(...inType.map((room) => room.pricePerNight)),
        minGuests: Math.min(...capacities),
        maxGuests: Math.max(...capacities),
      },
    ];
  });
}

export function Categories() {
  const [rooms, setRooms] = useState<Room[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .getRooms()
      .then((result) => {
        if (!cancelled) setRooms(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setRooms([]);
        setError(err instanceof api.ApiError ? err.message : 'Could not load the rooms. Try again.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = rooms ? groupRooms(rooms) : [];

  return (
    <>
      {/* A shorter cousin of the home hero: same frame, same photo. */}
      <div className="px-3 pt-3 sm:px-8 sm:pt-8">
        <section className="relative isolate flex min-h-[380px] flex-col overflow-hidden rounded-[28px] bg-ink-deep sm:min-h-[460px] sm:rounded-[36px]">
          <img
            src="/hero.jpg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 -z-10 h-full w-full object-cover object-[50%_60%]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-linear-to-t from-ink-deep/90 via-ink-deep/45 to-ink-deep/40"
          />
          <div className="flex flex-1 flex-col justify-end px-6 pt-32 pb-10 sm:px-12 sm:pb-14 lg:px-16">
            <p className="mb-3 text-[12px] font-medium tracking-[0.14em] text-brass-lit uppercase">Room categories</p>
            <h1 className="mb-4 max-w-[18ch] font-serif text-[44px] leading-[1.02] font-normal text-cream sm:text-[68px]">
              Find the room that fits the stay.
            </h1>
            <p className="max-w-[48ch] text-[16px] text-mist sm:text-[17px]">
              {categories.length > 0
                ? `${categories.length === 1 ? '1 category' : `${categories.length} categories`} and ${plural(rooms?.length ?? 0, 'room type')} to choose from, every one booked by the night.`
                : 'Every kind of room we offer, booked by the night.'}
            </p>
          </div>
        </section>
      </div>

      <Container className="pt-12 pb-16 sm:pt-16 lg:pb-24">
        {error ? <Notice tone="error">{error}</Notice> : null}

        {rooms === null ? (
          <p className="text-graphite-soft">Loading categories…</p>
        ) : categories.length === 0 && !error ? (
          <Notice>No rooms are listed yet.</Notice>
        ) : (
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {categories.map((category, index) => (
              <CategoryCard key={category.type} category={category} index={index} />
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}

function CategoryCard({ category, index }: { category: Category; index: number }) {
  const { type, rooms, fromPrice, minGuests, maxGuests } = category;
  const label = ROOM_TYPE_LABEL[type];
  const sleeps = minGuests === maxGuests ? `${minGuests}` : `${minGuests}–${maxGuests}`;
  // A room's own photo wins over the stock one, as on the room page.
  const photo = rooms.find((room) => room.images.length > 0)?.images[0] ?? CATEGORY[type].photo;

  return (
    <li className="group flex flex-col overflow-hidden rounded-[28px] border border-paper-edge bg-paper text-ink transition-shadow duration-300 hover:shadow-[0_32px_60px_-30px_rgba(11,22,32,0.5)]">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={photo}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-ink-deep/80 via-ink-deep/10 to-transparent" />
        <span className="absolute top-4 left-4 rounded-full bg-ink-deep/60 px-3 py-1 font-serif text-[15px] text-cream backdrop-blur-md">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-6">
          <p className="mb-1 text-[12px] font-medium tracking-[0.14em] text-brass-lit uppercase">Category</p>
          <h2 className="font-serif text-[40px] leading-none font-normal text-cream">{label} rooms</h2>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="mb-6 text-[15px] leading-relaxed text-graphite">{CATEGORY[type].blurb}</p>

        <dl className="mb-6 grid grid-cols-3 divide-x divide-paper-edge rounded-2xl border border-paper-edge bg-paper-raised text-center">
          <div className="px-2 py-3">
            <dt className="text-[11px] font-medium tracking-[0.12em] text-graphite-soft uppercase">Sleeps</dt>
            <dd className="mt-1 font-serif text-[22px] leading-none">{sleeps}</dd>
          </div>
          <div className="px-2 py-3">
            <dt className="text-[11px] font-medium tracking-[0.12em] text-graphite-soft uppercase">From</dt>
            <dd className="mt-1 font-serif text-[22px] leading-none">{formatPrice(fromPrice)}</dd>
          </div>
          <div className="px-2 py-3">
            <dt className="text-[11px] font-medium tracking-[0.12em] text-graphite-soft uppercase">Rooms</dt>
            <dd className="mt-1 font-serif text-[22px] leading-none">{rooms.length}</dd>
          </div>
        </dl>

        {/* Every room of this kind, each a way into its own page. */}
        <ul className="border-t border-paper-edge" aria-label={`${label} rooms`}>
          {rooms.map((room) => (
            <li key={room.id} className="border-b border-paper-edge last:border-b-0">
              <Link
                to={`/rooms/${room.id}`}
                className="group/room flex items-center justify-between gap-3 py-4 text-ink no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
              >
                <span className="min-w-0">
                  <span className="block truncate text-[16px] font-medium">{room.name}</span>
                  <span className="text-[13px] text-graphite-soft">
                    Sleeps {room.capacity} · {formatPrice(room.pricePerNight)} / night
                  </span>
                </span>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-paper-edge transition-colors duration-200 group-hover/room:border-ink-deep group-hover/room:bg-ink-deep group-hover/room:text-cream">
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                    <path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}
