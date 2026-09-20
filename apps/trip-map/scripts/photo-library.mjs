// Shared by build-photos.mjs and arrange-photos.mjs: finds each station's photographs,
// applies the arrangement saved from the arrange page, and writes photos.generated.ts.
//
// Where a station's photographs come from, in order of preference:
//   1. its folder, assets/photos/<folder> (`folder` in src/data/places.ts; defaults to the
//      station id) — every image in it belongs to that station, however far away it was taken
//   2. loose files at the top of assets/photos, matched by EXIF GPS to the nearest station
//      (within maxKm), or by a station name in the file name
//   3. the placeholder assets/photos/<station id>.jpg, only while the station has nothing else
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import exifr from 'exifr';
import sharp from 'sharp';

// exifr takes a path string, not a URL object.
export const PHOTO_DIR = fileURLToPath(new URL('../assets/photos/', import.meta.url));
export const ARRANGEMENT = join(PHOTO_DIR, 'arrangement.json');
// Smaller copies of every photograph, made here and kept in step with assets/photos. Outside
// that folder on purpose: writing them inside it would set its watcher off again.
export const CACHE_DIR = fileURLToPath(new URL('../assets/photo-cache/', import.meta.url));
const MANIFEST = join(CACHE_DIR, 'manifest.json');
/**
 * The copies, by the length of the photograph's *shorter* side, so a cropped square tile or
 * 4:3 plate still has enough pixels whichever way the photograph was taken.
 *   thumb   — grid tiles (≤180 px) and the station thumbnails, on screens up to 3× density
 *   display — the journal plate
 * The lightbox keeps the original, for zooming in.
 */
const SIZES = { thumb: 480, display: 1080 };
const OUT = new URL('../src/data/photos.generated.ts', import.meta.url);
export const IMAGE = /\.(jpe?g|png|webp)$/i;
const NEEDS_CONVERSION = /\.(heic|heif|tiff?|dng|cr2|nef|arw)$/i;

