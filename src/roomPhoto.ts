import type { Room } from './api';

// The API has no photos yet, so each room falls back to a stock shot of its
// kind. A room that does carry images uses its own first one instead.
export function roomPhoto(room: Room): string {
  if (room.images.length > 0) return room.images[0];
  if (room.type === 'single') return '/rooms/single.jpg';
  if (room.type === 'suite') return '/rooms/suite.jpg';
  return room.capacity >= 4 ? '/rooms/family.jpg' : '/rooms/double.jpg';
}
