// Presentation helpers shared by the room and booking pages.

// The hotel prices in one currency; the API stores bare numbers. Change here
// if the hotel bills in something else.
export const CURRENCY = 'USD';

const money = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number): string {
  return money.format(amount);
}

// "2026-10-03" → "Fri 3 Oct". Parsed as UTC on purpose: the API's dates are
// calendar days at UTC midnight, and a local-time parse would show the day
// before in any timezone west of Greenwich.
const day = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

export function formatDay(isoDate: string): string {
  return day.format(new Date(`${isoDate}T00:00:00Z`));
}

// Today as the "YYYY-MM-DD" the API and <input type="date"> both use, in the
// viewer's local calendar — a guest at 11pm still sees today as bookable.
export function todayIso(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(`${checkIn}T00:00:00Z`).getTime();
  const b = new Date(`${checkOut}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export const ROOM_TYPE_LABEL = { single: 'Single', double: 'Double', suite: 'Suite' } as const;

export const VENUE_TYPE_LABEL = {
  conference: 'Conference room',
  pool: 'Swimming pool',
  hall: 'Party hall',
} as const;

// Venue hours are bare integers in hotel time, shown on a 12-hour clock
// whatever the browser's locale: 9 → "9:00 AM", 13 → "1:00 PM". 24 is the
// midnight that closes the day, so it reads "12:00 AM" like 0 does.
export function formatHour(hour: number): string {
  const h = hour % 24;
  return `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`;
}

// The same clock without the ":00", for tight spots like cards: "10 AM".
export function formatHourShort(hour: number): string {
  const h = hour % 24;
  return `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`;
}

export function formatSlot(startHour: number, endHour: number): string {
  return `${formatHour(startHour)} – ${formatHour(endHour)}`;
}
