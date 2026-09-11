import { Link } from 'react-router-dom';
import { BRAND } from '../brand';
import { KeyTag } from '../components/KeyTag';

const link =
  'inline-block min-w-[150px] rounded-card border border-brass px-[22px] py-3 ' +
  'text-[15px] font-medium no-underline transition-colors duration-[120ms] ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass';

export function Startup() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-[440px] text-center">
        <span className="mb-4 inline-flex text-brass">
          <KeyTag size={150} />
        </span>
        <h1 className="mb-3 font-serif text-[46px] leading-none font-normal tracking-[0.01em] text-cream">
          {BRAND}
        </h1>
        <p className="mb-8 text-base text-mist">Hotel rooms, booked by the night.</p>

        <nav className="flex flex-wrap justify-center gap-3" aria-label="Account">
          <Link className={`${link} text-brass-lit hover:bg-brass/15`} to="/login">
            Sign in
          </Link>
          <Link
            className={`${link} bg-brass font-semibold text-ink-deep hover:bg-brass-lit`}
            to="/signup"
          >
            Create account
          </Link>
        </nav>
      </div>
    </main>
  );
}
