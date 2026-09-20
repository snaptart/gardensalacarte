import type { ImageSourcePropType } from 'react-native';

import { PHOTOS_BY_STATION, THUMBNAIL_BY_STATION, type GeneratedPhoto } from './photos.generated';

/**
 * A photograph with the title and caption written into the file itself (IPTC Object Name and
 * Image Description). Both are optional: a photograph without them simply shows neither.
 */
export type Photograph = GeneratedPhoto;

/**
 * Photographs for a station, in the order set on the arrange page (`npm run arrange`),
 * otherwise oldest first.
 *
 * Put a station's pictures in its folder under `assets/photos/` (`folder` in places.ts).
 * `npm run photos` rebuilds the list, and also runs before `npm start` / `npm run web`.
 */
export const photosFor = (stationId: string): Photograph[] => PHOTOS_BY_STATION[stationId] ?? [];

/**
 * The photograph chosen as the station's thumbnail on the arrange page (else its first), as
 * its small copy.
 */
export const thumbnailFor = (stationId: string): ImageSourcePropType | undefined =>
  THUMBNAIL_BY_STATION[stationId] ?? photosFor(stationId)[0]?.thumb;
