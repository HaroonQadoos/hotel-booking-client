import { formatHour } from '../format';

interface SlotPickerProps {
  openingHour: number;
  closingHour: number;
  /** Hours that cannot be chosen: held by someone else, or already gone today. */
  isTaken: (hour: number) => boolean;
  start: number | null;
  /** Exclusive, like the API: start 14, end 17 is 2 PM to 5 PM. */
  end: number | null;
  /** While a start is picked: the cells that may be its last hour. */
  lastHours: { first: number; last: number } | null;
  onPick: (hour: number) => void;
  disabled?: boolean;
}

// The day as a grid of one-hour cells from opening to closing. A guest taps
// where they want to start, then the last hour they need; booked hours are
// struck out and cannot be picked. Once a start is picked, the cells that
// could end the slot are tinted brass; any other tap starts over from there.
export function SlotPicker({
  openingHour,
  closingHour,
  isTaken,
  start,
  end,
  lastHours,
  onPick,
  disabled,
}: SlotPickerProps) {
  const hours = Array.from({ length: closingHour - openingHour }, (_, i) => openingHour + i);

  return (
    <div>
      <ul className="grid grid-cols-4 gap-[6px]" aria-label="Start and end time">
        {hours.map((hour) => {
          const taken = isTaken(hour);
          const selected = start !== null && end !== null && hour >= start && hour < end;
          const canEndHere = lastHours !== null && hour >= lastHours.first && hour <= lastHours.last;

          return (
            <li key={hour}>
              <button
                type="button"
                disabled={disabled || taken}
                onClick={() => onPick(hour)}
                aria-pressed={selected}
                aria-label={`${formatHour(hour)} to ${formatHour(hour + 1)}${taken ? ', unavailable' : ''}`}
                className={
                  'h-10 w-full cursor-pointer rounded-card border text-[13px] tabular-nums transition-colors duration-[120ms] ' +
                  'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brass disabled:cursor-not-allowed ' +
                  (taken
                    ? 'border-paper-edge bg-paper-dim text-graphite-soft/50 line-through'
                    : selected
                      ? 'border-ink-deep bg-ink-deep font-semibold text-cream'
                      : canEndHere
                        ? 'border-brass/60 bg-brass/10 text-ink enabled:hover:bg-brass/25'
                        : 'border-paper-edge bg-paper-raised text-ink enabled:hover:border-ink-deep')
                }
              >
                {formatHour(hour)}
              </button>
            </li>
          );
        })}
      </ul>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-graphite-soft" aria-hidden="true">
        <li className="flex items-center gap-[6px]">
          <span className="h-3 w-3 rounded-[2px] border border-paper-edge bg-paper-raised" /> Free
        </li>
        <li className="flex items-center gap-[6px]">
          <span className="h-3 w-3 rounded-[2px] bg-ink-deep" /> Your time
        </li>
        <li className="flex items-center gap-[6px]">
          <span className="h-3 w-3 rounded-[2px] border border-paper-edge bg-paper-dim" /> Booked
        </li>
      </ul>
    </div>
  );
}
