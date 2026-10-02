import type { Venue, VenueAvailability } from './api';

type Rules = Pick<Venue, 'closingHour' | 'minHours' | 'maxHours'>;

// Whether the one-hour cell starting at `hour` is held by a booking.
export function isBooked(hour: number, booked: VenueAvailability['booked']): boolean {
  return booked.some((slot) => hour >= slot.startHour && hour < slot.endHour);
}

// The cells that may be the LAST hour of a slot starting at `start`: from
// the one that makes the shortest allowed booking to the furthest one
// reachable without crossing a taken hour, closing time or the longest
// allowed booking. `null` when even the shortest slot does not fit here.
export function lastHourRange(
  start: number,
  rules: Rules,
  isTaken: (hour: number) => boolean,
): { first: number; last: number } | null {
  let last = start;
  while (last + 1 < rules.closingHour && last + 1 < start + rules.maxHours && !isTaken(last + 1)) last += 1;
  const first = start + rules.minHours - 1;
  return first <= last ? { first, last } : null;
}
