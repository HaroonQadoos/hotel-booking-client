import type { Room, Stay, Venue } from './api';
import { addDays, nightsBetween } from './format';

// Rooms and venues carry the same three sale fields.
type Discounted = Pick<Room, 'discountPercent' | 'discountStartsAt' | 'discountEndsAt'>;

// The window bounds may arrive as "YYYY-MM-DD" or as a full timestamp at UTC
// midnight; only the calendar day matters either way.
const day = (value: string) => value.slice(0, 10);

// Mirrors the API's rule: a sale covers a day when it has a percentage and
// the day sits inside the window, both ends inclusive, a missing end open.
// `discountActive` answers this for today only; a stay or a venue date in
// the future needs it asked for that day.
export function onSaleOn(item: Discounted, isoDate: string): boolean {
  if (item.discountPercent <= 0) return false;
  if (item.discountStartsAt && isoDate < day(item.discountStartsAt)) return false;
  if (item.discountEndsAt && isoDate > day(item.discountEndsAt)) return false;
  return true;
}

// Rounded to cents, the same way the API rounds the effective price.
export function salePrice(price: number, percent: number): number {
  return Math.round(price * (1 - percent / 100) * 100) / 100;
}

export interface QuoteLine {
  rate: number;
  nights: number;
  onSale: boolean;
}

export interface StayQuote {
  /** Consecutive nights at the same rate, so a stay half in a sale reads as two lines. */
  lines: QuoteLine[];
  total: number;
  /** True when the total is the API's own figure rather than worked out here. */
  exact: boolean;
}

// Each night is priced on its own, as the API does, so a stay that runs into
// or out of a sale is only discounted for the nights inside it. When the
// availability search has already priced the stay, pass its `totalPrice` and
// that total wins; the lines are still worked out here, only to explain it.
export function quoteStay(room: Room, stay: Stay, pricedTotal?: number): StayQuote {
  const lines: QuoteLine[] = [];
  let total = 0;

  for (let i = 0; i < nightsBetween(stay.checkIn, stay.checkOut); i++) {
    const onSale = onSaleOn(room, addDays(stay.checkIn, i));
    const rate = onSale ? salePrice(room.pricePerNight, room.discountPercent) : room.pricePerNight;
    total += rate;
    const last = lines[lines.length - 1];
    if (last && last.rate === rate) last.nights += 1;
    else lines.push({ rate, nights: 1, onSale });
  }

  return pricedTotal !== undefined ? { lines, total: pricedTotal, exact: true } : { lines, total, exact: false };
}

export interface VenueQuote {
  rate: number;
  hours: number;
  /** What the slot would cost without the sale; equal to `total` when there is none. */
  fullPrice: number;
  total: number;
  onSale: boolean;
}

// A venue booking is discounted as a whole when its date is in the window.
export function quoteVenue(venue: Venue, isoDate: string, hours: number): VenueQuote {
  const onSale = onSaleOn(venue, isoDate);
  const rate = onSale ? salePrice(venue.pricePerHour, venue.discountPercent) : venue.pricePerHour;
  return { rate, hours, fullPrice: venue.pricePerHour * hours, total: rate * hours, onSale };
}
