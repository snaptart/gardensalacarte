// Learn more https://docs.expo.dev/versions/v57.0.0/config/metro/
const { getDefaultConfig } = require('expo/metro-config');

// Rebuild the photo list whenever assets/photos changes (scripts/watch-photos.mjs). The
// environment flag keeps it to one watcher if this file is loaded again, e.g. by a worker.
if (!process.env.TRIP_MAP_PHOTO_WATCH) {
  process.env.TRIP_MAP_PHOTO_WATCH = '1';
  import('./scripts/watch-photos.mjs')
    .then(({ watchPhotos }) => watchPhotos())
    .catch((e) => console.warn(`[photos] watcher not started: ${e.message}`));
}

module.exports = getDefaultConfig(__dirname);
