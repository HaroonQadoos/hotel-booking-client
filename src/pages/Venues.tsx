import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as api from '../api';
import type { Venue, VenueType } from '../api';
import { Container } from '../components/Container';
import { Notice } from '../components/Notice';
import { VenueCard } from '../components/VenueCard';
import { VENUE_TYPE_LABEL } from '../format';

const TYPES: VenueType[] = ['conference', 'pool', 'hall'];

function isVenueType(value: string | null): value is VenueType {
  return TYPES.includes(value as VenueType);
}

const chip =
  'cursor-pointer rounded-full border px-4 py-[7px] text-[14px] whitespace-nowrap transition-colors duration-[120ms] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass';
const chipIdle = 'border-paper-edge bg-transparent text-graphite hover:border-ink-deep hover:text-ink';
const chipActive = 'border-ink-deep bg-ink-deep text-cream';

// The spaces booked by the hour: meetings, a swim, a party. The filter lives
// in the URL (?type=pool) for the same reason a stay does — so a link to
// "just the pool" can be shared and survives a refresh.
export function Venues() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('type');
  const type = isVenueType(raw) ? raw : undefined;

  const [venues, setVenues] = useState<Venue[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .getVenues(type)
      .then((result) => {
        if (cancelled) return;
        setVenues(result);
        setError('');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setVenues([]);
        setError(err instanceof api.ApiError ? err.message : 'Could not load the venues. Try again.');
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  const choose = (next: VenueType | undefined) => setParams(next ? { type: next } : {});

  return (
    <>
      {/* Same frame as the categories page, so the two read as siblings. */}
      <div className="px-3 pt-2 sm:px-8 sm:pt-3">
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
          <div className="flex flex-1 flex-col justify-end px-6 pt-24 pb-10 sm:px-12 sm:pb-14 lg:px-16">
            <p className="mb-3 text-[12px] font-medium tracking-[0.14em] text-brass-lit uppercase">Events & leisure</p>
            <h1 className="mb-4 max-w-[18ch] font-serif text-[44px] leading-[1.02] font-normal text-cream sm:text-[68px]">
              Space for the whole occasion.
            </h1>
            <p className="max-w-[48ch] text-[16px] text-mist sm:text-[17px]">
              A room to meet in, a pool to swim in, a hall to celebrate in. Each one booked by the hour, and each one
              yours alone for that time.
            </p>
          </div>
        </section>
      </div>

      <Container className="pt-10 pb-16 sm:pt-12 lg:pb-24">
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter by type">
          <button type="button" onClick={() => choose(undefined)} aria-pressed={!type} className={`${chip} ${!type ? chipActive : chipIdle}`}>
            All venues
          </button>
          {TYPES.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => choose(option)}
              aria-pressed={type === option}
              className={`${chip} ${type === option ? chipActive : chipIdle}`}
            >
              {VENUE_TYPE_LABEL[option]}
            </button>
          ))}
        </div>

        {error ? <Notice tone="error">{error}</Notice> : null}

        {venues === null ? (
          <p className="text-graphite-soft">Loading venues…</p>
        ) : venues.length === 0 && !error ? (
          <Notice>
            {type ? `No ${VENUE_TYPE_LABEL[type].toLowerCase()} is listed yet.` : 'No venues are listed yet.'}
          </Notice>
        ) : (
          <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </ul>
        )}
      </Container>
    </>
  );
}
