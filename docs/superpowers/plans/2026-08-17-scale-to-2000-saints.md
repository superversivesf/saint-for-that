# Scale to 2000 Saints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scale the saint database from 201 to ~2000 saints using a Wikipedia curation script + AI-driven batched enrichment + post-processing + human QA.

**Architecture:** Phase 1: curate-saints.ts fetches ~2000 candidate saints from Wikipedia API → master-list.json. Phase 2: batched subagents (10 saints each) transform raw Wikipedia data into valid saint JSON files. Phase 3: image fetch + synonym expansion for new needs. Phase 4: validation, build, human QA sample, deploy.

**Tech Stack:** Node 20, tsx, Wikipedia REST API, Astro 5, zod, vitest, Pagefind, Docker, nginx

## Global Constraints

- Saint schema: `{ slug, name, feastDay, bio, patronages, prayer?, image?, sources, featured, draft?, canonized? }` — see `site/src/lib/schema.ts`
- Slug: kebab-case, regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`
- Feast day: `MM-DD` or `"unknown"`
- Bio: 500-800 chars, hagiographic style, grounded in Wikipedia
- Patronages: `{ need, category }` where category ∈ `everyday|illness|jobs|travel|persecution|spiritual|military|family|nature|special`
- Need: lowercase, 1-4 words, regex `^[a-z0-9][a-z0-9 ,'&\/-]*$`
- Prayer: `{ text, source }` where source ∈ `traditional|original`; traditional only if source cited; original follows collect style ("O God, who... We ask this through Christ our Lord. Amen.")
- Sources: array of valid URLs (Wikipedia article URL required)
- NEED_SYNONYMS: 5-10 lowercase synonyms per need, no synonym equals key
- No comments in code
- 10 saints per subagent batch (proven reliable)
- Wikipedia API rate limit: 150ms delay between calls, User-Agent `SaintForThat/1.0 (https://saints.superversive.net)`
- Existing 201 saints must not be modified or duplicated
- All 31 existing tests must stay green

---

### Task 1: Curation script — fetch master list from Wikipedia

**Files:**
- Create: `scripts/curate-saints.ts`
- Create: `data/curation/` (directory)
- Create: `data/curation/master-list.json` (output)

**Interfaces:**
- Consumes: Wikipedia REST API (`https://en.wikipedia.org/w/api.php`)
- Produces: `data/curation/master-list.json` — array of `{ name, slug, wikipediaUrl, feastDay, rawPatronages, rawSummary }`

- [ ] **Step 1: Create the curation directory**

```bash
mkdir -p data/curation
```

- [ ] **Step 2: Write the curation script**

Create `scripts/curate-saints.ts`:

```typescript
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
      if (m.type === 'page' && !m.title.includes(':')) {
        titles.push(m.title);
      } else if (m.type === 'subcat') {
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
```

- [ ] **Step 3: Run the curation script**

Run: `cd site && pnpm exec tsx ../scripts/curate-saints.ts --limit 2000`

Expected: Script fetches categories from Wikipedia, processes candidates, writes `data/curation/master-list.json`. Output should show ~1800-2000 candidates (after deduplication against existing 201). Takes 5-10 minutes due to rate limiting.

- [ ] **Step 4: Verify the master list**

Run: `cd site && pnpm exec tsx -e "const d=JSON.parse(require('fs').readFileSync('../data/curation/master-list.json','utf-8')); console.log('Candidates:', d.length); console.log('Sample:', JSON.stringify(d[0], null, 2));"`

Expected: ~1800-2000 candidates. Each has name, slug, wikipediaUrl, feastDay, rawPatronages, rawSummary.

- [ ] **Step 5: Commit**

```bash
git add scripts/curate-saints.ts data/curation/master-list.json
git commit -m "feat: curate-saints script + master list (~2000 candidates)"
```

---

### Task 2: Enrichment dispatch infrastructure

**Files:**
- Create: `scripts/enrich-batch.ts` (batch processor: reads master-list slice, writes saint JSONs)

**Interfaces:**
- Consumes: `data/curation/master-list.json` (from Task 1), existing saint JSONs as format reference
- Produces: `data/saints/{slug}.json` files (10 per batch)

- [ ] **Step 1: Write the enrichment batch script**

Create `scripts/enrich-batch.ts`:

```typescript
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const SAINTS_DIR = join(process.cwd(), '..', 'data', 'saints');
const MASTER_LIST = join(process.cwd(), '..', 'data', 'curation', 'master-list.json');

const args = parseArgs({
  options: {
    start: { type: 'string', default: '0' },
    count: { type: 'string', default: '10' },
    output: { type: 'string', default: '/tmp/enrich-batch.md' },
  },
});
const start = parseInt(args.values.start!, 10);
const count = parseInt(args.values.count!, 10);

function main() {
  const master: any[] = JSON.parse(readFileSync(MASTER_LIST, 'utf-8'));
  const batch = master.slice(start, start + count);

  const existingNeeds = new Set<string>();
  for (const f of readdirSync(SAINTS_DIR).filter((f) => f.endsWith('.json'))) {
    const s = JSON.parse(readFileSync(join(SAINTS_DIR, f), 'utf-8'));
    for (const p of s.patronages ?? []) existingNeeds.add(p.need);
  }

  const report = { batch: [], existingNeeds: [...existingNeeds].sort(), sampleSaints: [] };

  const samples = ['anthony-of-padua', 'therese-of-lisieux', 'monica'];
  for (const slug of samples) {
    const path = join(SAINTS_DIR, `${slug}.json`);
    if (existsSync(path)) {
      report.sampleSaints.push(JSON.parse(readFileSync(path, 'utf-8')));
    }
  }

  for (const c of batch) {
    report.batch.push({
      name: c.name,
      slug: c.slug,
      wikipediaUrl: c.wikipediaUrl,
      feastDay: c.feastDay,
      rawPatronages: c.rawPatronages,
      rawSummary: c.rawSummary,
      alreadyExists: existsSync(join(SAINTS_DIR, `${c.slug}.json`)),
    });
  }

  writeFileSync(args.values.output!, JSON.stringify(report, null, 2));
  console.log(`Batch: ${report.batch.length} saints (index ${start}..${start + count - 1})`);
  console.log(`Existing needs: ${report.existingNeeds.length}`);
  console.log(`Report: ${args.values.output}`);
}

main();
```

- [ ] **Step 2: Test the batch script on a small slice**

Run: `cd site && pnpm exec tsx ../scripts/enrich-batch.ts --start 0 --count 3 --output /tmp/test-batch.json`
Expected: Prints "Batch: 3 saints (index 0..2)" and writes a JSON file with 3 candidates + existing needs + sample saints.

Run: `cat /tmp/test-batch.json | head -20`
Expected: JSON with batch array, existingNeeds array, sampleSaints array.

- [ ] **Step 3: Commit**

```bash
git add scripts/enrich-batch.ts
git commit -m "feat: enrich-batch script for AI enrichment dispatch"
```

---

### Task 3: Enrich saints in batches (Phase 2 — the big one)

**Files:**
- Creates: ~1800 `data/saints/{slug}.json` files

**Interfaces:**
- Consumes: `data/curation/master-list.json`, `scripts/enrich-batch.ts`
- Produces: saint JSON files matching `site/src/lib/schema.ts`

**This task is the main work.** It dispatches ~180 subagent batches (10 saints each). Each batch:
1. Reads a slice of master-list.json via enrich-batch.ts
2. Subagent receives the batch JSON + existing needs + sample saints as reference
3. Subagent writes 10 saint JSON files to `data/saints/`
4. Subagent reports slugs written + any failures

- [ ] **Step 1: Determine total batch count**

Run: `cd site && pnpm exec tsx -e "const d=JSON.parse(require('fs').readFileSync('../data/curation/master-list.json','utf-8')); console.log('Total:', d.length, 'Batches of 10:', Math.ceil(d.length/10))"`

Expected: ~180 batches.

- [ ] **Step 2: Dispatch batch 0 (pilot)**

Dispatch a subagent with:
- The batch JSON (from `enrich-batch.ts --start 0 --count 10 --output /tmp/batch-0.json`)
- Instructions: write 10 saint JSON files to `data/saints/`, matching the schema
- Reference: existing needs list + 3 sample saints (included in batch JSON)

Subagent instructions template (paste into each dispatch):

```
You are enriching Catholic saints for the Saint For That project. You receive 10 candidates from Wikipedia and must write valid saint JSON files for each.

READ THE BATCH FILE:
/tmp/batch-{N}.json

This file contains:
- "batch": array of 10 candidates with { name, slug, wikipediaUrl, feastDay, rawPatronages, rawSummary }
- "existingNeeds": array of ~152 existing need strings — map to these where possible
- "sampleSaints": 3 example saint JSON files showing the required format

For EACH candidate in the batch, write a file to:
/home/jason/Repos/saint-for-that/data/saints/{slug}.json

The JSON must match this schema (zod):
- slug: kebab-case string (use the candidate's slug)
- name: string (use the candidate's name)
- feastDay: "MM-DD" or "unknown" (use candidate's feastDay if valid, else "unknown")
- bio: 500-800 chars, hagiographic style (see sample saints). Ground in rawSummary — no fabricated facts.
- patronages: array of { need, category }. Map rawPatronages to existingNeeds where possible. New needs only when no existing need fits. Category must be one of: everyday, illness, jobs, travel, persecution, spiritual, military, family, nature, special.
- prayer: { text, source }. If a well-known traditional prayer exists for this saint, use it with source: "traditional". Otherwise write an original collect-style prayer: "O God, who... We ask this through Christ our Lord. Amen." with source: "original". Only use "traditional" if you can cite the source.
- sources: [wikipediaUrl] (from the candidate)
- featured: false
- draft: false
- canonized: include if known (e.g. "1232")

RULES:
- Do NOT modify any existing saint files (skip if a file already exists)
- bio must be 500-800 chars
- need must be lowercase, 1-4 words
- prayer.text must be 1-2000 chars
- All JSON must be valid (use JSON.stringify with 2-space indent)
- No comments in JSON

After writing all 10 files, report:
1. Slugs written (one per line)
2. Any failures (candidate slug + reason)

Write your report to: /home/jason/Repos/saint-for-that/.superpowers/sdd/2026-08-17-scale-to-2000-saints/batch-{N}-report.md
```

- [ ] **Step 3: Validate the pilot batch**

Run: `cd site && pnpm run validate`
Expected: `OK 211 saints valid` (was 201 + 10 new).

If validation fails, read the error, fix the offending JSON file(s), re-run.

- [ ] **Step 4: Dispatch batches 1-9 (first 100 saints)**

Dispatch 9 more batches (start=10, count=10 through start=90, count=10). Dispatch sequentially (not parallel — file system conflicts).

After all 10 batches (100 new saints):
Run: `cd site && pnpm run validate`
Expected: `OK 301 saints valid`

- [ ] **Step 5: Dispatch batches 10-89 (next 800 saints)**

Continue dispatching batches 10 at a time. After every 10 batches (~100 new saints), run validation:

Run: `cd site && pnpm run validate`

Checkpoint after ~400 saints: `OK 601 saints valid`
Checkpoint after ~600 saints: `OK 801 saints valid`
Checkpoint after ~800 saints: `OK 1001 saints valid`

- [ ] **Step 6: Dispatch batches 90-179 (final ~800 saints)**

Continue to completion. Final checkpoint:
Run: `cd site && pnpm run validate`
Expected: `OK ~2001 saints valid`

- [ ] **Step 7: Commit all new saint files**

```bash
git add data/saints/*.json
git commit -m "feat: enrich ~1800 new saints via AI batch processing"
```

Note: This is a large commit (~1800 files). If git struggles, commit in chunks:
```bash
for i in $(ls data/saints/*.json | head -600); do git add "$i"; done
git commit -m "feat: enrich saints batch 1-600"
# repeat for remaining files
```

---

### Task 4: Image fetch for new saints

**Files:**
- Modifies: ~1800 `data/saints/*.json` files (adds `image` field where Wikipedia has an image)

**Interfaces:**
- Consumes: `scripts/fetch-images.ts` (existing, no changes needed)
- Produces: saint JSON files with `image: { url, attribution, altText }` field

- [ ] **Step 1: Count saints without images**

Run: `for f in data/saints/*.json; do grep -q '"image"' "$f" || basename "$f" .json; done | wc -l`
Expected: ~1800 (all new saints lack images).

- [ ] **Step 2: Run the image fetcher**

Run: `cd site && pnpm exec tsx ../scripts/fetch-images.ts`

Expected: Script processes all saints without images, fetching from Wikipedia API. Takes 15-30 minutes (150ms delay per saint × ~1800 saints). Some saints will have no Wikipedia image (graceful skip).

- [ ] **Step 3: Verify image count**

Run: `grep -l '"image"' data/saints/*.json | wc -l`
Expected: > 1000 (was 197, now significantly more). Many saints lack Wikipedia images — 50-70% coverage is typical.

- [ ] **Step 4: Validate**

Run: `cd site && pnpm run validate`
Expected: `OK ~2001 saints valid` (validates new image fields).

- [ ] **Step 5: Commit**

```bash
git add data/saints/*.json
git commit -m "feat: fetch images for new saints"
```

---

### Task 5: Need taxonomy expansion (new needs + synonyms)

**Files:**
- Modifies: `site/src/lib/taxonomy.ts` (adds new needs to NEED_SYNONYMS)
- Modifies: `scripts/check-synonyms.ts` (no change — already handles new needs)

**Interfaces:**
- Consumes: all saint JSON files (collect new needs)
- Produces: expanded NEED_SYNONYMS with all new needs covered

- [ ] **Step 1: Identify new needs not in NEED_SYNONYMS**

Run:
```bash
cd /home/jason/Repos/saint-for-that
grep -o '"need": "[^"]*"' data/saints/*.json | sed 's/.*"need": "//;s/"$//' | sort -u > /tmp/all-needs.txt
cd site && pnpm exec tsx -e "
import { readFileSync, writeFileSync } from 'node:fs';
import { NEED_SYNONYMS } from './src/lib/taxonomy';
const existing = new Set(Object.keys(NEED_SYNONYMS));
const all = readFileSync('/tmp/all-needs.txt','utf-8').trim().split('\n');
const missing = all.filter(n => !existing.has(n));
console.log('Missing:', missing.length);
missing.forEach(n => console.log(' ', n));
writeFileSync('/tmp/missing-needs.txt', missing.join('\n') + '\n');
"
```

Expected: A list of new needs not yet in NEED_SYNONYMS. Likely 50-200 new needs.

- [ ] **Step 2: Dispatch synonym expansion in batches of 15**

For each batch of 15 new needs, dispatch a subagent to add 5-10 lowercase synonyms per need to `NEED_SYNONYMS` in `site/src/lib/taxonomy.ts`.

Subagent instructions template:

```
You are expanding the NEED_SYNONYMS map in the Saint For That project.

READ THE MISSING NEEDS:
/tmp/missing-needs-batch-{N}.txt

This file contains {count} need strings, one per line. For each need, add an entry to NEED_SYNONYMS in /home/jason/Repos/saint-for-that/site/src/lib/taxonomy.ts.

Rules:
- 5-10 lowercase synonyms per need (everyday phrasings, related terms, common misspellings)
- No synonym may equal the key itself
- No duplicates within an entry
- Insert in alphabetical order by key (match existing file ordering)
- Do NOT modify existing entries
- No comments in code

After editing, run: cd /home/jason/Repos/saint-for-that/site && pnpm exec vitest run test/synonyms.test.ts
Expected: 6/6 tests pass (or 31 total if full suite).

Commit: git add site/src/lib/taxonomy.ts && git commit -m "feat: synonyms for {count} new needs (batch {N})"
```

- [ ] **Step 3: Verify synonym coverage**

Run: `cd site && pnpm exec tsx ../scripts/check-synonyms.ts`
Expected: `OK ~300 needs covered` (was 152, now all needs covered).

Run: `cd site && pnpm test`
Expected: 31 tests pass.

- [ ] **Step 4: Commit (if subagents didn't already commit)**

```bash
git add site/src/lib/taxonomy.ts
git commit -m "feat: synonym expansion for new needs"
```

---

### Task 6: Full validation + build + deploy

**Files:**
- None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `cd site && pnpm test`
Expected: 31 tests pass.

- [ ] **Step 2: Run full build**

Run: `cd site && pnpm run build`

Expected: Build succeeds through all stages:
- `validate` → `OK ~2001 saints valid`
- `check-synonyms` → `OK ~300 needs covered`
- `astro check` → no errors
- `astro build` → ~2001 pages generated (may take 3-5 min)
- `pagefind` → index built (may take 1-2 min)

- [ ] **Step 3: Verify key pages in dist**

Run:
```bash
ls dist/saints/ | wc -l
grep -c 'letter-A' dist/saints/index.html
grep -c 'bg-gold/20' dist/index.html
```
Expected: ~2001 saint directories, letter-A present, badges present.

- [ ] **Step 4: Deploy**

Run: `cd /home/jason/Repos/saint-for-that && docker compose up -d --build`

Expected: Container builds and starts. Build may take 5-10 min due to 2000 pages.

- [ ] **Step 5: Verify live**

Run:
```bash
curl -s https://saints.superversive.net/ | grep -c 'bg-gold/20'
curl -s https://saints.superversive.net/saints/ | grep -c 'letter-A'
```
Expected: both return ≥1.

- [ ] **Step 6: Final commit (if any uncommitted changes)**

```bash
git status
```
If clean, done. If not, commit any remaining changes.

---

### Task 7: Human QA sample (10% spot-check)

**Files:**
- Create: `scripts/qa-sample.ts` (picks random 10% sample)
- Create: `data/curation/qa-sample.txt` (list of slugs to check)

**Interfaces:**
- Consumes: all saint JSON files
- Produces: a random 10% sample for human review

- [ ] **Step 1: Write the QA sample script**

Create `scripts/qa-sample.ts`:

```typescript
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const SAINTS_DIR = join(process.cwd(), '..', 'data', 'saints');

function main() {
  const files = readdirSync(SAINTS_DIR).filter((f) => f.endsWith('.json'));
  const slugs = files.map((f) => f.replace('.json', ''));
  const sampleSize = Math.ceil(slugs.length * 0.1);
  const shuffled = [...slugs].sort(() => Math.random() - 0.5);
  const sample = shuffled.slice(0, sampleSize).sort();
  console.log(sample.join('\n'));
  console.error(`\nSample: ${sampleSize} of ${slugs.length} saints (10%)`);
}

main();
```

- [ ] **Step 2: Generate the sample**

Run: `cd site && pnpm exec tsx ../scripts/qa-sample.ts > ../data/curation/qa-sample.txt 2>/dev/null`
Expected: ~200 slugs written to qa-sample.txt.

- [ ] **Step 3: Commit the QA infrastructure**

```bash
git add scripts/qa-sample.ts data/curation/qa-sample.txt
git commit -m "feat: QA sample script + 10% spot-check list"
```

- [ ] **Step 4: Human spot-check (manual, not automated)**

For each slug in `data/curation/qa-sample.txt`:
1. Open `data/saints/{slug}.json`
2. Cross-check bio against the Wikipedia source URL
3. Verify patronages are correct
4. Verify prayer: if "traditional", confirm it's a known traditional prayer; if "original", confirm it's theologically sound
5. Flag any issues for correction

This step is performed by the human partner, not by the AI. The AI's role is to provide the sample list and fix any issues the human identifies.

- [ ] **Step 5: Fix any issues found during QA**

For each issue the human identifies, fix the saint JSON file and re-validate:

```bash
cd site && pnpm run validate
```

Commit fixes:
```bash
git add data/saints/*.json
git commit -m "fix: QA corrections from 10% spot-check"
```

- [ ] **Step 6: Re-deploy if corrections were made**

```bash
cd /home/jason/Repos/saint-for-that && docker compose up -d --build
```