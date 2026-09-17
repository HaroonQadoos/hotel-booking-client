import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Stay } from '../api';
import { addDays, todayIso } from '../format';
import { validateStay } from '../stay';
import type { StayErrors } from '../stay';
import { Field } from './Field';

interface StayFormProps {
  initial: Stay | null;
  onSubmit: (stay: Stay) => void;
  submitLabel: string;
  /** Guests above this get an error before the API is asked. */
  maxGuests?: number;
  disabled?: boolean;
  /** `row` for a full-width search bar; `stack` for a narrow booking panel. */
  layout?: 'row' | 'stack';
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
