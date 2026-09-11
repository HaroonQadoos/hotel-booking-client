# hotel-booking-client

React frontend for the [hotel-booking-app](../hotel-booking-app) NestJS API —
signup, login, and a signed-in page that reads the current user back from the
server.

Vite · React 19 · TypeScript · React Router 7 · Tailwind CSS 4. The palette,
type and radius tokens live in `@theme` in `src/styles.css`; components carry
their own utility classes.

## Running it

The API and this app are separate projects and run separately. Start the API
first — this app is useless without it.

```bash
# in the API project
npm run start:dev

# here
cp .env.example .env     # set VITE_API_PROXY_TARGET if the API is not on :3000
npm install
npm run dev              # http://localhost:5173
```

## How it reaches the API

In development, requests go to the same-origin path `/api`, and Vite proxies
them to the API (`vite.config.ts`). Nothing is cross-origin, so the API needs
no CORS configuration and the session cookie is forwarded untouched.

Point `VITE_API_PROXY_TARGET` at wherever the API is actually listening. If you
run the API on a port other than 3000, this is the one thing you must change.

**For password reset to work**, the API must know where this app lives — the
emailed link is built from its `FRONTEND_URL`. Set that in the *API's* `.env`:

```
FRONTEND_URL=http://localhost:5173
```

It defaults to `http://localhost:3000`, which would send guests to the wrong
port. In development the API sends mail through a throwaway Ethereal inbox and
logs a preview URL to its console instead of delivering anything — open that
URL to see the email and its link.

## The session

The API returns the JWT as an **httpOnly cookie**, never in a response body.
Three consequences shape this code:

- There is no token anywhere in `src/`. Nothing is kept in `localStorage`.
- "Am I signed in?" is a question only the API can answer, so `AuthProvider`
  asks `GET /users/me` on load: 200 means signed in, 401 means not.
- Signing out calls `POST /auth/logout`, because JavaScript cannot delete an
  httpOnly cookie — only the server that set it can clear it.

Every request sends `credentials: 'include'`, without which the browser would
not attach the cookie at all.

## Deploying to a different origin than the API

The dev proxy keeps everything same-origin. A real deployment that serves this
app from a different origin than the API needs, on the API side:

```ts
app.enableCors({ origin: 'https://your-frontend', credentials: true });
```

and the session cookie marked `SameSite=None; Secure`. Note that this gives up
the CSRF protection `SameSite=Lax` currently provides, so add CSRF tokens on
state-changing routes before doing it.

Serving this app's built `dist/` from the API's own origin avoids all of the
above, and is the simpler option if you have the choice.

## Layout

```
src/
  api.ts               fetch wrapper, typed calls, error mapping
  auth.tsx             AuthProvider — session state
  App.tsx              routes and guards; BRAND constant lives here
  pages/Signup.tsx     POST /auth/register
  pages/Login.tsx      POST /auth/login
  pages/ForgotPassword.tsx  POST /auth/forgot-password
  pages/ResetPassword.tsx   POST /auth/reset-password — target of the emailed link
  pages/Home.tsx       GET  /users/me
  components/Field.tsx label + input + error, aria wired
  components/Button.tsx primary / ghost
  components/Card.tsx  the ivory card and its title/switch line
  components/FormError.tsx
  components/KeyTag.tsx
  styles.css           Tailwind import + @theme tokens + body defaults
```

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Dev server on :5173 with the API proxy |
| `npm run build` | Typecheck, then build to `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
