import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const SAINTS_DIR = join(process.cwd(), '..', 'data', 'saints');
const UA = 'SaintForThat/1.0 (https://saints.superversive.net)';

const args = parseArgs({
  options: {
    start: { type: 'string', default: '0' },
    count: { type: 'string', default: '50' },
    output: { type: 'string', default: '/tmp/verify-results.json' },
  },
});
const start = parseInt(args.values.start!, 10);
const count = parseInt(args.values.count!, 10);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

function wikiTitleFromUrl(url: string): string | null {
  const m = url.match(/wikipedia\.org\/wiki\/([^#?]+)/);
  if (m) return decodeURIComponent(m[1]).replace(/_/g, ' ');
  return null;
}

async function getWikipediaSummary(title: string): Promise<any> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  return fetchJson(url);
}

function checkBio(saint: any, wikiSummary: string): string[] {
  const issues: string[] = [];
  const bio = saint.bio.toLowerCase();
  const wiki = wikiSummary.toLowerCase();

  const saintFirstName = saint.name.replace(/^St\.?\s+|^Saint\s+|^Blessed\s+/i, '').split(' ')[0].toLowerCase();
  if (saintFirstName && !bio.includes(saintFirstName) && wiki.includes(saintFirstName)) {
    issues.push(`bio does not mention saint's first name "${saintFirstName}"`);
  }

  if (bio.length < 500) issues.push(`bio too short (${bio.length} chars)`);
  if (bio.length > 10000) issues.push(`bio too long (${bio.length} chars)`);

  return issues;
}

function checkPatronages(saint: any, wikiText: string): string[] {
  const issues: string[] = [];
  const wiki = wikiText.toLowerCase();
  for (const p of saint.patronages) {
    const need = p.need.toLowerCase();
    const validCategories = ['everyday', 'illness', 'jobs', 'travel', 'persecution', 'spiritual', 'military', 'family', 'nature', 'special'];
    if (!validCategories.includes(p.category)) {
      issues.push(`patronage "${p.need}" has invalid category "${p.category}"`);
    }
  }
  if (saint.patronages.length === 0) {
    issues.push('no patronages');
  }
  return issues;
}

function checkPrayer(saint: any): string[] {
  const issues: string[] = [];
  if (!saint.prayer) {
    issues.push('no prayer');
    return issues;
  }
  if (!['traditional', 'original'].includes(saint.prayer.source)) {
    issues.push(`invalid prayer source "${saint.prayer.source}"`);
  }
  if (saint.prayer.source === 'traditional') {
    const known = ['amen', 'lord', 'god', 'christ', 'jesus', 'saint', 'pray'];
    const text = saint.prayer.text.toLowerCase();
    const hasKnown = known.some((k) => text.includes(k));
    if (!hasKnown) issues.push('traditional prayer lacks religious language');
  }
  if (saint.prayer.text.length < 50) issues.push(`prayer too short (${saint.prayer.text.length} chars)`);
  if (saint.prayer.text.length > 2000) issues.push(`prayer too long (${saint.prayer.text.length} chars)`);
  return issues;
}

function checkFeastDay(saint: any): string[] {
  const issues: string[] = [];
  if (!saint.feastDay) {
    issues.push('no feast day');
    return issues;
  }
  if (saint.feastDay !== 'unknown') {
    const re = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!re.test(saint.feastDay)) {
      issues.push(`invalid feast day format "${saint.feastDay}"`);
    }
  }
  return issues;
}

function checkSlug(saint: any): string[] {
  const issues: string[] = [];
  const re = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!re.test(saint.slug)) {
    issues.push(`invalid slug format "${saint.slug}"`);
  }
  if (saint.slug !== saint.slug.toLowerCase()) {
    issues.push(`slug not lowercase "${saint.slug}"`);
  }
  return issues;
}

function checkName(saint: any): string[] {
  const issues: string[] = [];
  if (!saint.name || saint.name.length < 3) {
    issues.push('name too short or missing');
    return issues;
  }
  if (!/^(St\.?|Saint|Blessed|Venerable|Pope|Virgin|Our Lady|Christ|Mary|Angel|Archangel|Bishop|Abbot|Abbess|Mother|Father|Sister|Brother|Saints|Martyrs|Four|Three|Seven|Twelve|Thirteen)/i.test(saint.name)) {
    issues.push(`name does not start with a title: "${saint.name}"`);
  }
  return issues;
}

function checkSources(saint: any): string[] {
  const issues: string[] = [];
  if (!saint.sources || saint.sources.length === 0) {
    issues.push('no sources');
    return issues;
  }
  for (const src of saint.sources) {
    try {
      new URL(src);
    } catch {
      issues.push(`invalid source URL "${src}"`);
    }
  }
  const hasWiki = saint.sources.some((s: string) => s.includes('wikipedia.org'));
  if (!hasWiki) issues.push('no Wikipedia source');
  return issues;
}

async function main() {
  const files = readdirSync(SAINTS_DIR).filter((f) => f.endsWith('.json')).sort();
  const batch = files.slice(start, start + count);
  const results: any[] = [];

  for (const f of batch) {
    const saint = JSON.parse(readFileSync(join(SAINTS_DIR, f), 'utf-8'));
    const issues: string[] = [];

    issues.push(...checkSlug(saint));
    issues.push(...checkName(saint));
    issues.push(...checkFeastDay(saint));
    issues.push(...checkPatronages(saint, ''));
    issues.push(...checkPrayer(saint));
    issues.push(...checkSources(saint));

    let wikiSummary = '';
    if (saint.sources && saint.sources.length > 0) {
      const title = wikiTitleFromUrl(saint.sources[0]);
      if (title) {
        try {
          const wiki = await getWikipediaSummary(title);
          wikiSummary = wiki.extract || '';
          issues.push(...checkBio(saint, wikiSummary));
        } catch (e) {
          issues.push(`Wikipedia fetch failed: ${(e as Error).message}`);
        }
      }
    }

    if (issues.length > 0) {
      results.push({ slug: saint.slug, name: saint.name, issues });
      console.log(`ISSUE ${saint.slug}: ${issues.join('; ')}`);
    } else {
      console.log(`OK ${saint.slug}`);
    }
    await sleep(200);
  }

  writeFileSync(args.values.output!, JSON.stringify(results, null, 2) + '\n');
  console.log(`\nDone: ${results.length} saints with issues out of ${batch.length} checked`);
  console.log(`Results: ${args.values.output}`);
}

main().catch((e) => { console.error(e); process.exit(1); });