import { writeFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const UA = 'SaintForThat/1.0 (https://saints.superversive.net)';
const OUT_DIR = join(process.cwd(), '..', 'data', 'curation');
const OUT_FILE = join(OUT_DIR, 'master-list.json');
const SAINTS_DIR = join(process.cwd(), '..', 'data', 'saints');
const SLEEP_MS = 150;

const args = parseArgs({
  options: {
    limit: { type: 'string', default: '2000' },
    'dry-run': { type: 'boolean', default: false },
  },
});
const LIMIT = parseInt(args.values.limit!, 10);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/^st\.?\s+|^saint\s+|^blessed\s+|^ven\.?\s+|^venerable\s+/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getExistingSlugs(): Set<string> {
  if (!existsSync(SAINTS_DIR)) return new Set();
  return new Set(
    readdirSync(SAINTS_DIR)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', '')),
  );
}

async function getCategoryMembers(category: string, depth: number, seen: Set<string>): Promise<string[]> {
  if (depth <= 0 || seen.has(category)) return [];
  seen.add(category);
  const titles: string[] = [];
  let cont = '';
  do {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=${encodeURIComponent(category)}&cmtype=page|subcat&cmlimit=200&format=json${cont}`;
    const data = await fetchJson(url);
    for (const m of data.query?.categorymembers ?? []) {
      if (m.ns === 0 && !m.title.includes(':')) {
        titles.push(m.title);
      } else if (m.ns === 14) {
        const sub = await getCategoryMembers(m.title, depth - 1, seen);
        titles.push(...sub);
      }
    }
    cont = data.continue?.cmcontinue ? `&cmcontinue=${encodeURIComponent(data.continue.cmcontinue)}` : '';
    await sleep(SLEEP_MS);
  } while (cont);
  return titles;
}

async function getSummary(title: string): Promise<any> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  return fetchJson(url);
}

async function getInfobox(title: string): Promise<Record<string, string>> {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=wikitext&format=json&redirects=1`;
  const data = await fetchJson(url);
  const wikitext: string = data.parse?.wikitext?.['*'] ?? '';
  const props: Record<string, string> = {};
  const feastMatch = wikitext.match(/\|\s*feast_day\s*=\s*([^\n|]+)/);
  if (feastMatch) props.feastDay = feastMatch[1].trim().replace(/\[\[|\]\]/g, '');
  const patronMatch = wikitext.match(/\|\s*patronage\s*=\s*([^\n]+?)(?:\n\||\n\}\})/s);
  if (patronMatch) props.patronages = patronMatch[1].trim().replace(/\[\[|\]\]/g, '');
  const bornMatch = wikitext.match(/\|\s*birth_date\s*=\s*([^\n|]+)/);
  if (bornMatch) props.born = bornMatch[1].trim().replace(/\[\[|\]\]/g, '');
  return props;
}

function parseFeastDay(raw: string): string {
  if (!raw) return 'unknown';
  const months: Record<string, string> = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
  };
  for (const [m, num] of Object.entries(months)) {
    const re = new RegExp(`(\\d{1,2})\\s+${m}|${m}\\s+(\\d{1,2})`, 'i');
    const match = raw.match(re);
    if (match) {
      const day = match[1] || match[2];
      return `${num}-${day.padStart(2, '0')}`;
    }
  }
  return 'unknown';
}

function normaliseName(title: string): string {
  let name = title.replace(/\s*\([^)]*\)\s*/g, '').trim();
  if (/^Pope\s+/i.test(name)) name = 'St. ' + name.replace(/^Pope\s+/i, '');
  else if (/^Saint\s+/i.test(name)) name = 'St. ' + name.replace(/^Saint\s+/i, '');
  else if (!/^(St\.?|Saint|Blessed|Venerable|Pope)\s/i.test(name)) name = 'St. ' + name;
  return name;
}

async function main() {
  const existingSlugs = getExistingSlugs();
  console.log(`Existing saints: ${existingSlugs.size}`);

  console.log('Fetching category members...');
  const categories = [
    'Category:Christian saints by century',
    'Category:Saints by nationality',
    'Category:Patron saints',
    'Category:Angels in Christianity',
  ];
  const seen = new Set<string>();
  let allTitles: string[] = [];
  for (const cat of categories) {
    const titles = await getCategoryMembers(cat, 2, seen);
    allTitles.push(...titles);
    console.log(`  ${cat}: ${titles.length} pages`);
  }
  allTitles = [...new Set(allTitles)].filter((t) => !t.includes('List of') && !t.includes('Category:'));
  console.log(`Total unique titles: ${allTitles.length}`);

  const candidates: any[] = [];
  let processed = 0;
  let skipped = 0;
  for (const title of allTitles) {
    if (candidates.length >= LIMIT) break;
    const slug = toSlug(title);
    if (existingSlugs.has(slug)) { skipped++; continue; }
    try {
      const summary = await getSummary(title);
      if (summary.type === 'disambiguation' || !summary.extract) { skipped++; continue; }
      const infobox = await getInfobox(title);
      const name = normaliseName(title);
      const feastDay = parseFeastDay(infobox.feastDay ?? '');
      const rawPatronages = infobox.patronages ?? '';
      candidates.push({
        name,
        slug,
        wikipediaUrl: summary.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        feastDay,
        rawPatronages,
        rawSummary: summary.extract,
      });
      processed++;
      if (processed % 50 === 0) console.log(`  Processed ${processed}, candidates ${candidates.length}, skipped ${skipped}`);
    } catch (e) {
      console.log(`  FAIL ${title}: ${(e as Error).message}`);
      skipped++;
    }
    await sleep(SLEEP_MS);
  }

  console.log(`Done: ${candidates.length} candidates, ${skipped} skipped`);

  if (!args.values['dry-run']) {
    if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(OUT_FILE, JSON.stringify(candidates, null, 2) + '\n');
    console.log(`Written to ${OUT_FILE}`);
  } else {
    console.log('[dry-run] not writing file');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });