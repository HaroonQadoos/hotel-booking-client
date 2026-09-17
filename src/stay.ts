import { useSearchParams } from 'react-router-dom';
import type { Stay } from './api';
import { nightsBetween, todayIso } from './format';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// A stay lives in the URL (?checkIn=&checkOut=&guests=) rather than in
// React state so a search can be shared, refreshed and returned to with the
// back button, and so the room page can pick up the dates the list was
// searched with. Anything malformed is treated as absent, not as an error —
// a bad link just shows the catalogue.
export function parseStayParams(params: URLSearchParams): Stay | null {
  const checkIn = params.get('checkIn') ?? '';
  const checkOut = params.get('checkOut') ?? '';
  const guests = Number(params.get('guests') ?? '1');
  if (!DATE.test(checkIn) || !DATE.test(checkOut)) return null;
  if (!Number.isInteger(guests) || guests < 1) return null;
  if (nightsBetween(checkIn, checkOut) < 1) return null;
  return { checkIn, checkOut, guests };
}

export function stayToParams(stay: Stay): URLSearchParams {
  return new URLSearchParams({
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    guests: String(stay.guests),
  });
}

export function useStay(): [Stay | null, (stay: Stay | null) => void] {
  const [params, setParams] = useSearchParams();
  const stay = parseStayParams(params);
  const setStay = (next: Stay | null) => setParams(next ? stayToParams(next) : {});
  return [stay, setStay];
}

// Mirrors the API's rules so a guest hears about a bad stay before the round
// trip. The API still has the final say.
export const MAX_STAY_NIGHTS = 30;

export interface StayErrors {
  checkIn?: string;
  checkOut?: string;
  guests?: string;
}

export function validateStay(draft: { checkIn: string; checkOut: string; guests: string }): StayErrors {
  const errors: StayErrors = {};
  const guests = Number(draft.guests);

  if (!DATE.test(draft.checkIn)) errors.checkIn = 'Choose a check-in date.';
  else if (draft.checkIn < todayIso()) errors.checkIn = 'Check-in cannot be in the past.';

  if (!DATE.test(draft.checkOut)) errors.checkOut = 'Choose a check-out date.';
  else if (!errors.checkIn) {
    const nights = nightsBetween(draft.checkIn, draft.checkOut);
    if (nights < 1) errors.checkOut = 'Check-out must be after check-in.';
    else if (nights > MAX_STAY_NIGHTS) errors.checkOut = `Stays are limited to ${MAX_STAY_NIGHTS} nights.`;
  }

  if (!Number.isInteger(guests) || guests < 1) errors.guests = 'At least one guest.';

  return errors;
}
