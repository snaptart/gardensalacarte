// Keeps src/data/photos.generated.ts up to date while the dev server runs: rebuilds it
// whenever something changes in assets/photos (or a station's folder in places.ts), so
// adding, moving or deleting a photograph never leaves the app pointing at a missing file.
//
// Started from metro.config.js, so it runs however the server is launched
// (`npm run web`, `npx expo start --web`, ...).
import { watch } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { PHOTO_DIR } from './photo-library.mjs';

const PLACES = fileURLToPath(new URL('../src/data/places.ts', import.meta.url));
const LIBRARY = new URL('./photo-library.mjs', import.meta.url);

/**
 * A fresh copy of the library for every rebuild. A dev server left running would otherwise
 * keep the version it imported at startup and go on writing the old photos.generated.ts
 * format after the library is changed.
 */
const library = () => import(`${LIBRARY.href}?v=${Date.now()}`);
const IGNORE = /(^|[\\/])(README\.md|\.DS_Store|Thumbs\.db|desktop\.ini)$|~$|\.tmp$/i;

export function watchPhotos({ maxKm = 75, delayMs = 600 } = {}) {
  let timer;
  let running = false;
  let again = false;

  async function rebuild(reason) {
    if (running) {
      again = true;
      return;
    }
    running = true;
    try {
      const { collectPhotos, writeGenerated } = await library();
      const { stations, unplaced, convert } = await collectPhotos({ maxKm });
      const { changed, cache } = await writeGenerated(stations);
      if (reason && changed) {
        const total = stations.reduce((n, s) => n + s.photos.length, 0);
        console.log(`[photos] rebuilt after ${reason}: ${total} photographs (${stations.map((s) => `${s.name} ${s.photos.length}`).join(', ')})`);
      }
      if (cache.made || cache.removed) console.log(`[photos] smaller copies: ${cache.made} made, ${cache.removed} removed`);
      if (cache.failed.length) console.log(`[photos] couldn't make smaller copies of: ${cache.failed.join(', ')}`);
      if (reason && unplaced.length) console.log(`[photos] not placed: ${unplaced.map((u) => u.path).join(', ')}`);
      if (reason && convert.length) console.log(`[photos] need converting to JPEG: ${convert.join(', ')}`);
    } catch (e) {
      console.warn(`[photos] rebuild failed: ${e.message}`);
    } finally {
      running = false;
      if (again) {
        again = false;
        rebuild('further changes');
      }
    }
  }

  const soon = (reason) => {
    clearTimeout(timer);
    // Copying a batch of photos fires many events; wait for them to settle.
    timer = setTimeout(() => rebuild(reason), delayMs);
  };

  const watchers = [
    watch(PHOTO_DIR, { recursive: true }, (_event, file) => {
      if (file && IGNORE.test(file)) return;
      soon(file ? `change to ${String(file).replaceAll('\\', '/')}` : 'a change in assets/photos');
    }),
    watch(PLACES, () => soon('a change to places.ts')),
  ];
  // Don't keep one-shot commands such as `expo export` alive.
  for (const w of watchers) {
    w.unref();
    w.on('error', (e) => console.warn(`[photos] watcher stopped: ${e.message}`));
  }

  rebuild(); // catch up on anything changed while the server was stopped
  return () => watchers.forEach((w) => w.close());
}
