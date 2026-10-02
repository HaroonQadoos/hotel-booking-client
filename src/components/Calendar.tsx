import { useState } from 'react';
import { addDays, todayIso } from '../format';

// All dates here are "YYYY-MM-DD" strings, handled in UTC like the rest of
// the app, so a guest west of Greenwich never sees the day before.
const monthTitle = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dayLabel = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});
const weekdays = Array.from({ length: 7 }, (_, i) =>
  new Intl.DateTimeFormat(undefined, { weekday: 'narrow', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2026, 1, 1 + i)), // 1 Feb 2026 is a Sunday
  ),
);

const toDate = (iso: string) => new Date(`${iso}T00:00:00Z`);
const monthStart = (iso: string) => `${iso.slice(0, 7)}-01`;

function shiftMonth(firstOfMonth: string, by: number): string {
  const date = toDate(firstOfMonth);
  date.setUTCMonth(date.getUTCMonth() + by);
  return date.toISOString().slice(0, 10);
}

// Six rows of seven, Sunday first, padded with the neighbouring months so the
// grid never changes height as the guest pages through.
function monthGrid(firstOfMonth: string): string[] {
  const start = addDays(firstOfMonth, -toDate(firstOfMonth).getUTCDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

interface CalendarProps {
  /** The date being chosen. */
  value: string;
  onSelect: (iso: string) => void;
  /** Earliest selectable day. */
  min: string;
  /** Latest selectable day, if bookings only run so far ahead. */
  max?: string;
  /** The other end of the stay, so the nights between can be shaded. */
  rangeStart?: string;
  rangeEnd?: string;
  /** Which end of the stay this calendar picks — decides the hover preview. */
  picking: 'start' | 'end';
}

export function Calendar({ value, onSelect, min, max, rangeStart, rangeEnd, picking }: CalendarProps) {
  const [month, setMonth] = useState(() => monthStart(value || min));
  const [hovered, setHovered] = useState<string | null>(null);

  // While choosing a check-out, the shading follows the pointer so the guest
  // sees the stay they are about to pick.
  const start = rangeStart;
  const end = picking === 'end' && hovered && start && hovered > start ? hovered : rangeEnd;
  const canGoBack = month > monthStart(min);
  const canGoForward = !max || month < monthStart(max);
  // Underlined so the guest has a bearing in the grid.
  const today = todayIso();

  return (
    <div className="select-none">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, -1))}
          disabled={!canGoBack}
          aria-label="Previous month"
          className={navButton}
        >
          <Chevron direction="left" />
        </button>
        <p className="font-serif text-[24px] leading-none text-ink" aria-live="polite">
          {monthTitle.format(toDate(month))}
        </p>
        <button
          type="button"
          onClick={() => setMonth(shiftMonth(month, 1))}
          disabled={!canGoForward}
          aria-label="Next month"
          className={navButton}
        >
          <Chevron direction="right" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center" onMouseLeave={() => setHovered(null)}>
        {weekdays.map((day, i) => (
          <span key={i} className="pb-2 text-[11px] font-medium tracking-[0.12em] text-graphite-soft uppercase">
            {day}
          </span>
        ))}

        {monthGrid(month).map((iso) => {
          const outside = iso.slice(0, 7) !== month.slice(0, 7);
          const disabled = iso < min || (max !== undefined && iso > max);
          const isStart = iso === start;
          const isEnd = iso === end;
          const inRange = Boolean(start && end && iso > start && iso < end);
          const selected = isStart || isEnd;
          // The shaded band runs behind the day circles, capped at the two
          // ends of the stay and at each week's edge where it wraps.
          const band = start && end && start < end && (inRange || isStart || isEnd);

          return (
            <div
              key={iso}
              className={
                'relative flex h-11 items-center justify-center ' +
                (band ? 'bg-brass/15 ' : '') +
                (band && (isStart || toDate(iso).getUTCDay() === 0) ? 'rounded-l-full ' : '') +
                (band && (isEnd || toDate(iso).getUTCDay() === 6) ? 'rounded-r-full ' : '')
              }
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(iso)}
                onMouseEnter={() => setHovered(iso)}
                aria-label={dayLabel.format(toDate(iso))}
                aria-pressed={iso === value}
                className={
                  'grid h-10 w-10 cursor-pointer place-items-center rounded-full text-[14px] tabular-nums transition-colors duration-[120ms] ' +
                  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brass ' +
                  'disabled:cursor-not-allowed ' +
                  // The check-in day is out of range when picking a check-out,
                  // but it still shows as the start of the stay, not struck out.
                  (selected ? '' : 'disabled:text-graphite-soft/40 disabled:line-through ') +
                  (selected
                    ? 'bg-ink-deep font-semibold text-cream'
                    : outside
                      ? 'text-graphite-soft/70 enabled:hover:bg-paper-dim'
                      : 'text-ink enabled:hover:bg-ink-deep/10') +
                  (iso === today && !selected ? ' font-semibold underline decoration-brass decoration-2 underline-offset-4' : '')
                }
              >
                {Number(iso.slice(8))}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const navButton =
  'grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-paper-edge bg-paper-raised text-ink transition-colors duration-[120ms] ' +
  'enabled:hover:border-ink-deep enabled:hover:bg-ink-deep enabled:hover:text-cream disabled:cursor-default disabled:opacity-30 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass';

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={direction === 'left' ? 'M10 3.5L5.5 8l4.5 4.5' : 'M6 3.5L10.5 8 6 12.5'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
