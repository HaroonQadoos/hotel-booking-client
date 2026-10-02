import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import * as api from '../api';
import type { Venue, VenueAvailability, VenueType } from '../api';
import { useAuth } from '../auth';
import { Calendar } from '../components/Calendar';
import { Container } from '../components/Container';
import { Notice } from '../components/Notice';
import { SaleBadge, WasPrice } from '../components/Sale';
import { SlotPicker } from '../components/SlotPicker';
import { RichText } from '../components/RichText';
import { VENUE_TYPE_LABEL, addDays, formatDay, formatPrice, formatSlot, plural, todayIso } from '../format';
import { quoteVenue } from '../sale';
import { isBooked, lastHourRange } from '../slots';
import { venuePhoto } from '../venuePhoto';

// Mirrors the API's limits so a guest hears about them before the round
// trip. The API still has the final say.
const MAX_DAYS_AHEAD = 180;
const MAX_NOTES = 500;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// An example of the kind of note the front desk finds useful, per venue.
const NOTES_PLACEHOLDER: Record<VenueType, string> = {
  conference: 'Board meeting for 12, need a projector and water on the table',
  pool: 'Family swim with two kids, could we have extra towels?',
  hall: 'Birthday for 8-year-old, need a cake table',
};

// The request a signed-out guest was making, carried through sign-in in the
// URL (?date=&start=&end=&guests=&notes=) so they come back to it filled in.
// Anything malformed is simply dropped.
interface Draft {
  date: string;
  start: number | null;
  end: number | null;
  guests: number;
  notes: string;
}

function parseDraft(params: URLSearchParams): Draft {
  const today = todayIso();
  const date = params.get('date') ?? '';
  const start = Number(params.get('start'));
  const end = Number(params.get('end'));
  const guests = Number(params.get('guests'));
  const hasSlot = params.has('start') && params.has('end') && Number.isInteger(start) && Number.isInteger(end) && end > start;
  return {
    date: DATE.test(date) && date >= today ? date : today,
    start: hasSlot ? start : null,
    end: hasSlot ? end : null,
    guests: Number.isInteger(guests) && guests >= 1 ? guests : 1,
    notes: (params.get('notes') ?? '').slice(0, MAX_NOTES),
  };
}

// The hour a guest is in right now, so today's past hours can be greyed out.
// Venue hours are hotel time; a guest booking from elsewhere is rare enough
// that the browser's clock stands in for it, and the API checks the date.
function currentHour(): number {
  return new Date().getHours();
}

export function VenueDetail() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [initial] = useState(() => parseDraft(params));

  const [venue, setVenue] = useState<Venue | null>(null);
  const [loadError, setLoadError] = useState('');

  const [date, setDate] = useState(initial.date);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [availability, setAvailability] = useState<VenueAvailability | null>(null);
  const [availabilityError, setAvailabilityError] = useState('');
  // Bumped to fetch the day again, e.g. after someone else took the slot.
  const [reload, setReload] = useState(0);

  const [start, setStart] = useState<number | null>(initial.start);
  const [end, setEnd] = useState<number | null>(initial.end);
  // True between picking a start and picking the last hour.
  const [extending, setExtending] = useState(false);
  const [guests, setGuests] = useState(initial.guests);
  const [notes, setNotes] = useState(initial.notes);
  const [bookError, setBookError] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getVenue(id)
      .then((result) => {
        if (!cancelled) setVenue(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setLoadError(
          err instanceof api.ApiError && err.status === 404
            ? 'That venue does not exist.'
            : 'Could not load this venue. Try again.',
        );
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    api
      .getVenueAvailability(id, date)
      .then((result) => {
        if (cancelled) return;
        setAvailability(result);
        setAvailabilityError('');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setAvailability(null);
        setAvailabilityError(err instanceof api.ApiError ? err.message : 'Could not load the times. Try again.');
      });
    return () => {
      cancelled = true;
    };
  }, [id, date, reload]);

  if (loadError) {
    return (
      <Container className="pt-24 pb-10 sm:pt-28">
        <Notice tone="error">{loadError}</Notice>
        <Link to="/venues" className="text-brass-ink underline underline-offset-2 hover:text-ink">
          Back to all venues
        </Link>
      </Container>
    );
  }
  if (!venue) {
    return (
      <>
        {/* Same frame as the loaded banner, so the page does not jump. */}
        <div className="px-3 pt-2 sm:px-8 sm:pt-3">
          <div className="h-[62dvh] min-h-[420px] animate-pulse rounded-[28px] bg-ink-deep/90 sm:rounded-[36px]" />
        </div>
        <Container className="py-10">
          <p className="text-graphite-soft">Loading venue…</p>
        </Container>
      </>
    );
  }

  const today = todayIso();
  const lastDay = addDays(today, MAX_DAYS_AHEAD);
  // Until the day's bookings have loaded, nothing can be picked — better
  // than letting a guest choose an hour that turns out to be taken.
  const isTaken = (hour: number) =>
    !availability ||
    availability.date.slice(0, 10) !== date ||
    isBooked(hour, availability.booked) ||
    (date === today && hour <= currentHour());
  const lastHours = extending && start !== null ? lastHourRange(start, venue, isTaken) : null;
  const hours = start !== null && end !== null ? end - start : 0;
  const quote = hours > 0 ? quoteVenue(venue, date, hours) : null;
  const dayHours = Array.from({ length: venue.closingHour - venue.openingHour }, (_, i) => venue.openingHour + i);
  const fullyBooked = availability !== null && dayHours.every(isTaken);

  function chooseDate(next: string) {
    setDate(next);
    setCalendarOpen(false);
    // The hours belong to the old day; on a new one they may be taken.
    setStart(null);
    setEnd(null);
    setExtending(false);
    setBookError('');
  }

  // A tap on a tinted cell ends the slot there. Any other tap starts a new
  // slot, pre-filled to the shortest allowed length so the minimum is never
  // something the guest has to discover by failing.
  function pickHour(hour: number) {
    if (!venue) return;
    setBookError('');
    if (lastHours && hour >= lastHours.first && hour <= lastHours.last) {
      setEnd(hour + 1);
      setExtending(false);
      return;
    }
    const range = lastHourRange(hour, venue, isTaken);
    setStart(hour);
    setEnd(range ? range.first + 1 : hour + 1);
    setExtending(true);
  }

  function validate(): string {
    if (!venue) return '';
    if (!DATE.test(date) || date < today) return 'Choose a date from today on.';
    if (date > lastDay) return `Bookings open ${MAX_DAYS_AHEAD} days ahead; choose an earlier date.`;
    if (start === null || end === null) return 'Choose a start and end time.';
    for (let hour = start; hour < end; hour++) {
      if (isTaken(hour)) return 'Part of that time is already booked. Choose another slot.';
    }
    if (hours < venue.minHours) return `Book at least ${plural(venue.minHours, 'hour')}.`;
    if (hours > venue.maxHours) return `Bookings are limited to ${plural(venue.maxHours, 'hour')}.`;
    if (guests < 1) return 'At least one guest.';
    if (guests > venue.capacity) return `This venue holds at most ${plural(venue.capacity, 'guest')}.`;
    if (notes.length > MAX_NOTES) return `Keep notes under ${MAX_NOTES} characters.`;
    return '';
  }

  async function book(event: FormEvent) {
    event.preventDefault();
    const problem = validate();
    setBookError(problem);
    if (problem || !venue || start === null || end === null) return;

    const trimmed = notes.trim();

    // Same as a room: booking needs an account, and the guest is sent to
    // sign in with the whole request in the URL so it is waiting for them
    // when they come back.
    if (!user) {
      const draft = new URLSearchParams({
        date,
        start: String(start),
        end: String(end),
        guests: String(guests),
        ...(trimmed ? { notes: trimmed } : {}),
      });
      navigate('/login', { state: { from: `${location.pathname}?${draft}` } });
      return;
    }

    setBooking(true);
    try {
      const created = await api.createVenueBooking(venue.id, {
        date,
        startHour: start,
        endHour: end,
        guests,
        notes: trimmed || undefined,
      });
      navigate('/bookings?tab=venues', {
        state: {
          notice: `Requested ${created.venue.name ?? venue.name} for ${formatDay(created.date.slice(0, 10))}, ${formatSlot(created.startHour, created.endHour)}. It is pending until the hotel confirms it.`,
        },
      });
    } catch (err) {
      if (err instanceof api.ApiError) {
        // 409 is "someone got there first": show the day as it is now.
        if (err.status === 409) {
          setBookError(`${err.message} Pick another time.`);
          setStart(null);
          setEnd(null);
          setExtending(false);
          setReload((n) => n + 1);
        } else {
          setBookError(Object.values(err.fieldErrors)[0] ?? err.message);
        }
      } else {
        setBookError('Something went wrong. Try again.');
      }
    } finally {
      setBooking(false);
    }
  }

  const label = VENUE_TYPE_LABEL[venue.type];
  const opening = formatSlot(venue.openingHour, venue.closingHour);
  const lengths =
    venue.minHours === venue.maxHours
      ? `Booked in blocks of ${plural(venue.minHours, 'hour')}.`
      : `Booked by the hour, from ${plural(venue.minHours, 'hour')} up to ${venue.maxHours}.`;

  return (
    <>
      {/* The banner, in the same frame as a room's. */}
      <div className="px-3 pt-2 sm:px-8 sm:pt-3">
        <section className="relative isolate flex h-[62dvh] min-h-[420px] flex-col overflow-hidden rounded-[28px] bg-ink-deep sm:min-h-[480px] sm:rounded-[36px]">
          <img
            src={venuePhoto(venue)}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-linear-to-t from-ink-deep/90 via-ink-deep/30 via-55% to-ink-deep/40"
          />

          <div className="flex flex-1 flex-col justify-end px-6 pt-24 pb-8 sm:px-12 sm:pb-12 lg:px-16 lg:pb-14">
            <Link
              to="/venues"
              className="mb-auto inline-flex w-fit items-center gap-2 rounded-full border border-cream/25 bg-ink-deep/40 px-4 py-2 text-[14px] text-cream no-underline backdrop-blur-sm transition-colors duration-[120ms] hover:bg-ink-deep/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass sm:mt-4"
            >
              <span aria-hidden="true">←</span> All venues
            </Link>

            <p className="mb-3 text-[12px] font-medium tracking-[0.14em] text-brass-lit uppercase">{label}</p>
            <h1 className="mb-5 max-w-[16ch] font-serif text-[44px] leading-[1.02] font-normal text-cream sm:text-[68px]">
              {venue.name}
            </h1>
            <ul className="flex flex-wrap gap-2 text-[14px] text-cream">
              <li className="rounded-full border border-cream/25 bg-ink-deep/40 px-4 py-[7px] backdrop-blur-sm">
                Up to {plural(venue.capacity, 'guest')}
              </li>
              <li className="flex items-center gap-2 rounded-full border border-cream/25 bg-ink-deep/40 px-4 py-[7px] backdrop-blur-sm">
                {venue.discountActive ? <WasPrice amount={venue.pricePerHour} className="text-mist" /> : null}
                {formatPrice(venue.effectivePricePerHour)} an hour
                {venue.discountActive ? <SaleBadge percent={venue.discountPercent} className="-mr-2" /> : null}
              </li>
              <li className="hidden rounded-full border border-cream/25 bg-ink-deep/40 px-4 py-[7px] backdrop-blur-sm sm:block">
                Open {opening}
              </li>
            </ul>
          </div>
        </section>
      </div>

      <Container className="pt-10 pb-16 sm:pt-12 lg:pb-24">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px] lg:items-start lg:gap-12">
          <article className="text-ink">
            <h2 className="mb-3 text-[12px] font-medium tracking-[0.14em] text-brass-ink uppercase">
              About the venue
            </h2>
            <RichText
              value={venue.description}
              className="mb-10 max-w-[62ch] font-serif text-[24px] leading-[1.35] text-ink sm:text-[28px]"
            />

            {venue.amenities.length > 0 ? (
              <>
                <h2 className="mb-4 text-[12px] font-medium tracking-[0.14em] text-brass-ink uppercase">
                  Amenities
                </h2>
                <ul className="mb-10 grid grid-cols-1 gap-x-6 border-t border-paper-edge sm:grid-cols-2">
                  {venue.amenities.map((amenity) => (
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

            {/* What the booking panel enforces, said plainly up front. */}
            <h2 className="mb-4 text-[12px] font-medium tracking-[0.14em] text-brass-ink uppercase">Good to know</h2>
            <dl className="grid grid-cols-1 border-t border-paper-edge text-[15px] sm:grid-cols-2 sm:gap-x-6">
              <div className="border-b border-paper-edge py-3">
                <dt className="text-graphite-soft">Open</dt>
                <dd className="text-ink">Every day, {opening}</dd>
              </div>
              <div className="border-b border-paper-edge py-3">
                <dt className="text-graphite-soft">Length</dt>
                <dd className="text-ink">{lengths}</dd>
              </div>
              <div className="border-b border-paper-edge py-3">
                <dt className="text-graphite-soft">Guests</dt>
                <dd className="text-ink">Up to {venue.capacity}, and the space is yours alone for the time you book.</dd>
              </div>
              <div className="border-b border-paper-edge py-3">
                <dt className="text-graphite-soft">Confirmation</dt>
                <dd className="text-ink">The front desk accepts each request; cancel any time up to the day.</dd>
              </div>
            </dl>
          </article>

          <aside className="rounded-[22px] border border-paper-edge bg-paper px-6 pt-6 pb-3 text-ink shadow-card lg:-mt-40">
            {venue.discountActive ? (
              <p className="mb-2 flex items-center gap-2 text-[14px] text-graphite-soft">
                <WasPrice amount={venue.pricePerHour} />
                <SaleBadge percent={venue.discountPercent} />
                <span className="text-[13px]">today</span>
              </p>
            ) : null}
            <p className="mb-5 flex items-baseline justify-between gap-3">
              <span>
                <span className="font-serif text-[34px] leading-none">{formatPrice(venue.effectivePricePerHour)}</span>
                <span className="ml-1 text-[13px] text-graphite-soft">/ hour</span>
              </span>
              <span className="text-[13px] text-graphite-soft">Up to {venue.capacity}</span>
            </p>

            {bookError ? (
              <p
                className="mb-[18px] rounded-r-card border-l-[3px] border-rust bg-rust/10 px-3 py-[10px] text-[13.5px] text-rust-ink"
                role="alert"
              >
                {bookError}
              </p>
            ) : null}

            {!venue.isActive ? (
              <p className="mb-4 text-[14px] text-graphite">This venue is no longer offered.</p>
            ) : (
              <form onSubmit={(event) => void book(event)} noValidate>
                {/* The day: a summary row that opens a calendar in place. */}
                <p className="mb-[5px] text-[13px] font-medium text-graphite">Date</p>
                <button
                  type="button"
                  onClick={() => setCalendarOpen(!calendarOpen)}
                  aria-expanded={calendarOpen}
                  aria-controls="venue-calendar"
                  disabled={booking}
                  className="mb-[15px] flex w-full cursor-pointer items-center justify-between rounded-card border border-paper-edge bg-paper-raised px-3 py-[11px] text-left text-[15px] text-ink transition-colors duration-[120ms] hover:border-ink-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:cursor-not-allowed"
                >
                  {formatDay(date)}
                  <span className="text-[13px] text-brass-ink underline underline-offset-2">
                    {calendarOpen ? 'Close' : 'Change'}
                  </span>
                </button>
                {calendarOpen ? (
                  <div id="venue-calendar" className="mb-[15px] rounded-[18px] border border-paper-edge bg-paper-raised p-4">
                    <Calendar value={date} onSelect={chooseDate} min={today} max={lastDay} picking="start" />
                  </div>
                ) : null}

                <div className="mb-[5px] flex items-baseline justify-between">
                  <p className="text-[13px] font-medium text-graphite">Time</p>
                  <p className="text-[12.5px] text-graphite-soft">
                    {venue.minHours === venue.maxHours
                      ? plural(venue.minHours, 'hour')
                      : `${venue.minHours}–${venue.maxHours} hours`}
                  </p>
                </div>
                {availabilityError ? (
                  <p className="mb-[15px] text-[13px] text-rust">{availabilityError}</p>
                ) : (
                  <div className="mb-2">
                    <SlotPicker
                      openingHour={venue.openingHour}
                      closingHour={venue.closingHour}
                      isTaken={isTaken}
                      start={start}
                      end={end}
                      lastHours={lastHours}
                      onPick={pickHour}
                      disabled={booking}
                    />
                  </div>
                )}
                <p className="mb-[15px] text-[12.5px] text-graphite-soft" aria-live="polite">
                  {!availability
                    ? 'Loading times…'
                    : start !== null && end !== null
                      ? `${formatSlot(start, end)} · ${plural(hours, 'hour')}${extending && lastHours && lastHours.last + 1 > end ? ' — tap a tinted hour to stay longer.' : ''}`
                      : fullyBooked
                        ? 'Nothing left on this day. Try another date.'
                        : 'Tap the hour you want to start.'}
                </p>

                <div className="mb-[15px] flex items-center justify-between gap-3">
                  <span>
                    <span id="venue-guests-label" className="block text-[13px] font-medium text-graphite">
                      Guests
                    </span>
                    <output aria-live="polite" className="text-[15px] text-ink">
                      {plural(guests, 'guest')}
                    </output>
                  </span>
                  <span className="flex items-center gap-1" role="group" aria-labelledby="venue-guests-label">
                    <button
                      type="button"
                      className={stepper}
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      disabled={booking || guests <= 1}
                      aria-label="Fewer guests"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      className={stepper}
                      onClick={() => setGuests(Math.min(venue.capacity, guests + 1))}
                      disabled={booking || guests >= venue.capacity}
                      aria-label="More guests"
                    >
                      +
                    </button>
                  </span>
                </div>

                <div className="mb-[15px]">
                  <div className="mb-[5px] flex items-baseline justify-between">
                    <label htmlFor="venue-notes" className="text-[13px] font-medium text-graphite">
                      Notes <span className="font-normal text-graphite-soft">(optional)</span>
                    </label>
                    <span className="text-[12px] text-graphite-soft tabular-nums">
                      {notes.length}/{MAX_NOTES}
                    </span>
                  </div>
                  <textarea
                    id="venue-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    maxLength={MAX_NOTES}
                    rows={3}
                    disabled={booking}
                    placeholder={NOTES_PLACEHOLDER[venue.type]}
                    className="w-full resize-y rounded-card border border-paper-edge bg-paper-raised px-3 py-[11px] text-[15px] text-ink transition-[border-color,box-shadow] duration-[120ms] placeholder:text-graphite-soft/70 focus-visible:border-brass focus-visible:ring-[3px] focus-visible:ring-brass/25 focus-visible:outline-none disabled:bg-paper-dim disabled:text-graphite-soft"
                  />
                </div>

                <button
                  type="submit"
                  disabled={booking}
                  className="mb-[15px] w-full cursor-pointer rounded-card border border-transparent bg-brass px-5 py-[11px] text-[15px] font-semibold text-ink-deep transition-colors duration-[120ms] enabled:hover:bg-brass-lit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {booking ? 'Sending request…' : user ? 'Request booking' : 'Sign in to book'}
                </button>
              </form>
            )}

            {quote ? (
              <dl className="mb-3 grid grid-cols-[1fr_auto] gap-y-1 border-t border-paper-edge pt-3 text-[14px]">
                <dt className="text-graphite-soft">
                  {formatPrice(quote.rate)} × {plural(quote.hours, 'hour')}
                  {quote.onSale ? <span className="ml-2 text-[12px] text-brass-ink">sale</span> : null}
                </dt>
                <dd className="text-right">
                  {quote.onSale ? <WasPrice amount={quote.fullPrice} className="mr-2 text-graphite-soft" /> : null}
                  {formatPrice(quote.total)}
                </dd>
                <dt className="font-medium">Total</dt>
                <dd className="text-right font-serif text-[20px]">{formatPrice(quote.total)}</dd>
              </dl>
            ) : (
              <p className="mb-3 border-t border-paper-edge pt-3 text-[13px] text-graphite-soft">
                Choose a time to see the total.
              </p>
            )}
          </aside>
        </div>
      </Container>
    </>
  );
}

const stepper =
  'grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-paper-edge bg-paper-raised text-[16px] leading-none text-ink ' +
  'transition-colors duration-[120ms] enabled:hover:border-ink enabled:hover:bg-ink enabled:hover:text-cream ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:cursor-not-allowed disabled:opacity-35';
