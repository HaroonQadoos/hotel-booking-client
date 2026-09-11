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
const SERVER_FIELDS = ['name', 'email', 'password', 'newPassword', 'token'] as const;
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
  method?: 'GET' | 'POST';
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
