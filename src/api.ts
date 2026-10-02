// Same-origin by default: vite.config.ts proxies /api to the Nest server, so
// the browser never makes a cross-origin request in dev. Point VITE_API_URL at
// an absolute URL only when the built app is served from another origin.
const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';

export type Role = 'user' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

// The token is deliberately absent: it arrives as an httpOnly cookie that the
// browser stores and this code can never read. That is what makes an XSS on
// the page unable to walk off with the session.
export interface Session {
  user: AuthUser;
}

export interface Profile extends AuthUser {
  createdAt: string;
}

// The fields the API actually validates. Used to map class-validator messages
// back onto the inputs that caused them.
const SERVER_FIELDS = [
  'name',
  'email',
  'password',
  'newPassword',
  'token',
  'room',
  'checkIn',
  'checkOut',
  'guests',
  'venue',
  'date',
  'startHour',
  'endHour',
  'notes',
] as const;
export type ServerField = (typeof SERVER_FIELDS)[number];
export type FieldErrors = Partial<Record<ServerField, string>>;

export class ApiError extends Error {
  status: number;
  fieldErrors: FieldErrors;

  constructor(message: string, status: number, fieldErrors: FieldErrors = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function sentence(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1) + (text.endsWith('.') ? '' : '.');
}

// Nest sends `message` as a string for thrown exceptions (401, 409) and as an
// array of strings from the global ValidationPipe. Both land on the same key,
// so both shapes have to be handled here rather than at each call site.
function toApiError(body: unknown, status: number): ApiError {
  const raw = (body as { message?: unknown } | null)?.message;

  if (Array.isArray(raw)) {
    const fieldErrors: FieldErrors = {};
    const unmatched: string[] = [];

    for (const entry of raw) {
      if (typeof entry !== 'string') continue;
      // class-validator prefixes every message with the property name.
      const field = entry.split(' ')[0] as ServerField;
      if (SERVER_FIELDS.includes(field)) {
        if (!fieldErrors[field]) fieldErrors[field] = sentence(entry);
      } else {
        unmatched.push(entry);
      }
    }

    const summary = unmatched.length
      ? sentence(unmatched[0])
      : 'Check the highlighted fields and try again.';
    return new ApiError(summary, status, fieldErrors);
  }

  if (typeof raw === 'string') return new ApiError(sentence(raw), status);
  return new ApiError(`The server returned an error (${status}).`, status);
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      // The session cookie is httpOnly, so this code cannot attach it by hand
      // — the browser must be told to send it. Without this every request
      // reaches the API anonymous.
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // status 0 distinguishes "never reached the server" from any HTTP reply.
    throw new ApiError('Cannot reach the server. Start the API, then try again.', 0);
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) throw toApiError(data, response.status);
  return data as T;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

// The body is rebuilt field by field on purpose. The API runs its
// ValidationPipe with forbidNonWhitelisted, so passing the signup form's
// object straight through would send `confirmPassword` and get a 400.
export function register(input: RegisterInput): Promise<Session> {
  return request<Session>('/auth/register', {
    method: 'POST',
    body: { name: input.name, email: input.email, password: input.password },
  });
}

export function login(email: string, password: string): Promise<Session> {
  return request<Session>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

// Signing out has to be a server round trip: an httpOnly cookie cannot be
// deleted from JavaScript, so only the server that set it can clear it.
export function logout(): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/logout', { method: 'POST' });
}

export function getProfile(): Promise<Profile> {
  return request<Profile>('/users/me');
}

// Always 200 with the same message, whether or not the address exists — the
// API refuses to be an oracle for which emails have accounts, and this UI
// must not undo that by wording the two cases differently.
export function forgotPassword(email: string): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });
}

// 401 covers forged, expired and already-used tokens alike; the API does not
// distinguish them and neither should the message shown here.
export function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: { token, newPassword },
  });
}

// ---------------------------------------------------------------------------
// Rooms and bookings

export type RoomType = 'single' | 'double' | 'suite';

export interface Room {
  id: string;
  name: string;
  description: string;
  type: RoomType;
  pricePerNight: number;
  capacity: number;
  totalUnits: number;
  amenities: string[];
  images: string[];
  isActive: boolean;
  /** 0–90; 0 means no sale. The window bounds are inclusive, null = open. */
  discountPercent: number;
  discountStartsAt: string | null;
  discountEndsAt: string | null;
  /** Worked out by the API against today, so the client never guesses. */
  discountActive: boolean;
  effectivePricePerNight: number;
}

