// Finds each station's photographs (its folder, or loose files matched by EXIF GPS),
// applies the saved arrangement, and writes src/data/photos.generated.ts.
//
//   node scripts/build-photos.mjs [--max-km 75]
//
// Runs automatically before `npm start` / `npm run web` / `npm run android|ios`.
// See scripts/photo-library.mjs for the matching rules; `npm run arrange` sets the order.
import { collectPhotos, writeGenerated } from './photo-library.mjs';

const maxKmArg = process.argv.indexOf('--max-km');
const maxKm = maxKmArg > -1 ? Number(process.argv[maxKmArg + 1]) : 75;

const { stations, unplaced, convert, strayFolders } = await collectPhotos({ maxKm });
const { cache } = await writeGenerated(stations);

// ---- report ----
const total = stations.reduce((n, s) => n + s.photos.length, 0);
console.log(`\nPhotographs placed: ${total}\n`);
for (const s of stations) {
  const list = s.photos;
  const mark = list.length ? '·' : '!';
  const sources = [...new Set(list.map((p) => (p.how.startsWith('GPS') ? 'loose file by GPS' : p.how)))].join(' + ');
  const detail = list.length
    ? `  — ${sources}; ${s.arranged ? 'arranged' : 'date order'}; thumbnail ${s.thumbnail}`
    : `  — none yet (add photos to assets/photos/${s.folder})`;
  console.log(` ${mark} ${s.name.padEnd(14)} ${String(list.length).padStart(3)} photo(s)${detail}`);
}
if (cache.made || cache.removed) {
  console.log(`\n  Smaller copies (assets/photo-cache): ${cache.made} made, ${cache.removed} removed`);
}
if (cache.failed.length) {
  console.log(`\n  Couldn't make smaller copies of (${cache.failed.length}; the originals are used):`);
  for (const f of cache.failed) console.log(`   - ${f}`);
}
if (strayFolders.length) {
  console.log(`\n  Folders not linked to any station: ${strayFolders.join(', ')}`);
  console.log('   Fix: set `folder` for the station in src/data/places.ts to the folder name.');
}
if (unplaced.length) {
  console.log('\n  Not placed:');
  for (const u of unplaced) console.log(`   - ${u.path}: ${u.why}`);
  console.log("   Fix: move the file into the station's folder.");
}
if (convert.length) {
  console.log(`\n  Need converting to JPEG (${convert.length}): ${convert.join(', ')}`);
  console.log('   On Windows: open in Photos → ... → Save as → JPG.');
}
console.log('');
