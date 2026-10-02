import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../api';
import type { Venue } from '../api';
import { VENUE_TYPE_LABEL, formatPrice, plural } from '../format';
import { venuePhoto } from '../venuePhoto';
import { SaleBadge } from './Sale';

// A short detour on the front page to the spaces booked by the hour. It
// shows nothing at all until there are venues to show — a failed load or an
// empty list just leaves the page as it was.
export function VenueTeaser() {
  const [venues, setVenues] = useState<Venue[]>([]);

  useEffect(() => {
    let cancelled = false;
    api
      .getVenues()
      .then((result) => {
        if (!cancelled) setVenues(result);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (venues.length === 0) return null;

  return (
    <section aria-labelledby="venues-title" className="pt-20 lg:pt-28">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-3 text-[12px] font-medium tracking-[0.14em] text-brass-ink uppercase">Beyond the room</p>
          <h2
            id="venues-title"
            className="mb-4 max-w-[16ch] font-serif text-[40px] leading-[1.02] font-normal text-balance text-ink sm:text-[52px]"
          >
            Meet, swim, celebrate.
          </h2>
          <p className="max-w-[44ch] text-[15px] leading-relaxed text-graphite">
            Spaces you can have to yourselves by the hour, whether or not you are staying the night.
          </p>
        </div>
        <Link
          to="/venues"
          className="group inline-flex w-fit items-center gap-3 rounded-full bg-ink-deep py-2 pr-2 pl-6 text-[15px] font-medium text-cream no-underline transition-colors duration-[120ms] hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          See all venues
          <span className="grid h-10 w-10 place-items-center rounded-full bg-brass text-ink-deep">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </Link>
      </div>

      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {venues.slice(0, 3).map((venue) => (
          <li key={venue.id}>
            <Link
              to={`/venues/${venue.id}`}
              className="group relative isolate flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-[22px] bg-ink-deep text-cream no-underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass sm:aspect-[4/5] lg:aspect-[5/4]"
            >
              <img
                src={venuePhoto(venue)}
                alt=""
                loading="lazy"
                className="absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 -z-10 bg-linear-to-t from-ink-deep/95 via-ink-deep/35 via-50% to-ink-deep/10"
              />
              {venue.discountActive ? (
                <SaleBadge percent={venue.discountPercent} className="absolute top-4 right-4" />
              ) : null}
              <div className="p-5">
                <p className="mb-1 text-[12px] font-medium tracking-[0.14em] text-brass-lit uppercase">
                  {VENUE_TYPE_LABEL[venue.type]}
                </p>
                <h3 className="font-serif text-[26px] leading-[1.05] font-normal">{venue.name}</h3>
                <p className="mt-2 text-[14px] text-mist">
                  Up to {plural(venue.capacity, 'guest')} · {formatPrice(venue.effectivePricePerHour)} / hour
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
