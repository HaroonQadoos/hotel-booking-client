import type { ReactNode } from 'react';

// Line icons drawn on a 24px grid in the same 1.5 stroke as the rest of the
// site, so they sit beside the KeyTag without looking borrowed.
const icon = (path: ReactNode) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {path}
  </svg>
);

// What every room comes with, whatever its type. Written as promises the
// front desk keeps, not a list of amenities — those are per room.
const FEATURES = [
  {
    title: 'Spotless, every stay',
    body: 'Rooms are cleaned top to bottom between guests, with fresh linen and towels daily.',
    icon: icon(
      <>
        <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
        <path d="M18.5 15l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />
        <path d="M5.5 16l.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5z" />
      </>,
    ),
  },
  {
    title: 'Safe and secure',
    body: 'Keycard entry, an in-room safe and a front desk that is staffed around the clock.',
    icon: icon(
      <>
        <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" />
        <path d="M9 12l2 2 4-4" />
      </>,
    ),
  },
  {
    title: 'Made for sleep',
    body: 'Hotel-grade mattresses, blackout curtains and quiet hours from ten at night.',
    icon: icon(
      <>
        <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />
      </>,
    ),
  },
  {
    title: 'Always connected',
    body: 'Fast Wi-Fi throughout the hotel, free for every guest, with no login pages.',
    icon: icon(
      <>
        <path d="M2.5 9a14 14 0 0119 0" />
        <path d="M5.5 12.5a9.5 9.5 0 0113 0" />
        <path d="M8.7 16a5 5 0 016.6 0" />
        <circle cx="12" cy="19.2" r="0.6" fill="currentColor" />
      </>,
    ),
  },
];

// Four cards under the room: the standards the hotel keeps in every room.
export function RoomFeatures() {
  return (
    <section aria-labelledby="features-title" className="mt-16 sm:mt-20">
      <p className="mb-2 text-[12px] font-medium tracking-[0.14em] text-brass-ink uppercase">
        In every room
      </p>
      <h2 id="features-title" className="mb-8 max-w-[28ch] font-serif text-[34px] text-balance leading-[1.05] text-ink sm:text-[42px]">
        The small things, taken care of.
      </h2>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {FEATURES.map((feature) => (
          <li
            key={feature.title}
            className="group flex gap-4 rounded-[22px] border border-paper-edge bg-paper p-5 text-ink sm:block transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_24px_40px_-24px_rgba(11,22,32,0.45)] sm:p-7"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center sm:mb-6 rounded-full bg-ink-deep text-brass-lit transition-colors duration-200 group-hover:bg-brass group-hover:text-ink-deep">
              {feature.icon}
            </span>
            <div>
              <h3 className="mb-2 font-serif text-[24px] leading-tight font-normal">{feature.title}</h3>
              <p className="text-[14px] leading-relaxed text-graphite">{feature.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
