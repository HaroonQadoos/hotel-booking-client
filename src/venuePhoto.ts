import type { Venue } from './api';

// Like rooms, venues may not have photos yet. There is no stock shot of a
// pool or a hall in the bundle, so until one is uploaded a venue borrows the
// hotel's own hero photo rather than showing an empty frame.
export function venuePhoto(venue: Venue): string {
  return venue.images.length > 0 ? venue.images[0] : '/hero.jpg';
}
