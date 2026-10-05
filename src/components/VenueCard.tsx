import { Link } from 'react-router-dom';
import type { Venue } from '../api';
import { VENUE_TYPE_LABEL, formatHourShort, formatPrice } from '../format';
import { plainText } from '../richText';
import { venuePhoto } from '../venuePhoto';
import { WasPrice } from './Sale';

const iconProps = {
  width: 15,
  height: 15,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function GuestsIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="6" cy="5.5" r="2.5" />
      <path d="M1.5 13.5c.6-2.3 2.3-3.5 4.5-3.5s3.9 1.2 4.5 3.5" />
      <path d="M10.5 3.2a2.5 2.5 0 0 1 0 4.6M12 10.3c1.2.5 2 1.6 2.5 3.2" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg {...iconProps}>
      <circle cx="8" cy="8" r="6.2" />
      <path d="M8 4.6V8l2.3 1.5" />
    </svg>
  );
}

function HourglassIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 1.8h8M4 14.2h8M5 1.8c0 3.4 6 3.4 6 6.2s-6 2.8-6 6.2M11 1.8c0 3.4-6 3.4-6 6.2s6 2.8 6 6.2" />
    </svg>
  );
}

// A venue in the list. The photo carries the name, as the room carousel's
// cards do; underneath, the three facts that decide whether it fits — how
// many, when, how long — and the price beside the way in. The whole card is
// one link, so the arrow is decoration, not a second tab stop.
export function VenueCard({ venue }: { venue: Venue }) {
  const minimum = venue.minHours === 1 ? '1 hour minimum' : `${venue.minHours} hours minimum`;

  return (
    <li>
      <Link
        to={`/venues/${venue.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-paper-edge bg-paper-raised text-ink no-underline shadow-[0_1px_0_rgba(11,22,32,0.04)] transition-[box-shadow,transform,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-brass/40 hover:shadow-[0_34px_60px_-32px_rgba(11,22,32,0.55)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass motion-reduce:hover:translate-y-0"
      >
        <div className="relative isolate m-2 mb-0 aspect-[5/4] overflow-hidden rounded-[22px] bg-ink-deep">
          <img
            src={venuePhoto(venue)}
            alt=""
            loading="lazy"
            className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05] motion-reduce:group-hover:scale-100"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-linear-to-t from-ink-deep/90 via-ink-deep/20 via-55% to-ink-deep/25"
          />

          <div className="flex items-start justify-between gap-3 p-4">
            <span className="rounded-full border border-cream/20 bg-ink-deep/45 px-3 py-[5px] text-[11px] font-medium tracking-[0.14em] text-cream uppercase backdrop-blur-md">
              {VENUE_TYPE_LABEL[venue.type]}
            </span>
            {venue.discountActive ? (
              <span className="rounded-full bg-brass px-3 py-[5px] text-[12px] font-semibold text-ink-deep tabular-nums shadow-[0_8px_20px_-8px_rgba(0,0,0,0.6)]">
                <span className="sr-only">{venue.discountPercent}% off</span>
                <span aria-hidden="true">−{venue.discountPercent}% today</span>
              </span>
            ) : null}
          </div>

          <h2 className="absolute inset-x-0 bottom-0 p-5 font-serif text-[32px] leading-[1.04] font-normal text-balance text-cream">
            {venue.name}
          </h2>
        </div>

        <div className="flex flex-1 flex-col px-6 pt-5 pb-6">
          <p className="mb-5 line-clamp-2 text-[15px] leading-relaxed text-graphite">{plainText(venue.description)}</p>

          <ul className="mb-6 flex flex-wrap gap-x-4 gap-y-2 text-[13.5px] text-graphite" aria-label="At a glance">
            <li className="flex items-center gap-[6px]">
              <span className="text-brass-ink">
                <GuestsIcon />
              </span>
              Up to {venue.capacity}
            </li>
            <li className="flex items-center gap-[6px] whitespace-nowrap">
              <span className="text-brass-ink">
                <ClockIcon />
              </span>
              {formatHourShort(venue.openingHour)} – {formatHourShort(venue.closingHour)}
            </li>
            <li className="flex items-center gap-[6px]">
              <span className="text-brass-ink">
                <HourglassIcon />
              </span>
              {minimum}
            </li>
          </ul>

          <div className="mt-auto flex items-end justify-between gap-4 border-t border-paper-edge pt-5">
            <div>
              {venue.discountActive ? (
                <WasPrice amount={venue.pricePerHour} className="block text-[13px] leading-none text-graphite-soft" />
              ) : (
                <span className="block text-[11px] leading-none font-medium tracking-[0.14em] text-graphite-soft uppercase">
                  From
                </span>
              )}
              <p className="mt-[6px] leading-none">
                <span className="font-serif text-[34px]">{formatPrice(venue.effectivePricePerHour)}</span>
                <span className="ml-1 text-[13px] text-graphite-soft">/ hour</span>
              </p>
            </div>
            <span className="inline-flex items-center gap-3 rounded-full bg-ink-deep py-[6px] pr-[6px] pl-5 text-[14px] font-medium text-cream transition-colors duration-200 group-hover:bg-ink">
              Book a slot
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brass text-ink-deep transition-transform duration-300 ease-out group-hover:translate-x-[3px] motion-reduce:group-hover:translate-x-0">
                <svg width="15" height="15" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
