import { Link } from 'react-router-dom';
import type { AvailableRoom, Room, Stay } from '../api';
import { ROOM_TYPE_LABEL, formatPrice, plural } from '../format';
import { stayToParams } from '../stay';

interface RoomCardProps {
  room: Room | AvailableRoom;
  /** Carried into the room page so the guest does not re-enter the dates. */
  stay: Stay | null;
}

// The API has no images yet, so the card leads with type and price set in
// the serif — the same trick a printed tariff card uses.
export function RoomCard({ room, stay }: RoomCardProps) {
  const available = 'availableUnits' in room ? room.availableUnits : null;
  const soldOut = available === 0;
  const href = `/rooms/${room.id}${stay ? `?${stayToParams(stay)}` : ''}`;

  return (
    <article
      className={`flex flex-col rounded-card bg-paper text-ink shadow-card ${soldOut ? 'opacity-70' : ''}`}
    >
      <div className="border-b border-paper-edge px-6 pt-5 pb-4">
        <p className="mb-1 text-[12px] font-medium tracking-[0.08em] text-graphite-soft uppercase">
          {ROOM_TYPE_LABEL[room.type]} · sleeps {room.capacity}
        </p>
        <h2 className="font-serif text-[26px] leading-tight">{room.name}</h2>
      </div>

      <div className="flex flex-1 flex-col px-6 pt-4 pb-5">
        <p className="mb-4 line-clamp-3 text-[14px] text-graphite">{room.description}</p>

        {room.amenities.length > 0 ? (
          <ul className="mb-5 flex flex-wrap gap-[6px]" aria-label="Amenities">
            {room.amenities.slice(0, 5).map((amenity) => (
              <li
                key={amenity}
                className="rounded-card border border-paper-edge bg-paper-raised px-2 py-[2px] text-[12px] text-graphite"
              >
                {amenity}
              </li>
            ))}
            {room.amenities.length > 5 ? (
              <li className="px-1 py-[2px] text-[12px] text-graphite-soft">
                +{room.amenities.length - 5} more
              </li>
            ) : null}
          </ul>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <span className="font-serif text-[28px] leading-none">{formatPrice(room.pricePerNight)}</span>
            <span className="ml-1 text-[13px] text-graphite-soft">/ night</span>
            {available !== null ? (
              <p className={`mt-1 text-[13px] ${soldOut ? 'text-rust-ink' : 'text-graphite-soft'}`}>
                {soldOut ? 'Sold out for these dates' : `${plural(available, 'room')} left`}
              </p>
            ) : null}
          </div>
          <Link
            to={href}
            aria-disabled={soldOut || undefined}
            className={
              'rounded-card border px-4 py-[9px] text-[14px] font-medium no-underline transition-colors duration-[120ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass ' +
              (soldOut
                ? 'border-paper-edge text-graphite-soft hover:bg-paper-dim'
                : 'border-transparent bg-brass text-ink-deep hover:bg-brass-lit')
            }
          >
            {soldOut ? 'View' : stay ? 'Book' : 'View'}
          </Link>
        </div>
      </div>
    </article>
  );
}
