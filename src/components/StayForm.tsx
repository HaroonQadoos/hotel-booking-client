import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Stay } from '../api';
import { addDays, formatDay, todayIso } from '../format';
import { validateStay } from '../stay';
import type { StayErrors } from '../stay';
import { Calendar } from './Calendar';
import { Field } from './Field';

interface StayFormProps {
  initial: Stay | null;
  onSubmit: (stay: Stay) => void;
  submitLabel: string;
  /** Guests above this get an error before the API is asked. */
  maxGuests?: number;
  disabled?: boolean;
  /**
   * `pill` for the rounded search bar on the home page, `row` for a plain
   * full-width bar, `stack` for a narrow booking panel.
   */
  layout?: 'pill' | 'row' | 'stack';
}

// Check-in, check-out and guests, in a row. Used both to search the list and,
// with a room's capacity, to book that room — the same three answers.
export function StayForm({
  initial,
  onSubmit,
  submitLabel,
  maxGuests,
  disabled,
  layout = 'row',
}: StayFormProps) {
  const [checkIn, setCheckIn] = useState(initial?.checkIn ?? '');
  const [checkOut, setCheckOut] = useState(initial?.checkOut ?? '');
  const [guests, setGuests] = useState(String(initial?.guests ?? 1));
  const [errors, setErrors] = useState<StayErrors>({});
  // Pill layout only: which date's calendar is open.
  const [openField, setOpenField] = useState<'checkIn' | 'checkOut' | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // A click anywhere outside the form, or Escape, closes the calendar.
  useEffect(() => {
    if (!openField) return;
    const onPointer = (event: PointerEvent) => {
      if (!formRef.current?.contains(event.target as Node)) setOpenField(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenField(null);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [openField]);

  const today = todayIso();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validateStay({ checkIn, checkOut, guests });
    if (maxGuests !== undefined && !found.guests && Number(guests) > maxGuests) {
      found.guests = `This room sleeps at most ${maxGuests}.`;
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSubmit({ checkIn, checkOut, guests: Number(guests) });
  }

  // Picking a check-in after the current check-out would only earn an error,
  // so the check-out is nudged to the next night instead.
  function handleCheckIn(value: string) {
    setCheckIn(value);
    if (value && (!checkOut || checkOut <= value)) setCheckOut(addDays(value, 1));
  }

  if (layout === 'pill') {
    const guestCount = Number(guests) || 1;
    const setGuestCount = (n: number) => setGuests(String(Math.max(1, maxGuests ? Math.min(maxGuests, n) : n)));
    const messages = [errors.checkIn, errors.checkOut, errors.guests].filter(Boolean);

    return (
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-1 rounded-[28px] border border-paper-edge bg-paper-raised p-2 text-ink shadow-[0_28px_60px_-28px_rgba(4,10,16,0.55)] md:flex-row md:items-center md:gap-0 md:rounded-full">
          <DateSegment
            id="checkIn"
            label="Check-in"
            value={checkIn}
            min={today}
            invalid={Boolean(errors.checkIn)}
            disabled={disabled}
            open={openField === 'checkIn'}
            onToggle={() => setOpenField(openField === 'checkIn' ? null : 'checkIn')}
            // Choosing the arrival moves straight on to the departure.
            onSelect={(iso) => {
              handleCheckIn(iso);
              setOpenField('checkOut');
            }}
            rangeStart={checkIn}
            rangeEnd={checkOut}
            picking="start"
          />
          <Divider />
          <DateSegment
            id="checkOut"
            label="Check-out"
            value={checkOut}
            min={checkIn ? addDays(checkIn, 1) : addDays(today, 1)}
            invalid={Boolean(errors.checkOut)}
            disabled={disabled}
            open={openField === 'checkOut'}
            onToggle={() => setOpenField(openField === 'checkOut' ? null : 'checkOut')}
            onSelect={(iso) => {
              setCheckOut(iso);
              setOpenField(null);
            }}
            rangeStart={checkIn}
            rangeEnd={checkOut}
            picking="end"
          />
          <Divider />

          <div
            className={`${segment} ${errors.guests ? 'bg-rust/5' : ''} md:max-w-[240px]`}
            role="group"
            aria-labelledby="guests-label"
          >
            <span className={segmentIcon}>
              <GuestIcon />
            </span>
            <span className="min-w-0 flex-1">
              <span id="guests-label" className={segmentLabel}>
                Guests
              </span>
              <output htmlFor="guests" aria-live="polite" className={segmentValue}>
                {guestCount} {guestCount === 1 ? 'guest' : 'guests'}
              </output>
            </span>
            <span className="flex items-center gap-1">
              <button
                type="button"
                className={stepper}
                onClick={() => setGuestCount(guestCount - 1)}
                disabled={disabled || guestCount <= 1}
                aria-label="Fewer guests"
              >
                −
              </button>
              <button
                type="button"
                className={stepper}
                onClick={() => setGuestCount(guestCount + 1)}
                disabled={disabled || (maxGuests !== undefined && guestCount >= maxGuests)}
                aria-label="More guests"
              >
                +
              </button>
            </span>
          </div>

          <button
            type="submit"
            disabled={disabled}
            className="mt-1 flex h-14 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-ink-deep px-7 text-[15px] font-medium text-cream transition-colors duration-[120ms] enabled:hover:bg-brass enabled:hover:text-ink-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:cursor-not-allowed disabled:opacity-55 md:mt-0 md:ml-2"
          >
            <SearchIcon />
            {submitLabel}
          </button>
        </div>

        {messages.length > 0 ? (
          <p role="alert" className="mt-3 px-6 text-[13px] text-rust">
            {messages.join(' ')}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={
        layout === 'row'
          ? 'grid grid-cols-1 gap-x-4 sm:grid-cols-[1fr_1fr_110px_auto] sm:items-start'
          : 'grid grid-cols-2 gap-x-3 [&>*:nth-child(3)]:col-span-2 [&>*:nth-child(4)]:col-span-2'
      }
    >
      <Field
        id="checkIn"
        label="Check-in"
        type="date"
        value={checkIn}
        onChange={handleCheckIn}
        error={errors.checkIn}
        disabled={disabled}
        min={today}
      />
      <Field
        id="checkOut"
        label="Check-out"
        type="date"
        value={checkOut}
        onChange={setCheckOut}
        error={errors.checkOut}
        disabled={disabled}
        min={checkIn ? addDays(checkIn, 1) : addDays(today, 1)}
      />
      <Field
        id="guests"
        label="Guests"
        type="number"
        value={guests}
        onChange={setGuests}
        error={errors.guests}
        disabled={disabled}
        min={1}
        max={maxGuests}
      />
      <button
        type="submit"
        disabled={disabled}
        className={`mb-[15px] cursor-pointer rounded-card ${layout === 'row' ? 'self-end' : 'w-full'}  border border-transparent bg-brass px-5 py-[11px] text-[15px] font-semibold text-ink-deep transition-colors duration-[120ms] enabled:hover:bg-brass-lit focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:cursor-not-allowed disabled:opacity-55`}
      >
        {submitLabel}
      </button>
    </form>
  );
}

// Pill layout pieces. Each segment is a whole click target; the thin rules
// between them turn horizontal on phones, where the pill becomes a card.
const segment =
  'relative flex min-w-0 flex-1 items-center gap-3 rounded-full px-5 py-3 transition-colors duration-[120ms] ' +
  'hover:bg-paper-dim focus-within:bg-paper-dim';
const segmentIcon = 'grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-deep text-brass-lit';
const segmentLabel = 'block text-[11px] font-medium tracking-[0.12em] text-graphite-soft uppercase';
const segmentValue = 'block truncate text-[15px] font-medium text-ink';
const stepper =
  'relative z-10 grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-paper-edge bg-paper-raised text-[16px] leading-none text-ink ' +
  'transition-colors duration-[120ms] enabled:hover:border-ink enabled:hover:bg-ink enabled:hover:text-cream ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:cursor-not-allowed disabled:opacity-35';

function Divider() {
  return <span aria-hidden="true" className="mx-5 h-px bg-paper-edge md:mx-0 md:h-9 md:w-px" />;
}

// A date in the pill: the whole segment is a button showing the friendly
// "Thu, Oct 1", and it opens a calendar card directly beneath it, at least as
// wide as the segment itself.
function DateSegment({
  id,
  label,
  value,
  min,
  invalid,
  disabled,
  open,
  onToggle,
  onSelect,
  rangeStart,
  rangeEnd,
  picking,
}: {
  id: string;
  label: string;
  value: string;
  min: string;
  invalid: boolean;
  disabled?: boolean;
  open: boolean;
  onToggle: () => void;
  onSelect: (iso: string) => void;
  rangeStart: string;
  rangeEnd: string;
  picking: 'start' | 'end';
}) {
  return (
    <div className={`${segment} ${open ? 'bg-paper-dim' : invalid ? 'bg-rust/5' : ''}`}>
      <span className={segmentIcon}>
        <CalendarIcon />
      </span>
      <span className="min-w-0 flex-1">
        <span id={`${id}-label`} className={segmentLabel}>
          {label}
        </span>
        <span className={`${segmentValue} ${value ? '' : 'text-graphite-soft!'}`}>
          {value ? formatDay(value) : 'Add date'}
        </span>
      </span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className={`shrink-0 text-graphite-soft transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      >
        <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Stretched over the segment, so a click anywhere on it counts. */}
      <button
        type="button"
        id={id}
        onClick={onToggle}
        disabled={disabled}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-value`}
        aria-expanded={open}
        aria-controls={`${id}-calendar`}
        aria-invalid={invalid || undefined}
        className="absolute inset-0 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass disabled:cursor-not-allowed"
      >
        <span id={`${id}-value`} className="sr-only">
          {value ? formatDay(value) : 'No date chosen'}
        </span>
      </button>

      {open ? (
        <div
          id={`${id}-calendar`}
          role="dialog"
          aria-label={`Choose ${label.toLowerCase()} date`}
          className="absolute top-[calc(100%+14px)] left-0 z-30 w-full min-w-[320px] rounded-[26px] border border-paper-edge bg-paper-raised p-5 shadow-[0_32px_70px_-24px_rgba(4,10,16,0.55)] sm:min-w-[360px] sm:p-6"
        >
          <Calendar
            value={value}
            min={min}
            onSelect={onSelect}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            picking={picking}
          />
          <p className="mt-4 border-t border-paper-edge pt-3 text-[13px] text-graphite-soft">
            {picking === 'start' ? 'Pick the night you arrive.' : 'Pick the morning you leave.'}
          </p>
        </div>
      ) : null}
    </div>
  );
}

const svgProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

function CalendarIcon() {
  return (
    <svg {...svgProps}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

function GuestIcon() {
  return (
    <svg {...svgProps}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3 19.5c.7-3.3 3.1-5 6-5s5.3 1.7 6 5" />
      <path d="M16 5.2a3.2 3.2 0 010 6M18 14.8c1.6.6 2.7 2.2 3 4.7" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg {...svgProps}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </svg>
  );
}