// A room plus how many units are free for a specific stay. 0 is "sold out",
// and the API includes those on purpose so the page can say so. `totalPrice`
// is the API's price for the whole stay, sale nights included — optional
// because an older server does not send it.
export interface AvailableRoom extends Room {
  availableUnits: number;
  totalPrice?: number;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Booking {
  id: string;
  user: string;
  room: { id: string; name?: string; type?: RoomType };
  /** "YYYY-MM-DD" — a calendar date, not a timestamp. */
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
}

// The dates a search or booking is for. Kept as the "YYYY-MM-DD" strings the
// API speaks; the page never needs a Date object for them.
export interface Stay {
  checkIn: string;
  checkOut: string;
  guests: number;
}

function stayQuery(stay: Stay): string {
  return new URLSearchParams({
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    guests: String(stay.guests),
  }).toString();
}

// The catalogue: what the hotel sells, with no dates in play.
export function getRooms(guests?: number): Promise<Room[]> {
  const query = guests ? `?guests=${guests}` : '';
  return request<Room[]>(`/rooms${query}`);
}

export function getRoom(id: string): Promise<Room> {
  return request<Room>(`/rooms/${encodeURIComponent(id)}`);
}

// The same catalogue for a specific stay, each room with its free units.
export function searchAvailability(stay: Stay): Promise<AvailableRoom[]> {
  return request<AvailableRoom[]>(`/availability?${stayQuery(stay)}`);
}

export function createBooking(roomId: string, stay: Stay): Promise<Booking> {
  return request<Booking>('/bookings', {
    method: 'POST',
    body: { room: roomId, ...stay },
  });
}

export function getMyBookings(): Promise<Booking[]> {
  return request<Booking[]>('/bookings/me');
}

export function cancelBooking(id: string): Promise<Booking> {
  return request<Booking>(`/bookings/${encodeURIComponent(id)}/cancel`, {
    method: 'PATCH',
  });
}

// ---------------------------------------------------------------------------
// Venues and venue bookings: spaces booked by the hour rather than the night.

export type VenueType = 'conference' | 'pool' | 'hall';

export interface Venue {
  id: string;
  name: string;
  description: string;
  type: VenueType;
  pricePerHour: number;
  capacity: number;
  /** Whole hours, hotel time. A slot is [startHour, endHour). */
  openingHour: number;
  closingHour: number;
  minHours: number;
  maxHours: number;
  amenities: string[];
  images: string[];
  isActive: boolean;
  discountPercent: number;
  discountStartsAt: string | null;
  discountEndsAt: string | null;
  discountActive: boolean;
  effectivePricePerHour: number;
}

// Which hours of one day are already held. No guest details: the slots are
// all a stranger needs to see.
export interface VenueAvailability {
  date: string;
  openingHour: number;
  closingHour: number;
  booked: { startHour: number; endHour: number }[];
}

export interface VenueBooking {
  id: string;
  user: string;
  venue: { id: string; name?: string; type?: VenueType };
  /** "YYYY-MM-DD", like a room's check-in. */
  date: string;
  startHour: number;
  endHour: number;
  hours: number;
  guests: number;
  notes?: string;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
}

export interface VenueBookingInput {
  date: string;
  startHour: number;
  endHour: number;
  guests: number;
  notes?: string;
}

export function getVenues(type?: VenueType): Promise<Venue[]> {
  const query = type ? `?type=${type}` : '';
  return request<Venue[]>(`/venues${query}`);
}

export function getVenue(id: string): Promise<Venue> {
  return request<Venue>(`/venues/${encodeURIComponent(id)}`);
}

export function getVenueAvailability(id: string, date: string): Promise<VenueAvailability> {
  return request<VenueAvailability>(
    `/venues/${encodeURIComponent(id)}/availability?${new URLSearchParams({ date })}`,
  );
}

// Notes are left off entirely when blank rather than sent as "".
export function createVenueBooking(venueId: string, input: VenueBookingInput): Promise<VenueBooking> {
  const { notes, ...rest } = input;
  return request<VenueBooking>('/venue-bookings', {
    method: 'POST',
    body: { venue: venueId, ...rest, ...(notes ? { notes } : {}) },
  });
}

export function getMyVenueBookings(): Promise<VenueBooking[]> {
  return request<VenueBooking[]>('/venue-bookings/me');
}

export function cancelVenueBooking(id: string): Promise<VenueBooking> {
  return request<VenueBooking>(`/venue-bookings/${encodeURIComponent(id)}/cancel`, {
    method: 'PATCH',
  });
}
