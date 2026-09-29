import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AvailableRoom, Room, Stay } from '../api';
import { ROOM_TYPE_LABEL, formatPrice, plural } from '../format';
import { roomPhoto } from '../roomPhoto';
import { stayToParams } from '../stay';

type AnyRoom = Room | AvailableRoom;

const roundButton =
  'grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-ink/15 bg-transparent text-ink ' +
  'transition-colors duration-[120ms] hover:bg-ink hover:text-cream disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass';

function Arrow({ direction = 'right' }: { direction?: 'left' | 'right' }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className={direction === 'left' ? 'rotate-180' : undefined}
    >
      <path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5" r="2.75" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.75 14c.6-2.7 2.7-4.25 5.25-4.25S12.65 11.3 13.25 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// One photo card: the whole card is the link to the room, the round arrow in
// the corner is its visible affordance.
function RoomSlide({ room, stay }: { room: AnyRoom; stay: Stay | null }) {
  const available = 'availableUnits' in room ? room.availableUnits : null;
  const soldOut = available === 0;
  const href = `/rooms/${room.id}${stay ? `?${stayToParams(stay)}` : ''}`;

  return (
    <li className="w-[82%] shrink-0 snap-start sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-40px)/3)]">
      <Link
        to={href}
        className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-[22px] bg-ink-deep text-cream no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass sm:aspect-[5/6]"
      >
        <img
          src={roomPhoto(room)}
          alt=""
          loading="lazy"
          className={`absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] ${soldOut ? 'grayscale-[60%]' : ''}`}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-t from-ink-deep/95 via-ink-deep/35 via-50% to-ink-deep/10"
        />

        {available !== null ? (
          <span
            className={`absolute top-4 left-4 rounded-full px-3 py-1 text-[12px] font-medium backdrop-blur-md ${soldOut ? 'bg-rust/80 text-cream' : 'bg-ink-deep/60 text-cream'}`}
          >
            {soldOut ? 'Sold out' : `${plural(available, 'room')} left`}
          </span>
        ) : null}

        <div className="p-5 sm:p-6">
          <p className="mb-1 text-[12px] font-medium tracking-[0.14em] text-brass-lit uppercase">
            {ROOM_TYPE_LABEL[room.type]}
          </p>
          <h3 className="font-serif text-[30px] leading-[1.05] font-normal">{room.name}</h3>

          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-mist">
              <span className="flex items-center gap-[6px]">
                <PersonIcon />
                {plural(room.capacity, 'person')}
              </span>
              <span aria-hidden="true" className="h-3 w-px bg-cream/25" />
              <span>{formatPrice(room.pricePerNight)} / night</span>
            </p>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-cream/30 bg-ink-deep/30 backdrop-blur-sm transition-colors duration-200 group-hover:border-brass group-hover:bg-brass group-hover:text-ink-deep">
              <Arrow />
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

// A row of room cards that scrolls sideways — swipe on a phone, the arrow
// buttons (or trackpad) on a desktop. Native scroll-snap does the physics.
export function RoomCarousel({
  title,
  aside,
  rooms,
  stay,
}: {
  title: string;
  aside?: string;
  rooms: AnyRoom[];
  stay: Stay | null;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure, rooms.length]);

  // One card's width plus the gap, so each press lands on the next card.
  const step = (direction: 1 | -1) => {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    el.scrollBy({ left: direction * (card.offsetWidth + 20), behavior: 'smooth' });
  };

  return (
    <section aria-label={title}>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-[30px] leading-none text-ink">{title}</h2>
          {aside ? <p className="mt-2 text-[14px] text-graphite-soft">{aside}</p> : null}
        </div>
        {atStart && atEnd ? null : (
          <div className="flex gap-2">
            <button type="button" className={roundButton} onClick={() => step(-1)} disabled={atStart} aria-label="Previous rooms">
              <Arrow direction="left" />
            </button>
            <button type="button" className={roundButton} onClick={() => step(1)} disabled={atEnd} aria-label="More rooms">
              <Arrow />
            </button>
          </div>
        )}
      </div>

      <ul
        ref={track}
        onScroll={measure}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:scroll-px-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {rooms.map((room) => (
          <RoomSlide key={room.id} room={room} stay={stay} />
        ))}
      </ul>
    </section>
  );
}
