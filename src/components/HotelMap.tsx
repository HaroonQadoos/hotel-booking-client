import { useEffect, useState } from 'react';
import * as api from '../api';
import type { HotelLocation } from '../api';
import { RichText } from './RichText';

// OpenStreetMap's embed takes a bounding box, not a zoom, so the zoom staff
// chose is turned into the box a frame about 1200×520px would show at it.
function embedUrl({ latitude, longitude, zoom }: HotelLocation): string {
  const degreesPerPixel = 360 / (256 * 2 ** zoom);
  const lonHalf = 600 * degreesPerPixel;
  const latHalf = 260 * degreesPerPixel * Math.cos((latitude * Math.PI) / 180);
  const bbox = [longitude - lonHalf, latitude - latHalf, longitude + lonHalf, latitude + latHalf]
    .map((n) => n.toFixed(6))
    .join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
}

function directionsUrl({ latitude, longitude }: HotelLocation): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

// Where the hotel is, as staff set it in the dashboard: a wide map with the
// pin, and their note on getting here below it. Like VenueTeaser, it shows
// nothing until there is something to show.
export function HotelMap() {
  const [location, setLocation] = useState<HotelLocation | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getLocation()
      .then((result) => {
        if (!cancelled) setLocation(result);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!location) return null;

  return (
    <section aria-labelledby="location-title" className="pt-20 lg:pt-28">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-3 text-[12px] font-medium tracking-[0.14em] text-brass-ink uppercase">Getting here</p>
          <h2
            id="location-title"
            className="mb-4 max-w-[16ch] font-serif text-[40px] leading-[1.02] font-normal text-balance text-ink sm:text-[52px]"
          >
            Find us.
          </h2>
          {location.address ? (
            <p className="max-w-[44ch] text-[15px] leading-relaxed text-graphite">{location.address}</p>
          ) : null}
        </div>
        <a
          href={directionsUrl(location)}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex w-fit items-center gap-3 rounded-full bg-ink-deep py-2 pr-2 pl-6 text-[15px] font-medium text-cream no-underline transition-colors duration-[120ms] hover:bg-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          Get directions
          <span className="grid h-10 w-10 place-items-center rounded-full bg-brass text-ink-deep">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3 9h12M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </a>
      </div>

      <div className="aspect-[4/3] w-full overflow-hidden rounded-[22px] border border-ink/10 bg-ink-deep/5 sm:aspect-[21/9]">
        <iframe
          // Keyed so a changed pin reloads the frame rather than keeping the old view.
          key={embedUrl(location)}
          src={embedUrl(location)}
          title={location.address ? `Map showing ${location.address}` : 'Map showing the hotel'}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full border-0"
        />
      </div>

      {location.description ? (
        <RichText
          value={location.description}
          className="mt-8 max-w-[60ch] font-serif text-[20px] leading-[1.5] text-ink sm:text-[22px]"
        />
      ) : null}
    </section>
  );
}
