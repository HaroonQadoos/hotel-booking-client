import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useAuth } from './auth';
import { BRAND } from './brand';
import { AppLayout } from './components/AppLayout';
import { KeyTag } from './components/KeyTag';
import { Categories } from './pages/Categories';
import { Home } from './pages/Home';
import { MyBookings } from './pages/MyBookings';
import { RoomDetail } from './pages/RoomDetail';
import { ForgotPassword } from './pages/ForgotPassword';
import { Login } from './pages/Login';
import { ResetPassword } from './pages/ResetPassword';
import { Signup } from './pages/Signup';
import { Startup } from './pages/Startup';

// Auth pages make no sense to a signed-in user. `from` is where a guest was
// sent to sign in from; honouring it here as well as in Login means the page
// they wanted wins no matter which of the two redirects fires first.
function RedirectIfSignedIn({ children }: { children: ReactElement }) {
  const { user, ready } = useAuth();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/';
  if (!ready) return null;
  if (user) return <Navigate to={from} replace />;
  return children;
}

// Sends a signed-out visitor to sign in, remembering where they were so
// Login can bring them straight back.
function RequireSignedIn({ children }: { children: ReactElement }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return null;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return children;
}

// The card pages share a small brand header. The startup screen does not use
// this layout — its logo IS the page, so a second small one above it would
// just be clutter.
function CardLayout({ children }: { children?: ReactElement }) {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-[26px] flex items-center justify-center gap-[11px]">
          <span className="flex text-brass">
            <KeyTag />
          </span>
          <span className="font-serif text-[27px] tracking-[0.01em] text-cream">{BRAND}</span>
        </div>
        {children ?? <Outlet />}
      </div>
    </main>
  );
}

export function App() {
  return (
    <Routes>
      {/* Public: guests browse rooms and availability before they sign up. */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/rooms/:id" element={<RoomDetail />} />
        <Route
          path="/bookings"
          element={
            <RequireSignedIn>
              <MyBookings />
            </RequireSignedIn>
          }
        />
      </Route>

      <Route
        path="/startup"
        element={
          <RedirectIfSignedIn>
            <Startup />
          </RedirectIfSignedIn>
        }
      />

      <Route element={<CardLayout />}>
        <Route
          path="/login"
          element={
            <RedirectIfSignedIn>
              <Login />
            </RedirectIfSignedIn>
          }
        />
        <Route
          path="/signup"
          element={
            <RedirectIfSignedIn>
              <Signup />
            </RedirectIfSignedIn>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <RedirectIfSignedIn>
              <ForgotPassword />
            </RedirectIfSignedIn>
          }
        />
        {/* Not guarded: the emailed link has to work even if some other
            account happens to be signed in on this browser. */}
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
