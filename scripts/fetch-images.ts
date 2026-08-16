import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const SAINTS_DIR = join(process.cwd(), '..', 'data', 'saints');
const UA = 'SaintForThat/1.0 (https://saints.superversive.net)';

const args = parseArgs({
  options: {
    force: { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
    limit: { type: 'string' },
  },
});

function wikiTitleFromSource(sources: string[]): string | null {
  for (const s of sources) {
    const m = s.match(/wikipedia\.org\/wiki\/([^#?]+)/);
    if (m) return decodeURIComponent(m[1]).replace(/_/g, ' ');
  }
  return null;
}

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function getImage(title: string): Promise<{ url: string; attribution: string } | null> {
  const pi = await fetchJson(
    `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=800&redirects=1`,
  );
  const page: any = Object.values(pi.query?.pages ?? {})[0];
  if (!page?.thumbnail?.source) return null;
  const thumb: string = page.thumbnail.source.split('?')[0];
  const fileTitle: string | undefined = page.pageimage;

  let attribution = 'Wikimedia Commons';
  if (fileTitle) {
    try {
      const ii = await fetchJson(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=extmetadata&format=json`,
      );
      const p2: any = Object.values(ii.query?.pages ?? {})[0];
      const meta = p2?.imageinfo?.[0]?.extmetadata ?? {};
      const artist = String(meta.Artist?.value ?? '').replace(/<[^>]+>/g, '').trim();
      const license = String(meta.LicenseShortName?.value ?? '').trim();
      attribution = [artist, license].filter(Boolean).join(' · ') || 'Wikimedia Commons';
    } catch {
      // keep default attribution
    }
  }
  return { url: thumb, attribution };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const files = readdirSync(SAINTS_DIR).filter((f) => f.endsWith('.json'));
  const targets = args.values.limit ? files.filter((f) => f.includes(args.values.limit!)) : files;

  let added = 0;
  let skipped = 0;
  let failed = 0;

  for (const f of targets) {
    const path = join(SAINTS_DIR, f);
    const saint = JSON.parse(readFileSync(path, 'utf-8'));
    if (saint.image && !args.values.force) {
      skipped++;
      continue;
    }
    const title = wikiTitleFromSource(saint.sources ?? []);
    if (!title) {
      console.log(`SKIP ${f}: no wikipedia source`);
      skipped++;
      continue;
    }
    try {
      const img = await getImage(title);
      if (!img) {
        console.log(`SKIP ${f}: no image on page`);
        skipped++;
        continue;
      }
      if (args.values['dry-run']) {
        console.log(`[dry-run] ${f}: ${img.url}`);
        added++;
        continue;
      }
      saint.image = { url: img.url, attribution: img.attribution, altText: `Portrait of ${saint.name}` };
      writeFileSync(path, JSON.stringify(saint, null, 2) + '\n');
      console.log(`OK ${f}: ${img.url}`);
      added++;
    } catch (e) {
      console.log(`FAIL ${f}: ${(e as Error).message}`);
      failed++;
    }
    await sleep(150);
  }

  console.log(`Done: ${added} added, ${skipped} skipped, ${failed} failed.`);
}

main();
