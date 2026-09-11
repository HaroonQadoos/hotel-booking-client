import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useAuth } from './auth';
import { BRAND } from './brand';
import { KeyTag } from './components/KeyTag';
import { Home } from './pages/Home';
import { ForgotPassword } from './pages/ForgotPassword';
import { Login } from './pages/Login';
import { ResetPassword } from './pages/ResetPassword';
import { Signup } from './pages/Signup';
import { Startup } from './pages/Startup';

function RequireAuth({ children }: { children: ReactElement }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RedirectIfSignedIn({ children }: { children: ReactElement }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

// The card pages share a small brand header. The startup screen does not use
// this layout — its logo IS the page, so a second small one above it would
// just be clutter.
function CardLayout() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-[400px]">
        <div className="mb-[26px] flex items-center justify-center gap-[11px]">
          <span className="flex text-brass">
            <KeyTag />
          </span>
          <span className="font-serif text-[27px] tracking-[0.01em] text-cream">{BRAND}</span>
        </div>
        <Outlet />
      </div>
    </main>
  );
}

export function App() {
  return (
    <Routes>
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
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
