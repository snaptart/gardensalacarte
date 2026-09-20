// A small local page for putting each station's photographs in order and choosing its
// thumbnail. Saves assets/photos/arrangement.json and rebuilds photos.generated.ts, so a
// running `npm run web` / `npm start` picks the change up straight away.
//
//   npm run arrange [-- --max-km 75] [-- --port 8090]
import { exec } from 'node:child_process';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import exifr from 'exifr';

import { collectPhotos, IMAGE, PHOTO_DIR, readArrangement, writeArrangement, writeGenerated } from './photo-library.mjs';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? Number(process.argv[i + 1]) : fallback;
};
const maxKm = arg('--max-km', 75);
const port = arg('--port', 8090);
const PAGE = new URL('./arrange-photos.html', import.meta.url);
const TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

async function snapshot() {
  const { stations, unplaced, convert, strayFolders } = await collectPhotos({ maxKm });
  return {
    stations: stations.map(({ id, name, folder, thumbnail, arranged, photos }) => ({ id, name, folder, thumbnail, arranged, photos })),
    unplaced,
    convert,
    strayFolders,
  };
}

/** A photo path from the page, checked to be an image inside assets/photos. */
function photoFile(path) {
  if (!path || !IMAGE.test(path)) return null;
  const full = resolve(PHOTO_DIR, path);
  return full.startsWith(resolve(PHOTO_DIR) + sep) && existsSync(full) && statSync(full).isFile() ? full : null;
}

const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

const readBody = (req) => new Promise((ok, fail) => {
  let data = '';
  req.on('data', (c) => { data += c; });
  req.on('end', () => ok(data));
  req.on('error', fail);
});

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (req.method === 'GET' && url.pathname === '/') {
      return send(res, 200, readFileSync(PAGE), 'text/html; charset=utf-8');
    }
    if (req.method === 'GET' && url.pathname === '/api/photos') {
      return send(res, 200, await snapshot());
    }
    if (req.method === 'GET' && (url.pathname === '/thumb' || url.pathname === '/photo')) {
      const full = photoFile(url.searchParams.get('path'));
      if (!full) return send(res, 404, { error: 'not found' });
      if (url.pathname === '/thumb') {
        // The small preview the camera embeds in the file loads far faster than the photo.
        const small = await exifr.thumbnail(full).catch(() => undefined);
        if (small) return send(res, 200, Buffer.from(small), 'image/jpeg');
      }
      res.writeHead(200, { 'Content-Type': TYPES[extname(full).toLowerCase()] ?? 'application/octet-stream' });
      return createReadStream(full).pipe(res);
    }
    if (req.method === 'POST' && url.pathname === '/api/save') {
      const incoming = JSON.parse(await readBody(req));
      const arrangement = readArrangement();
      for (const [id, { order, thumbnail }] of Object.entries(incoming)) {
        arrangement[id] = { order: order.filter((p) => typeof p === 'string'), thumbnail: typeof thumbnail === 'string' ? thumbnail : undefined };
      }
      writeArrangement(arrangement);
      const { stations } = await collectPhotos({ maxKm });
      await writeGenerated(stations);
      console.log(`  saved ${new Date().toLocaleTimeString()}: ${stations.map((s) => `${s.name} ${s.photos.length}`).join(', ')}`);
      return send(res, 200, await snapshot());
    }
    send(res, 404, { error: 'not found' });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: e.message });
  }
});

server.listen(port, '127.0.0.1', () => {
  // 127.0.0.1 rather than localhost, which can resolve to IPv6 first and miss the server.
  const address = `http://127.0.0.1:${port}`;
  console.log(`\nArrange photographs at ${address}  (Ctrl+C to stop)\n`);
  const opener = process.platform === 'win32' ? `start "" "${address}"` : process.platform === 'darwin' ? `open ${address}` : `xdg-open ${address}`;
  if (!process.argv.includes('--no-open')) exec(opener);
});
server.on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `Port ${port} is busy; try: npm run arrange -- --port ${port + 1}` : e);
  process.exit(1);
});
