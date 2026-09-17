import { useEffect, useState } from 'react';
import * as api from '../api';
import type { AvailableRoom, Room } from '../api';
import { Notice } from '../components/Notice';
import { PageTitle } from '../components/PageTitle';
import { RoomCard } from '../components/RoomCard';
import { StayForm } from '../components/StayForm';
import { formatDay, plural } from '../format';
import { useStay } from '../stay';

type Rooms = Room[] | AvailableRoom[];

// The front page: pick dates, see what is free. With no dates in the URL it
// shows the catalogue, so a first visit is never an empty form.
export function Home() {
  const [stay, setStay] = useStay();
  const [rooms, setRooms] = useState<Rooms | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = stay ? api.searchAvailability(stay) : api.getRooms();
    load
      .then((result) => {
        if (cancelled) return;
        setRooms(result);
        setError('');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setRooms([]);
        setError(err instanceof api.ApiError ? err.message : 'Something went wrong. Try again.');
      });

    return () => {
      cancelled = true;
    };
    // `stay` is rebuilt from the URL on every render; its parts are stable.
  }, [stay?.checkIn, stay?.checkOut, stay?.guests]); // eslint-disable-line react-hooks/exhaustive-deps

  const summary = stay
    ? `${formatDay(stay.checkIn)} – ${formatDay(stay.checkOut)} · ${plural(stay.guests, 'guest')}`
    : 'All room types';

  return (
    <>
      <PageTitle aside={rooms ? summary : null}>Find a room</PageTitle>

      <section className="mb-8 rounded-card bg-paper px-6 pt-5 pb-1 text-ink shadow-card">
        <StayForm
          // Remount when the URL changes so a back/forward navigation
          // refills the form with the dates it lands on.
          key={`${stay?.checkIn}-${stay?.checkOut}-${stay?.guests}`}
          initial={stay}
          onSubmit={setStay}
          submitLabel="Search"
        />
      </section>

      {error ? <Notice tone="error">{error}</Notice> : null}

      {rooms === null ? (
        <p className="text-mist">Loading rooms…</p>
      ) : rooms.length === 0 && !error ? (
        <Notice>
          No room type sleeps {stay ? plural(stay.guests, 'guest') : 'that many'}. Try a smaller party.
        </Notice>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} stay={stay} />
          ))}
        </div>
      )}
    </>
  );
}