/** Stations, read from the itinerary so there is one source of truth. */
export function readStations() {
  const src = readFileSync(new URL('../src/data/places.ts', import.meta.url), 'utf8');
  const list = src.slice(src.indexOf('export const PLACES'), src.indexOf('\n];', src.indexOf('export const PLACES')));
  const starts = [...list.matchAll(/id: '([^']+)', name: '([^']+)'/g)];
  const out = starts.map((m, i) => {
    const block = list.slice(m.index, starts[i + 1]?.index ?? list.length);
    const [, lat, lon] = block.match(/lat: ([-\d.]+), lon: ([-\d.]+)/) ?? [];
    const folder = block.match(/folder: (['"])(.*?)\1/)?.[2] || m[1];
    return { id: m[1], name: m[2], lat: +lat, lon: +lon, folder };
  });
  if (!out.length || out.some((s) => Number.isNaN(s.lat))) throw new Error('could not read stations from src/data/places.ts');
  return out;
}

const km = (a, b) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

/** The saved arrangement: { [stationId]: { order: [path], thumbnail: path } }, paths relative to assets/photos. */
export function readArrangement() {
  if (!existsSync(ARRANGEMENT)) return {};
  try {
    return JSON.parse(readFileSync(ARRANGEMENT, 'utf8'));
  } catch (e) {
    console.warn(`  ! ignoring ${ARRANGEMENT}: ${e.message}`);
    return {};
  }
}

export function writeArrangement(arrangement) {
  writeFileSync(ARRANGEMENT, `${JSON.stringify(arrangement, null, 2)}\n`);
}

/** Capture time, and the title and caption the photographer wrote into the file. */
async function meta(path) {
  const t = await exifr.parse(path, { tiff: true, exif: true, iptc: true, xmp: true }).catch(() => null);
  const d = t?.DateTimeOriginal ?? t?.CreateDate;
  // XMP fields can come back as objects or arrays; only plain text is any use here.
  const text = (v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
  return {
    taken: d instanceof Date && !Number.isNaN(+d) ? d : undefined,
    // Photo software writes the title to IPTC Object Name and the caption to Image Description.
    title: text(t?.ObjectName) ?? text(t?.Title) ?? text(t?.XPTitle) ?? text(t?.Headline) ?? text(t?.headline),
    caption: text(t?.ImageDescription) ?? text(t?.Caption) ?? text(t?.description) ?? text(t?.XPComment),
  };
}

/** Dated photographs oldest first, then undated ones by file name. */
const byDate = (a, b) => {
  if (a.taken && b.taken) return a.taken - b.taken || a.path.localeCompare(b.path);
  if (a.taken || b.taken) return a.taken ? -1 : 1;
  return a.path.localeCompare(b.path);
};

/**
 * Every station with its photographs in display order, plus what couldn't be placed.
 * Each photo is { path (relative to assets/photos, forward slashes), taken?, how }.
 */
export async function collectPhotos({ maxKm = 75 } = {}) {
  const stations = readStations();
  const arrangement = readArrangement();
  const entries = readdirSync(PHOTO_DIR);
  const assigned = Object.fromEntries(stations.map((s) => [s.id, []]));
  const unplaced = [];
  const convert = [];
  const strayFolders = [];

  // 1. station folders
  for (const s of stations) {
    const dir = join(PHOTO_DIR, s.folder);
    if (!existsSync(dir) || !statSync(dir).isDirectory()) continue;
    for (const file of readdirSync(dir).sort()) {
      if (NEEDS_CONVERSION.test(file)) convert.push(`${s.folder}/${file}`);
      if (!IMAGE.test(file)) continue;
      const path = `${s.folder}/${file}`;
      assigned[s.id].push({ path, ...(await meta(join(dir, file))), how: `folder ${s.folder}` });
    }
  }
  const folders = new Set(stations.map((s) => s.folder.toLowerCase()));
  for (const e of entries) {
    if (statSync(join(PHOTO_DIR, e)).isDirectory() && !folders.has(e.toLowerCase())) strayFolders.push(e);
  }

  // 2. loose files, 3. placeholders
  const placeholders = {};
  for (const file of entries.filter((f) => IMAGE.test(f)).sort()) {
    const full = join(PHOTO_DIR, file);
    const stem = basename(file, extname(file));
    const own = stations.find((s) => s.id === stem);
    if (own) {
      placeholders[own.id] = { path: file, how: 'placeholder' };
      continue;
    }
    let gps;
    try {
      gps = await exifr.gps(full);
    } catch {
      // unreadable metadata is not fatal — fall through to the file-name match
    }
    const info = await meta(full);
    if (gps?.latitude != null && gps?.longitude != null) {
      const here = { lat: gps.latitude, lon: gps.longitude };
      const near = stations.map((s) => ({ s, d: km(here, s) })).sort((a, b) => a.d - b.d)[0];
      if (near.d <= maxKm) {
        assigned[near.s.id].push({ path: file, ...info, how: `GPS, ${near.d.toFixed(1)} km from ${near.s.name}` });
      } else {
        unplaced.push({ path: file, why: `GPS is ${near.d.toFixed(0)} km from the nearest station (${near.s.name}); limit is ${maxKm} km` });
      }
      continue;
    }
    const name = slug(stem);
    const byName = stations.find((s) => name.includes(slug(s.id)) || name.includes(slug(s.name)));
    if (byName) assigned[byName.id].push({ path: file, ...info, how: 'file name' });
    else unplaced.push({ path: file, why: 'no GPS in the photo, and no station name in the file name' });
  }
  for (const file of entries.filter((f) => NEEDS_CONVERSION.test(f))) convert.push(file);

  const result = stations.map((s) => {
    let photos = assigned[s.id];
    if (!photos.length && placeholders[s.id]) photos = [placeholders[s.id]];

    // Arranged photographs first, in the saved order; anything new follows by date.
    const saved = arrangement[s.id] ?? {};
    const rank = new Map((saved.order ?? []).map((p, i) => [p, i]));
    photos.sort((a, b) => {
      const ra = rank.get(a.path);
      const rb = rank.get(b.path);
      if (ra != null && rb != null) return ra - rb;
      if (ra != null || rb != null) return ra != null ? -1 : 1;
      return byDate(a, b);
    });
    const thumbnail = photos.some((p) => p.path === saved.thumbnail) ? saved.thumbnail : photos[0]?.path;
    return { ...s, photos, thumbnail, arranged: rank.size > 0 };
  });

  return { stations: result, unplaced, convert, strayFolders };
}

/** Where a photograph's copy of the given size lives, relative to assets/photo-cache. */
const cachePath = (size, path) => `${size}/${path}.jpg`;

/**
 * Brings assets/photo-cache in step with the photographs: makes copies for new or changed
 * files (known by size and modified time, so a re-export under the same name counts) and
 * deletes copies of photographs that are gone. Returns what it did, for the report.
 */
export async function syncCache(stations) {
  let manifest = {};
  try {
    manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  } catch {
    // no cache yet, or a damaged manifest: everything is made afresh
  }
  const paths = [...new Set(stations.flatMap((s) => s.photos.map((p) => p.path)))];
  const stamp = (path) => {
    const st = statSync(join(PHOTO_DIR, path));
    return `${st.size}:${Math.round(st.mtimeMs)}`;
  };
  const exists = (path) => Object.keys(SIZES).every((size) => existsSync(join(CACHE_DIR, cachePath(size, path))));
  const todo = paths.filter((p) => manifest[p] !== stamp(p) || !exists(p));

  const next = Object.fromEntries(paths.filter((p) => !todo.includes(p)).map((p) => [p, manifest[p]]));
  const failed = [];
  // A few at a time: sharp is quick, but a first run has every photograph to do.
  const queue = [...todo];
  await Promise.all(Array.from({ length: 4 }, async () => {
    for (let path = queue.shift(); path; path = queue.shift()) {
      try {
        const source = readFileSync(join(PHOTO_DIR, path));
        for (const [size, px] of Object.entries(SIZES)) {
          const out = join(CACHE_DIR, cachePath(size, path));
          mkdirSync(dirname(out), { recursive: true });
          // rotate() turns the pixels upright by the EXIF orientation; the copy carries no
          // metadata (so no GPS either) to do it later.
          await sharp(source)
            .rotate()
            .resize({ width: px, height: px, fit: 'outside', withoutEnlargement: true })
            .jpeg({ quality: 80, mozjpeg: true })
            .toFile(out);
        }
        next[path] = stamp(path);
      } catch (e) {
        failed.push(`${path} (${e.message})`);
      }
    }
  }));

  // Copies of photographs that have been deleted, moved or renamed.
  const keep = new Set(Object.keys(next).flatMap((p) => Object.keys(SIZES).map((size) => cachePath(size, p))));
  let removed = 0;
  const prune = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        prune(full);
        if (!readdirSync(full).length) rmSync(full, { recursive: true });
      } else if (full !== MANIFEST && !keep.has(relative(CACHE_DIR, full).replaceAll('\\', '/'))) {
        rmSync(full);
        removed++;
      }
    }
  };
  prune(CACHE_DIR);

  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(MANIFEST, `${JSON.stringify(next, null, 2)}\n`);
  return { made: todo.length - failed.length, removed, failed, cached: new Set(Object.keys(next)) };
}

/**
 * Makes any missing copies, then writes src/data/photos.generated.ts for the app. Returns
 * false when the generated file didn't change. The copies come first because the generated
 * file requires them, and the bundler fails on a missing file.
 */
export async function writeGenerated(stations) {
  const cache = await syncCache(stations);
  const text = generatedText(stations, cache.cached);
  // Rewriting an identical file would still make the running app reload.
  if (existsSync(OUT) && readFileSync(OUT, 'utf8') === text) return { changed: false, cache };
  writeFileSync(OUT, text);
  return { changed: true, cache };
}

function generatedText(stations, cached) {
  const req = (path) => `require(${JSON.stringify(`../../assets/photos/${path}`)})`;
  // A photograph whose copies couldn't be made falls back to the original.
  const copy = (size, path) => (cached.has(path)
    ? `require(${JSON.stringify(`../../assets/photo-cache/${cachePath(size, path)}`)})`
    : req(path));
  const photos = stations.map((s) => {
    const entries = s.photos.map((p) => {
      const parts = [`src: ${req(p.path)}`, `display: ${copy('display', p.path)}`, `thumb: ${copy('thumb', p.path)}`];
      if (p.title) parts.push(`title: ${JSON.stringify(p.title)}`);
      if (p.caption) parts.push(`caption: ${JSON.stringify(p.caption)}`);
      return `    { ${parts.join(', ')} },`;
    });
    return `  ${s.id}: [\n${entries.join('\n')}${entries.length ? '\n' : ''}  ],`;
  }).join('\n');
  const thumbs = stations.map((s) => `  ${s.id}: ${s.thumbnail ? copy('thumb', s.thumbnail) : 'undefined'},`).join('\n');

  return `// GENERATED by scripts/build-photos.mjs — do not edit by hand.
// Photographs come from each station's folder in assets/photos (plus loose files matched by
// GPS), ordered and given a thumbnail by assets/photos/arrangement.json (\`npm run arrange\`).
// \`display\` and \`thumb\` are smaller copies in assets/photo-cache, made by the same script.
import type { ImageSourcePropType } from 'react-native';

/**
 * One photograph: the original (\`src\`, for the lightbox), a copy for the journal plate, a
 * small one for tiles and thumbnails, and the title and caption from its own metadata.
 */
export type GeneratedPhoto = {
  src: ImageSourcePropType;
  display: ImageSourcePropType;
  thumb: ImageSourcePropType;
  title?: string;
  caption?: string;
};

export const PHOTOS_BY_STATION: Record<string, GeneratedPhoto[]> = {
${photos}
};

export const THUMBNAIL_BY_STATION: Record<string, ImageSourcePropType | undefined> = {
${thumbs}
};
`;
}
