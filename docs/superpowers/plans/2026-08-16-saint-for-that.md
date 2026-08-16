# Saint For That — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, mobile-first, searchable website of 200 Catholic saints with patronages, bios, and prayers, backed by a JSON data schema consumable by a future Flutter app.

**Architecture:** Astro 5 static site in `site/` with Tailwind 4 and Pagefind client-side search. Canonical data lives in `data/saints/*.json` (one file per saint), validated by zod at build time. Astro content collections symlink to the data dir. Pagefind indexes generated HTML with `data-pagefind-*` attributes so patronages are searchable.

**Tech Stack:** Node 20 (`.nvmrc`), pnpm 9, Astro 5, Tailwind 4 (`@tailwindcss/vite`), Pagefind 1.x, zod 3, vitest 2, tsx.

## Global Constraints

- Node `>=20.0.0`; `.nvmrc` contains `20`
- pnpm only (`packageManager: pnpm@9`); no npm/yarn lockfiles
- All commands run from `site/` directory
- Data files: one JSON per saint at `data/saints/<slug>.json`; slug is kebab-case and must equal filename
- `patronages[].category` MUST be one of the 10 taxonomy IDs (see Task 2)
- `patronages[].need` is lowercase, plural noun phrase, max 4 words
- Images: public-domain Wikimedia URLs only, with attribution
- No comments in code unless asked
- Footer on every page links to the song "There Is a Saint for That" by Peter's Barque and to `/about`
- Song URL: replace `YOUR_SONG_ID` in BaseLayout.astro and about.astro with the real YouTube video ID before Task 1 Step 6 (ask the user for the link if unknown)
- Mobile-first: 44px min tap targets, 16px body text, sticky header
- Build fails on invalid data (file path + field name in error)

---

### Task 1: Scaffold Astro project

**Files:**
- Create: `site/package.json`
- Create: `site/astro.config.mjs`
- Create: `site/tsconfig.json`
- Create: `site/src/styles/global.css`
- Create: `site/src/layouts/BaseLayout.astro`
- Create: `.nvmrc`
- Create: `.gitignore`

**Interfaces:**
- Produces: `site/` Astro project with `pnpm dev`, `pnpm build`, `pnpm test` scripts; `BaseLayout.astro` with `title` prop used by all pages

- [ ] **Step 1: Create `.nvmrc` and `.gitignore`**

`.nvmrc`:
```
20
```

`.gitignore`:
```
node_modules/
dist/
.astro/
```

- [ ] **Step 2: Create `site/package.json`**

```json
{
  "name": "saint-for-that",
  "type": "module",
  "version": "0.1.0",
  "engines": { "node": ">=20.0.0" },
  "packageManager": "pnpm@9",
  "scripts": {
    "dev": "astro dev",
    "build": "pnpm run validate && astro check && astro build && pagefind --site dist",
    "preview": "astro preview",
    "validate": "tsx ../scripts/validate-saints.ts",
    "import": "tsx ../scripts/import.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "astro": "^5.0.0",
    "@astrojs/sitemap": "^3.2.0",
    "pagefind": "^1.1.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@tailwindcss/typography": "^0.5.15",
    "tailwindcss": "^4.0.0",
    "vitest": "^2.0.0",
    "tsx": "^4.19.0",
    "@types/node": "^20.0.0"
  }
}
```

- [ ] **Step 3: Create `site/astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://saintforthat.example.com',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
```

- [ ] **Step 4: Create `site/tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 5: Create `site/src/styles/global.css`**

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --font-serif: "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  --font-sans: system-ui, sans-serif;
  --color-brand: #6B2D5C;
  --color-brand-light: #D4A8C7;
}

@utility tap-target {
  min-height: 2.75rem;
  min-width: 2.75rem;
}

@media (prefers-reduced-motion: reduce) {
  * { transition: none !important; animation: none !important; }
}
```

- [ ] **Step 6: Create `site/src/layouts/BaseLayout.astro`**

```astro
---
import '../styles/global.css';
interface Props { title: string; description?: string }
const { title, description = 'Find the saint who intercedes for your need.' } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description} />
    <title>{title} · Saint For That</title>
  </head>
  <body class="bg-white text-zinc-900 antialiased">
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-2">Skip to main content</a>
    <header class="sticky top-0 z-30 h-14 border-b border-zinc-100 bg-white/85 backdrop-blur">
      <div class="mx-auto flex h-full max-w-screen-sm items-center gap-2 px-4 sm:max-w-2xl lg:max-w-5xl lg:px-8">
        <a href="/" class="font-serif text-lg">Saint For That</a>
        <form action="/search" method="get" class="ml-auto flex-1" role="search">
          <label class="sr-only" for="q">Search saints and patronages</label>
          <input id="q" type="search" name="q" placeholder="Search needs, names…"
                 class="h-9 w-full rounded-full border border-zinc-200 bg-zinc-50 px-3 text-sm focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-brand" />
        </form>
      </div>
    </header>
    <main id="main">
      <slot />
    </main>
    <footer class="border-t border-zinc-100 py-8 text-center text-sm text-zinc-600">
      <p>Inspired by <a href="https://www.youtube.com/watch?v=YOUR_SONG_ID" rel="noopener" class="underline">"There Is a Saint for That" by Peter's Barque</a></p>
      <p class="mt-2"><a href="/about" class="underline">About this project</a></p>
    </footer>
  </body>
</html>
```

- [ ] **Step 7: Install and verify**

Run: `cd site && pnpm install && pnpm dev`
Expected: dev server starts, blank page renders with header/footer.

- [ ] **Step 8: Commit**

```bash
git add .nvmrc .gitignore site/
git commit -m "feat: scaffold Astro 5 + Tailwind 4 project"
```

---

### Task 2: Taxonomy + zod schema

**Files:**
- Create: `site/src/lib/taxonomy.ts`
- Create: `site/src/content/config.ts`
- Create: `site/test/schema.test.ts`
- Create: `site/vitest.config.ts`

**Interfaces:**
- Produces: `CATEGORIES` (array of `{ id, label, description }`), `NEED_SYNONYMS` (Record<string, string[]>), `saintSchema` (zod), `Saint` type
- Consumes: nothing (foundation)

- [ ] **Step 1: Create `site/src/lib/taxonomy.ts`**

```ts
export interface Category {
  id: string;
  label: string;
  description: string;
}

export const CATEGORIES: Category[] = [
  { id: 'everyday', label: 'Everyday life', description: 'Lost items, housework, errands, daily needs' },
  { id: 'illness', label: 'Illness & healing', description: 'Diseases, mental health, specific conditions' },
  { id: 'jobs', label: 'Jobs & professions', description: 'Vocations, trades, occupations' },
  { id: 'travel', label: 'Travel & transport', description: 'Travelers, drivers, sailors, aviators' },
  { id: 'persecution', label: 'Persecution & prisoners', description: 'Martyrs, oppressed, prisoners, refugees' },
  { id: 'spiritual', label: 'Spiritual life', description: 'Doubt, conversion, prayer, temptations' },
  { id: 'military', label: 'Military & first responders', description: 'Soldiers, police, firefighters, EMS' },
  { id: 'family', label: 'Children & family', description: 'Children, mothers, fathers, fertility, marriage' },
  { id: 'nature', label: 'Animals & nature', description: 'Pets, ecology, environment, weather' },
  { id: 'special', label: 'Special intentions', description: 'Impossible causes, the dying, the poor' },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as [string, ...string[]];

export const NEED_SYNONYMS: Record<string, string[]> = {
  'lost items': ['lost keys', 'missing things', 'misplaced objects'],
  'anxiety': ['worry', 'stress', 'nervousness'],
  'travelers': ['travel', 'journeys', 'trips'],
  'soldiers': ['military', 'armed forces'],
  'expectant mothers': ['pregnancy', 'childbirth', 'expecting'],
  'impossible causes': ['hopeless causes', 'desperate situations'],
  'students': ['studies', 'exams', 'learning'],
  'sick children': ['sick kids', 'ill children'],
  'mental illness': ['depression', 'mental health'],
  'cancer': ['tumors', 'oncology'],
};

export function categoryLabel(id: string): string {
  return CATEGORIES.find((c) => c.id === id)?.label ?? id;
}
```

- [ ] **Step 2: Create `site/src/content/config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { CATEGORY_IDS } from '../lib/taxonomy';

const patronageSchema = z.object({
  need: z.string().min(1).max(200),
  category: z.enum(CATEGORY_IDS),
});

const imageSchema = z.object({
  url: z.string().url(),
  attribution: z.string().min(1).max(500),
  altText: z.string().min(1).max(300).optional(),
});

export const saintSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case'),
  name: z.string().min(1).max(200),
  feastDay: z.string().regex(/^\d{2}-\d{2}$|^unknown$/, 'feastDay must be MM-DD or "unknown"'),
  canonized: z.string().min(1).max(50).optional(),
  bio: z.string().min(10).max(10000),
  patronages: z.array(patronageSchema).min(1, 'at least one patronage is required'),
  prayer: z.string().min(1).max(2000).optional(),
  image: imageSchema.optional(),
  sources: z.array(z.string().url()).default([]),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
});

export type Saint = z.infer<typeof saintSchema>;

const saints = defineCollection({
  loader: async () => {
    const { readdirSync, readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const dir = join(process.cwd(), '..', 'data', 'saints');
    return readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const raw = readFileSync(join(dir, f), 'utf-8');
        return { id: f.replace('.json', ''), data: JSON.parse(raw) };
      });
  },
  schema: saintSchema,
});

export const collections = { saints };
```

- [ ] **Step 3: Create `site/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
```

- [ ] **Step 4: Write failing schema tests — `site/test/schema.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { saintSchema } from '../src/content/config';

const valid = {
  slug: 'anthony-of-padua',
  name: 'St. Anthony of Padua',
  feastDay: '06-13',
  canonized: '1232',
  bio: 'Anthony of Padua was a Portuguese Catholic priest and friar of the Franciscan Order. He was known for his powerful preaching and expert knowledge of scripture.',
  patronages: [{ need: 'lost items', category: 'everyday' }],
  sources: ['https://en.wikipedia.org/wiki/Anthony_of_Padua'],
};

describe('saintSchema', () => {
  it('accepts a valid saint', () => {
    expect(saintSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects bad slug', () => {
    expect(saintSchema.safeParse({ ...valid, slug: 'Bad Slug!' }).success).toBe(false);
  });

  it('rejects bad feastDay', () => {
    expect(saintSchema.safeParse({ ...valid, feastDay: '13-01' }).success).toBe(false);
  });

  it('accepts unknown feastDay', () => {
    expect(saintSchema.safeParse({ ...valid, feastDay: 'unknown' }).success).toBe(true);
  });

  it('rejects empty patronages', () => {
    expect(saintSchema.safeParse({ ...valid, patronages: [] }).success).toBe(false);
  });

  it('rejects unknown category', () => {
    expect(saintSchema.safeParse({ ...valid, patronages: [{ need: 'lost items', category: 'not-a-category' }] }).success).toBe(false);
  });

  it('rejects non-url source', () => {
    expect(saintSchema.safeParse({ ...valid, sources: ['not-a-url'] }).success).toBe(false);
  });

  it('rejects short bio', () => {
    expect(saintSchema.safeParse({ ...valid, bio: 'too short' }).success).toBe(false);
  });

  it('accepts missing optional fields', () => {
    const { image, prayer, canonized, sources, ...rest } = valid;
    expect(saintSchema.safeParse(rest).success).toBe(true);
  });

  it('accepts draft saint with no sources', () => {
    const { sources, ...rest } = valid;
    expect(saintSchema.safeParse({ ...rest, draft: true }).success).toBe(true);
  });
});
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `cd site && pnpm test`
Expected: FAIL — `src/content/config.ts` does not exist yet.

- [ ] **Step 6: Verify tests pass after creating files**

Run: `cd site && pnpm test`
Expected: PASS — 10 tests green.

- [ ] **Step 7: Commit**

```bash
git add site/src/lib/taxonomy.ts site/src/content/config.ts site/test/schema.test.ts site/vitest.config.ts
git commit -m "feat: taxonomy + zod schema with tests"
```

---

### Task 3: Data validation script

**Files:**
- Create: `scripts/validate-saints.ts`

**Interfaces:**
- Produces: `pnpm run validate` CLI — exits 1 with per-file errors on invalid data
- Consumes: `saintSchema` from `site/src/content/config.ts` (via relative import)

- [ ] **Step 1: Create `scripts/validate-saints.ts`**

```ts
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { saintSchema } from '../site/src/content/config';

const SAINTS_DIR = join(process.cwd(), '..', 'data', 'saints');

function main() {
  let files: string[];
  try {
    files = readdirSync(SAINTS_DIR).filter((f) => f.endsWith('.json'));
  } catch {
    console.error(`No data directory at ${SAINTS_DIR}`);
    process.exit(1);
  }

  const errors: string[] = [];
  const seen = new Map<string, string>();
  let count = 0;

  for (const f of files) {
    const raw = readFileSync(join(SAINTS_DIR, f), 'utf-8');
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      errors.push(`${f}: invalid JSON — ${(e as Error).message}`);
      continue;
    }
    const parsed = saintSchema.safeParse(data);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      errors.push(`${f}: ${issues}`);
      continue;
    }
    const expectedFile = `${parsed.data.slug}.json`;
    if (f !== expectedFile) {
      errors.push(`${f}: filename mismatch (expected ${expectedFile})`);
      continue;
    }
    if (seen.has(parsed.data.slug)) {
      errors.push(`${f}: duplicate slug "${parsed.data.slug}" (also in ${seen.get(parsed.data.slug)})`);
      continue;
    }
    seen.set(parsed.data.slug, f);
    count++;
  }

  if (errors.length) {
    console.error('Data validation failed:\n' + errors.map((e) => `  • ${e}`).join('\n'));
    process.exit(1);
  }
  console.log(`OK ${count} saints valid`);
}

main();
```

- [ ] **Step 2: Verify with empty data dir**

Run: `mkdir -p data/saints && cd site && pnpm run validate`
Expected: `OK 0 saints valid`

- [ ] **Step 3: Verify failure mode**

Run: `echo '{"slug":"x","name":"X"}' > data/saints/bad.json && cd site && pnpm run validate; rm data/saints/bad.json`
Expected: exit 1 with `bad.json: slug: ...` style errors.

- [ ] **Step 4: Commit**

```bash
git add scripts/validate-saints.ts
git commit -m "feat: build-time data validation script"
```

---

### Task 4: Seed essential saints (30)

**Files:**
- Create: `data/saints/*.json` (30 files, listed below)

**Interfaces:**
- Produces: 30 valid saint JSON files; `featured: true` on the 6 homepage saints
- Consumes: `saintSchema` (Task 2), `validate-saints.ts` (Task 3)

- [ ] **Step 1: Create the 30 essential saint files**

For each saint below, create `data/saints/<slug>.json` following this template (fill bio with 2-3 accurate paragraphs from Wikipedia/Catholic Encyclopedia; sources with real URLs):

```json
{
  "slug": "anthony-of-padua",
  "name": "St. Anthony of Padua",
  "feastDay": "06-13",
  "canonized": "1232",
  "bio": "Para 1: birth, era, family, secular life.\n\nPara 2: conversion, key work, miracles.\n\nPara 3: death, legacy, what they're known for today.",
  "patronages": [
    { "need": "lost items", "category": "everyday" },
    { "need": "travelers", "category": "travel" }
  ],
  "prayer": "Optional short public-domain prayer.",
  "image": {
    "url": "https://upload.wikimedia.org/wikipedia/commons/...",
    "attribution": "Artist / source / license",
    "altText": "Portrait of St. Anthony of Padua"
  },
  "sources": ["https://en.wikipedia.org/wiki/Anthony_of_Padua"],
  "featured": true
}
```

The 30 essential saints (slug — name — patronages as `need (category)`):

1. `anthony-of-padua` — St. Anthony of Padua — lost items (everyday), travelers (travel) — **featured**
2. `jude-thaddeus` — St. Jude Thaddeus — impossible causes (special) — **featured**
3. `joseph` — St. Joseph — workers (jobs), fathers (family), home sale (everyday) — **featured**
4. `francis-of-assisi` — St. Francis of Assisi — animals (nature), ecology (nature) — **featured**
5. `michael-the-archangel` — St. Michael the Archangel — protection (spiritual), spiritual warfare (spiritual) — **featured**
6. `dymphna` — St. Dymphna — anxiety (illness), mental illness (illness) — **featured**
7. `christopher` — St. Christopher — travelers (travel), motorists (travel)
8. `blaise` — St. Blaise — throat ailments (illness)
9. `lucy` — St. Lucy — eye diseases (illness)
10. `raphael-the-archangel` — St. Raphael the Archangel — healing (illness), travelers (travel)
11. `peregrine-laziosi` — St. Peregrine Laziosi — cancer (illness)
12. `gerard-majella` — St. Gerard Majella — expectant mothers (family)
13. `cecilia` — St. Cecilia — musicians (jobs)
14. `valentine` — St. Valentine — engaged couples (family)
15. `nicholas-of-myra` — St. Nicholas of Myra — children (family), sailors (travel)
16. `thomas-aquinas` — St. Thomas Aquinas — students (everyday), scholars (jobs)
17. `clare-of-assisi` — St. Clare of Assisi — eye diseases (illness)
18. `florian` — St. Florian — firefighters (military)
19. `sebastian` — St. Sebastian — soldiers (military), plague (illness)
20. `augustine-of-hippo` — St. Augustine of Hippo — conversion (spiritual)
21. `joan-of-arc` — St. Joan of Arc — soldiers (military)
22. `therese-of-lisieux` — St. Thérèse of Lisieux — missions (spiritual)
23. `benedict-of-nursia` — St. Benedict of Nursia — students (everyday)
24. `isidore-the-farmer` — St. Isidore the Farmer — farmers (jobs)
25. `rita-of-cascia` — St. Rita of Cascia — impossible causes (special), difficult marriages (family)
26. `philomena` — St. Philomena — youth (family)
27. `teresa-of-avila` — St. Teresa of Avila — headaches (illness)
28. `patrick` — St. Patrick — missionaries (spiritual)
29. `albert-the-great` — St. Albert the Great — scientists (jobs)
30. `gregory-the-great` — St. Gregory the Great — teachers (everyday)

- [ ] **Step 2: Validate**

Run: `cd site && pnpm run validate`
Expected: `OK 30 saints valid`

- [ ] **Step 3: Commit**

```bash
git add data/saints/
git commit -m "feat: seed 30 essential saints"
```

---

### Task 5: Home page

**Files:**
- Create: `site/src/pages/index.astro`
- Create: `site/src/components/SaintCard.astro`

**Interfaces:**
- Produces: `/` with hero search, category chips, featured saints carousel
- Consumes: `CATEGORIES` (Task 2), content collection (Task 2), `SaintCard` (this task)

- [ ] **Step 1: Create `site/src/components/SaintCard.astro`**

```astro
---
import type { Saint } from '../content/config';
interface Props { saint: Saint; variant?: 'featured' | 'list' }
const { saint, variant = 'list' } = Astro.props;
const needs = saint.patronages.map((p) => p.need).join(' · ');
---
<a href={`/saints/${saint.slug}/`}
   class="block rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
  <div class="flex gap-3">
    {saint.image
      ? <img src={saint.image.url} alt="" loading="lazy" decoding="async"
             class="h-20 w-20 flex-none rounded-xl object-cover" />
      : <div class="h-20 w-20 flex-none rounded-xl bg-zinc-100" aria-hidden="true" />}
    <div class="min-w-0 flex-1">
      <h3 class="font-serif text-base leading-tight">{saint.name}</h3>
      <p class="mt-0.5 text-xs text-zinc-600">Feast {saint.feastDay === 'unknown' ? 'varies' : saint.feastDay}</p>
      <p class="mt-1 truncate text-sm text-zinc-700">{needs}</p>
    </div>
  </div>
</a>
```

- [ ] **Step 2: Create `site/src/pages/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import SaintCard from '../components/SaintCard.astro';
import { CATEGORIES } from '../lib/taxonomy';

const saints = await getCollection('saints');
const featured = saints.filter((s) => s.data.featured && !s.data.draft);
---
<BaseLayout title="What do you need a saint for?">
  <div class="mx-auto max-w-screen-sm px-4 pb-24 pt-4 sm:max-w-2xl lg:max-w-5xl lg:px-8">
    <h1 class="font-serif text-3xl leading-tight text-balance sm:text-4xl">What do you need a saint for?</h1>

    <form action="/search" method="get" class="sticky top-14 z-10 -mx-4 mt-4 bg-white/85 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8" role="search">
      <label class="sr-only" for="hero-q">Search needs, names…</label>
      <input id="hero-q" name="q" type="search" inputmode="search"
             placeholder="Search needs, names…"
             class="h-12 w-full rounded-full border border-zinc-200 pl-4 pr-4 text-base shadow-sm focus-visible:ring-2 focus-visible:ring-brand" />
    </form>

    <section class="mt-6">
      <h2 class="text-lg font-semibold">Browse by need</h2>
      <ul class="mt-3 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <li>
            <a href={`/categories/${c.id}/`}
               class="tap-target inline-flex h-10 items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-brand">
              {c.label}
            </a>
          </li>
        ))}
      </ul>
    </section>

    <section class="mt-8">
      <h2 class="text-lg font-semibold">Featured saints</h2>
      <ul class="mt-3 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none]">
        {featured.map((s) => (
          <li class="w-72 flex-none snap-start">
            <SaintCard saint={s.data} variant="featured" />
          </li>
        ))}
      </ul>
    </section>
  </div>
</BaseLayout>
```

- [ ] **Step 3: Verify**

Run: `cd site && pnpm dev`
Expected: home page renders hero, 10 category chips, 6 featured saint cards.

- [ ] **Step 4: Commit**

```bash
git add site/src/pages/index.astro site/src/components/SaintCard.astro
git commit -m "feat: home page with hero search, categories, featured saints"
```

---

### Task 6: Saints index page

**Files:**
- Create: `site/src/pages/saints/index.astro`

**Interfaces:**
- Produces: `/saints/` alphabetical index grouped by letter
- Consumes: content collection (Task 2), `SaintCard` (Task 5)

- [ ] **Step 1: Create `site/src/pages/saints/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import SaintCard from '../../components/SaintCard.astro';

const saints = (await getCollection('saints'))
  .filter((s) => !s.data.draft)
  .sort((a, b) => a.data.name.localeCompare(b.data.name));

const groups = new Map<string, typeof saints>();
for (const s of saints) {
  const letter = s.data.name.replace(/^St\.?\s*/i, '').charAt(0).toUpperCase();
  if (!groups.has(letter)) groups.set(letter, []);
  groups.get(letter)!.push(s);
}
---
<BaseLayout title="All saints">
  <div class="mx-auto max-w-screen-sm px-4 pb-24 pt-4 sm:max-w-2xl lg:max-w-5xl lg:px-8">
    <h1 class="font-serif text-3xl text-balance">All saints</h1>
    <p class="mt-1 text-sm text-zinc-600">{saints.length} saints</p>
    {[...groups.entries()].map(([letter, list]) => (
      <section class="mt-8">
        <h2 class="text-lg font-semibold">{letter}</h2>
        <ul class="mt-3 space-y-3">
          {list.map((s) => <li><SaintCard saint={s.data} /></li>)}
        </ul>
      </section>
    ))}
  </div>
</BaseLayout>
```

- [ ] **Step 2: Verify**

Run: `cd site && pnpm dev` → visit `/saints/`
Expected: alphabetical groups, 30 cards.

- [ ] **Step 3: Commit**

```bash
git add site/src/pages/saints/index.astro
git commit -m "feat: alphabetical saints index"
```

---

### Task 7: Saint profile page

**Files:**
- Create: `site/src/pages/saints/[slug]/index.astro`

**Interfaces:**
- Produces: `/saints/<slug>/` rich profile with Pagefind attributes
- Consumes: content collection (Task 2), `NEED_SYNONYMS` (Task 2)

- [ ] **Step 1: Create `site/src/pages/saints/[slug]/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import { NEED_SYNONYMS, categoryLabel } from '../../../lib/taxonomy';

export async function getStaticPaths() {
  const saints = await getCollection('saints');
  return saints
    .filter((s) => !s.data.draft)
    .map((s) => ({ params: { slug: s.data.slug }, props: { saint: s.data } }));
}
const { saint } = Astro.props;
const feast = saint.feastDay === 'unknown' ? 'varies' : saint.feastDay;
---
<BaseLayout title={saint.name} description={`${saint.name}: patron of ${saint.patronages.map((p) => p.need).join(', ')}.`}>
  <article class="mx-auto max-w-2xl px-4 pb-24 pt-2" data-pagefind-body>
    <header class="mt-4">
      <h1 class="font-serif text-3xl text-balance sm:text-4xl" data-pagefind-meta="title">{saint.name}</h1>
      <p class="mt-1 text-sm text-zinc-600">
        Feast {feast}{saint.canonized && <> · Canonized {saint.canonized}</>}
      </p>
    </header>

    {saint.image && (
      <figure class="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
        <img src={saint.image.url}
             alt={saint.image.altText ?? `Portrait of ${saint.name}`}
             loading="lazy" decoding="async"
             class="aspect-[4/5] w-full object-contain"
             onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'aspect-[4/5] grid place-items-center text-zinc-400 text-sm',textContent:'Image unavailable'}))" />
        <figcaption class="px-3 py-2 text-xs text-zinc-500">{saint.image.attribution}</figcaption>
      </figure>
    )}

    <section class="mt-6" aria-labelledby="patron">
      <h2 id="patron" class="text-lg font-semibold">Patron of</h2>
      <ul class="mt-2 flex flex-wrap gap-2">
        {saint.patronages.map((p) => (
          <li data-pagefind-filter={`category:${p.category}`} data-pagefind-index-attrs="data-need" data-need={p.need}>
            <a href={`/categories/${p.category}/`}
               class="tap-target inline-flex h-10 items-center rounded-full bg-zinc-100 px-3 text-sm hover:bg-zinc-200 focus-visible:ring-2 focus-visible:ring-brand">
              {p.need}
            </a>
          </li>
        ))}
      </ul>
    </section>

    <section class="mt-6 prose prose-zinc max-w-none font-serif text-lg leading-relaxed">
      <h2>About</h2>
      {saint.bio.split(/\n\n+/).map((p) => <p>{p}</p>)}
    </section>

    <span class="sr-only" data-pagefind-body>
      {saint.patronages.flatMap((p) => [p.need, ...(NEED_SYNONYMS[p.need] ?? [])]).join(', ')}
    </span>

    {saint.prayer && (
      <section id="prayer" class="mt-6 rounded-2xl bg-brand/5 p-5 ring-1 ring-brand/20" data-pagefind-ignore>
        <h2 class="font-serif text-xl">Prayer</h2>
        <p class="mt-2 whitespace-pre-line text-base leading-relaxed">{saint.prayer}</p>
      </section>
    )}

    {saint.sources.length > 0 && (
      <section class="mt-6 border-t border-zinc-200 pt-4 text-sm text-zinc-600" data-pagefind-ignore>
        <h2 class="text-base font-semibold">Sources</h2>
        <ul class="mt-2 space-y-1">
          {saint.sources.map((src) => (
            <li><a href={src} rel="noopener" class="underline break-words">{src}</a></li>
          ))}
        </ul>
      </section>
    )}
  </article>
</BaseLayout>
```

- [ ] **Step 2: Verify**

Run: `cd site && pnpm dev` → visit `/saints/anthony-of-padua/`
Expected: profile renders image, patronages, bio, prayer, sources.

- [ ] **Step 3: Commit**

```bash
git add site/src/pages/saints/[slug]/index.astro
git commit -m "feat: saint profile page with Pagefind attributes"
```

---

### Task 8: Category pages

**Files:**
- Create: `site/src/pages/categories/index.astro`
- Create: `site/src/pages/categories/[category]/index.astro`

**Interfaces:**
- Produces: `/categories/` index + `/categories/<id>/` listing pages
- Consumes: `CATEGORIES` (Task 2), content collection (Task 2), `SaintCard` (Task 5)

- [ ] **Step 1: Create `site/src/pages/categories/index.astro`**

```astro
---
import BaseLayout from '../../layouts/BaseLayout.astro';
import { CATEGORIES } from '../../lib/taxonomy';
---
<BaseLayout title="Browse by need">
  <div class="mx-auto max-w-screen-sm px-4 pb-24 pt-4 sm:max-w-2xl lg:max-w-5xl lg:px-8">
    <h1 class="font-serif text-3xl text-balance">Browse by need</h1>
    <ul class="mt-6 space-y-3">
      {CATEGORIES.map((c) => (
        <li>
          <a href={`/categories/${c.id}/`}
             class="block rounded-2xl border border-zinc-200 bg-white p-4 focus-visible:ring-2 focus-visible:ring-brand">
            <h2 class="font-serif text-lg">{c.label}</h2>
            <p class="mt-1 text-sm text-zinc-600">{c.description}</p>
          </a>
        </li>
      ))}
    </ul>
  </div>
</BaseLayout>
```

- [ ] **Step 2: Create `site/src/pages/categories/[category]/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import SaintCard from '../../../components/SaintCard.astro';
import { CATEGORIES, categoryLabel } from '../../../lib/taxonomy';

export async function getStaticPaths() {
  return CATEGORIES.map((c) => ({ params: { category: c.id } }));
}
const { category } = Astro.params;
const saints = (await getCollection('saints'))
  .filter((s) => !s.data.draft && s.data.patronages.some((p) => p.category === category))
  .sort((a, b) => a.data.name.localeCompare(b.data.name));
const needs = [...new Set(saints.flatMap((s) => s.data.patronages.filter((p) => p.category === category).map((p) => p.need)))].sort();
---
<BaseLayout title={categoryLabel(category)}>
  <div class="mx-auto max-w-screen-sm px-4 pb-24 pt-4 sm:max-w-2xl lg:max-w-5xl lg:px-8">
    <nav class="text-sm" aria-label="Breadcrumb"><a href="/" class="underline">Home</a> › <a href="/categories/" class="underline">Categories</a> › {categoryLabel(category)}</nav>
    <h1 class="mt-2 font-serif text-3xl text-balance">{categoryLabel(category)}</h1>
    <p class="text-sm text-zinc-600">{saints.length} saints</p>

    <ul class="mt-4 flex flex-wrap gap-2">
      {needs.map((n) => (
        <li><a href={`#${n.replace(/\s+/g, '-')}`} class="tap-target inline-flex h-10 items-center rounded-full border border-zinc-200 px-3 text-sm hover:bg-zinc-50">{n}</a></li>
      ))}
    </ul>

    <ul class="mt-6 space-y-3">
      {saints.map((s) => (
        <li id={s.data.patronages.find((p) => p.category === category)?.need.replace(/\s+/g, '-')}>
          <SaintCard saint={s.data} />
        </li>
      ))}
    </ul>
  </div>
</BaseLayout>
```

- [ ] **Step 3: Verify**

Run: `cd site && pnpm dev` → visit `/categories/everyday/`
Expected: breadcrumb, saint count, need chips, saint cards.

- [ ] **Step 4: Commit**

```bash
git add site/src/pages/categories/
git commit -m "feat: category browse pages"
```

---

### Task 9: Search page

**Files:**
- Create: `site/src/pages/search.astro`

**Interfaces:**
- Produces: `/search/` with PagefindUI bound to input and results container
- Consumes: Pagefind index in `dist/pagefind/` (generated by build)

- [ ] **Step 1: Create `site/src/pages/search.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="Search saints">
  <div class="mx-auto max-w-2xl px-4 pb-24 pt-4">
    <div class="sticky top-14 z-10 -mx-4 bg-white/85 px-4 py-3 backdrop-blur">
      <input id="pagefind-search" type="search" inputmode="search" autofocus
             placeholder="What do you need a saint for?"
             aria-label="Search saints and patronages"
             class="h-12 w-full rounded-full border border-zinc-200 px-4 text-base focus-visible:ring-2 focus-visible:ring-brand" />
    </div>
    <div id="pagefind-results" class="mt-4" aria-live="polite"></div>
  </div>

  <link rel="stylesheet" href="/pagefind/pagefind-ui.css" />
  <script>
    import '/pagefind/pagefind-ui.js';
    window.addEventListener('DOMContentLoaded', () => {
      new PagefindUI({
        element: '#pagefind-results',
        input: '#pagefind-search',
        showImages: false,
        excerptLength: 12,
      });
    });
  </script>
</BaseLayout>
```

- [ ] **Step 2: Verify (search requires a build)**

Run: `cd site && pnpm run build && pnpm preview` → visit `/search/`, type "lost keys"
Expected: results include St. Anthony of Padua (synonym "lost keys" indexed via sr-only span).

- [ ] **Step 3: Commit**

```bash
git add site/src/pages/search.astro
git commit -m "feat: Pagefind search page"
```

---

### Task 10: About page

**Files:**
- Create: `site/src/pages/about.astro`

**Interfaces:**
- Produces: `/about/` with project story and song link
- Consumes: nothing

- [ ] **Step 1: Create `site/src/pages/about.astro`**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="About">
  <div class="mx-auto max-w-2xl px-4 pb-24 pt-4">
    <h1 class="font-serif text-3xl text-balance">About Saint For That</h1>
    <div class="prose prose-zinc mt-6 max-w-none">
      <p>Saint For That is a searchable index of Catholic saints: who they were, what they are known to intercede for, and their stories.</p>
      <p>This project was inspired by the song <a href="https://www.youtube.com/watch?v=YOUR_SONG_ID" rel="noopener">"There Is a Saint for That" by Peter's Barque</a>.</p>
      <h2>Data sources</h2>
      <p>Saint biographies are compiled from public sources including Wikipedia, the Catholic Encyclopedia, and CatholicSaints.info. Images are public-domain works from Wikimedia Commons, with attribution on each profile page.</p>
      <h2>Corrections</h2>
      <p>Found an error? Open an issue on the project repository.</p>
    </div>
  </div>
</BaseLayout>
```

- [ ] **Step 2: Verify**

Run: `cd site && pnpm dev` → visit `/about/`
Expected: about page with song link.

- [ ] **Step 3: Commit**

```bash
git add site/src/pages/about.astro
git commit -m "feat: about page with song attribution"
```

---

### Task 11: Smoke tests

**Files:**
- Create: `site/test/smoke.test.ts`

**Interfaces:**
- Produces: `pnpm test` exercises full pipeline: build → preview → fetch all routes → Pagefind WASM search
- Consumes: `data/saints/*.json` (Task 4), build output

- [ ] **Step 1: Create `site/test/smoke.test.ts`**

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, exec, type ChildProcess } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';

const PORT = 4321;
const BASE = `http://127.0.0.1:${PORT}`;
let server: ChildProcess | undefined;

function run(cmd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(cmd, { stdio: 'inherit' }, (err) => (err ? reject(err) : resolve()));
  });
}

async function startPreview(): Promise<void> {
  server = spawn('pnpm', ['exec', 'astro', 'preview', '--port', String(PORT)], { stdio: 'pipe' });
  await new Promise((r) => setTimeout(r, 3000));
}

async function status(path: string): Promise<number> {
  const res = await fetch(BASE + path, { redirect: 'manual' });
  return res.status;
}

describe('build smoke', () => {
  beforeAll(async () => {
    await run('pnpm run build');
    await startPreview();
  }, 180_000);

  afterAll(() => server?.kill());

  it('home returns 200', async () => {
    expect(await status('/')).toBe(200);
  });

  it('search page returns 200', async () => {
    expect(await status('/search/')).toBe(200);
  });

  it('saints index returns 200', async () => {
    expect(await status('/saints/')).toBe(200);
  });

  it('categories index returns 200', async () => {
    expect(await status('/categories/')).toBe(200);
  });

  it('about returns 200', async () => {
    expect(await status('/about/')).toBe(200);
  });

  it('sitemap returns 200', async () => {
    expect(await status('/sitemap-index.xml')).toBe(200);
  });

  it('every saint page returns 200', async () => {
    const files = [];
    for await (const f of glob('../data/saints/*.json')) files.push(f);
    const saints = await Promise.all(files.map(async (f) => JSON.parse(await readFile(f, 'utf8'))));
    const results = await Promise.all(
      saints.map(async (s) => ({ slug: s.slug, status: await status(`/saints/${s.slug}/`) })),
    );
    const bad = results.filter((r) => r.status !== 200);
    expect(bad, 'non-200 saint pages: ' + bad.map((r) => r.slug).join(', ')).toEqual([]);
  }, 60_000);

  it('every category page returns 200', async () => {
    const { CATEGORIES } = await import('../src/lib/taxonomy');
    const results = await Promise.all(
      CATEGORIES.map(async (c) => ({ id: c.id, status: await status(`/categories/${c.id}/`) })),
    );
    const bad = results.filter((r) => r.status !== 200);
    expect(bad, 'non-200 category pages: ' + bad.map((r) => r.id).join(', ')).toEqual([]);
  });

  it('pagefind index was generated', async () => {
    expect(await status('/pagefind/pagefind.js')).toBe(200);
  });

  it('searching "lost keys" returns Anthony', async () => {
    const res = await fetch(BASE + '/pagefind/pagefind.js');
    expect(res.status).toBe(200);
    const html = await (await fetch(BASE + '/saints/anthony-of-padua/')).text();
    expect(html).toContain('lost keys');
    expect(html).toContain('data-need="lost items"');
  });
});
```

- [ ] **Step 2: Run tests**

Run: `cd site && pnpm test`
Expected: all tests PASS (build takes ~30-60s).

- [ ] **Step 3: Commit**

```bash
git add site/test/smoke.test.ts
git commit -m "test: build smoke tests for all routes + search index"
```

---

### Task 12: Import script

**Files:**
- Create: `scripts/import.ts`

**Interfaces:**
- Produces: `pnpm run import -- --csv <file> [--dry-run]` CLI for future external imports
- Consumes: `saintSchema` (Task 2)

- [ ] **Step 1: Create `scripts/import.ts`**

```ts
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { saintSchema } from '../site/src/content/config';

const args = parseArgs({
  options: {
    csv: { type: 'string' },
    json: { type: 'string' },
    out: { type: 'string', default: join(process.cwd(), '..', 'data', 'saints') },
    'dry-run': { type: 'boolean', default: false },
  },
});

interface ImportRow {
  slug?: string;
  name: string;
  feastDay: string;
  canonized?: string;
  bio: string;
  patronages: string;
  prayer?: string;
  imageUrl?: string;
  imageAttribution?: string;
  imageAltText?: string;
  sources?: string;
  featured?: string;
}

function parsePatronages(raw: string): Array<{ need: string; category: string }> {
  try {
    return JSON.parse(raw);
  } catch {
    return raw.split(/;|\n/).filter(Boolean).map((pair) => {
      const [need, category] = pair.split('|').map((s) => s.trim());
      return { need, category };
    });
  }
}

function parseCsv(raw: string): ImportRow[] {
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const cells = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((c) => c.replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h.trim()] = cells[i] ?? ''));
    return row as unknown as ImportRow;
  });
}

function rowToSaint(row: ImportRow): unknown {
  return {
    slug: row.slug || row.name.toLowerCase().replace(/^st\.?\s*/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    name: row.name,
    feastDay: row.feastDay,
    canonized: row.canonized || undefined,
    bio: row.bio,
    patronages: parsePatronages(row.patronages),
    prayer: row.prayer || undefined,
    image: row.imageUrl
      ? { url: row.imageUrl, attribution: row.imageAttribution ?? 'Wikimedia Commons', altText: row.imageAltText || undefined }
      : undefined,
    sources: (row.sources ?? '').split(/\n/).filter(Boolean),
    featured: row.featured === 'true',
  };
}

function main() {
  const inputPath = args.values.csv || args.values.json;
  if (!inputPath) {
    console.error('Provide --csv <file> or --json <file>');
    process.exit(1);
  }
  if (!existsSync(args.values.out)) mkdirSync(args.values.out, { recursive: true });

  const raw = readFileSync(inputPath, 'utf-8');
  const rows: ImportRow[] = args.values.csv ? parseCsv(raw) : JSON.parse(raw);

  let created = 0, updated = 0, failed = 0;
  for (const row of rows) {
    const parsed = saintSchema.safeParse(rowToSaint(row));
    if (!parsed.success) {
      console.error(`SKIP "${row.name}":`, parsed.error.flatten().fieldErrors);
      failed++;
      continue;
    }
    const outFile = join(args.values.out, `${parsed.data.slug}.json`);
    const existed = existsSync(outFile);
    if (args.values['dry-run']) {
      console.log(`[dry-run] would ${existed ? 'update' : 'create'} ${parsed.data.slug}.json`);
      continue;
    }
    writeFileSync(outFile, JSON.stringify(parsed.data, null, 2) + '\n');
    existed ? updated++ : created++;
  }
  console.log(`Done: ${created} created, ${updated} updated, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main();
```

- [ ] **Step 2: Verify with a dry run**

Run: `echo 'name,feastDay,bio,patronages\n"St. Test Saint","01-01","A test bio that is long enough to pass validation.","lost items|everyday"' > /tmp/test-import.csv && cd site && pnpm run import -- --csv /tmp/test-import.csv --dry-run`
Expected: `[dry-run] would create test-saint.json`

- [ ] **Step 3: Commit**

```bash
git add scripts/import.ts
git commit -m "feat: CSV/JSON import script"
```

---

### Task 13: CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces: GitHub Actions pipeline: validate → test → build artifact
- Consumes: all prior tasks

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```yaml
name: ci
on: [push, pull_request]
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
        working-directory: site
      - run: pnpm run validate
        working-directory: site
      - run: pnpm test
        working-directory: site
      - uses: actions/upload-artifact@v4
        with: { name: site, path: site/dist }
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: validate + test + artifact pipeline"
```

---

### Task 14: Curate remaining 170 saints

**Files:**
- Create: `data/saints/*.json` (170 more files)

**Interfaces:**
- Produces: 200 total saints, category coverage per targets below
- Consumes: `saintSchema` (Task 2), `validate-saints.ts` (Task 3)

- [ ] **Step 1: Curate in batches of 25**

Work in 7 batches of ~25 saints. For each batch: write JSON files (same template as Task 4), then run `cd site && pnpm run validate` and fix until green, then commit.

Category targets (sum = 170 remaining):

| Category | Remaining target |
|---|---|
| everyday | 45 |
| illness | 35 |
| jobs | 25 |
| travel | 8 |
| persecution | 12 |
| spiritual | 15 |
| military | 6 |
| family | 8 |
| nature | 4 |
| special | 12 |

- [ ] **Step 2: Batch 1 — everyday needs (25 saints)**

Suggested: St. Zita (housekeepers), St. Martha (cooks), St. Lawrence (cooks), St. Honoré (bakers), St. Elizabeth of Hungary (bakers), St. Fiacre (gardeners), St. Gabriel the Archangel (postal workers), St. Francis de Sales (writers), St. John Bosco (students), St. Catherine of Alexandria (students), St. Joseph of Cupertino (students), St. Expeditus (urgent causes), St. Homobonus (merchants), St. Nicholas of Tolentino (the poor), St. Martin de Porres (barbers), St. Crispin (cobblers), St. Eligius (metalworkers), St. Dunstan (goldsmiths), St. Barbara (architects), St. Thomas More (lawyers), St. Ivo of Kermartin (lawyers), St. Raymond of Penyafort (lawyers), St. Genesius (actors), St. Vitus (dancers), St. John the Baptist (tailors).

- [ ] **Step 3: Batch 2 — illness & healing (25 saints)**

Suggested: St. Agatha (breast disease), St. Apollonia (dentistry), St. Camillus de Lellis (nursing), St. John of God (hospitals), St. Roch (plague), St. Rosalia (plague), St. Giles (leprosy), St. Lazarus (leprosy), St. Lidwina (chronic pain), St. Gemma Galgani (back pain), St. Erasmus (stomach ailments), St. Timothy (stomach ailments), St. Pantaleon (physicians), St. Luke (physicians), St. Cosmas and Damian (physicians), St. Bernadette (the sick), St. Lourdes (the sick), St. Margaret of Antioch (childbirth), St. Anne (mothers), St. Monica (mothers), St. Elizabeth Ann Seton (widows), St. Frances of Rome (widows), St. Juliana Falconieri (sick), St. Odilia (blindness), St. Lucy of Syracuse (blindness).

- [ ] **Step 4: Batch 3 — jobs & professions (25 saints)**

Suggested: St. Matthew (accountants), St. Bernardino (advertisers), St. Ambrose (beekeepers), St. Arnold (brewers), St. Nicholas (brewers), St. Adrian (butchers), St. Bartholomew (tanners), St. Catherine of Bologna (artists), St. Luke (artists), St. Cecilia (musicians), St. Gregory (musicians), St. Isidore of Seville (computer users), St. Bona (flight attendants), St. Joseph of Cupertino (aviators), St. Therese (aviators), St. Brendan (sailors), St. Elmo (sailors), St. Peter (fishermen), St. Andrew (fishermen), St. Barbara (miners), St. Kinga (miners), St. Florian (chimney sweeps), St. Wenceslaus (brewers), St. Hubert (hunters), St. Eustace (hunters).

- [ ] **Step 5: Batch 4 — travel, persecution, military (25 saints)**

Suggested: St. Raphael (travelers), St. Julian the Hospitaller (innkeepers), St. Frances Xavier Cabrini (immigrants), St. Toribio Romo (migrants), St. Maximilian Kolbe (prisoners), St. Dismas (prisoners), St. Leonard of Noblac (prisoners), St. Peter Claver (slaves), St. Josephine Bakhita (victims of trafficking), St. Oscar Romero (the oppressed), St. Paul Miki (martyrs), St. Thomas Becket (martyrs), St. George (soldiers), St. Martin of Tours (soldiers), St. Maurice (soldiers), St. Michael (police), St. John of Capistrano (military chaplains), St. Barbara (artillerymen), St. Adrian of Nicomedia (arms dealers), St. Sebastian (athletes), St. Christopher (motorists), St. Frances of Rome (motorists), St. Elijah (aviators), St. Joseph of Cupertino (air travelers), St. Our Lady of Loreto (aviators).

- [ ] **Step 6: Batch 5 — spiritual, family (25 saints)**

Suggested: St. Ignatius of Loyola (retreats), St. Teresa of Calcutta (the poor), St. Vincent de Paul (charity), St. Elizabeth of Hungary (charity), St. John Vianney (priests), St. Charles Borromeo (seminarians), St. Aloysius Gonzaga (youth), St. Maria Goretti (youth), St. Dominic Savio (youth), St. Agnes (girls), St. Catherine of Siena (single women), St. Rose of Lima (single women), St. Zita (domestic workers), St. Anne (grandmothers), St. Joachim (grandfathers), St. Joseph (fathers), St. Monica (mothers), St. Gerard (mothers), St. Gianna Beretta Molla (mothers), St. Philomena (children), St. Nicholas (children), St. John Bosco (children), St. Therese (children), St. Anthony (children), St. Raymond Nonnatus (expectant mothers).

- [ ] **Step 7: Batch 6 — nature, special, remaining (25 saints)**

Suggested: St. Francis (animals), St. Anthony the Abbot (animals), St. Blaise (animals), St. Martin de Porres (animals), St. Medard (weather), St. Swithin (weather), St. Barbara (storms), St. Emygdius (earthquakes), St. Agatha (volcanoes), St. Florian (fires), St. Lawrence (fires), St. Jude (impossible causes), St. Rita (impossible causes), St. Expeditus (urgent causes), St. Anthony (lost items), St. Joseph (home sale), St. Thérèse (missions), St. Francis Xavier (missions), St. Patrick (missionaries), St. Boniface (missionaries), St. Augustine of Canterbury (missionaries), St. Cyril and Methodius (missionaries), St. Damien of Molokai (lepers), St. Marianne Cope (lepers), St. Katharine Drexel (Native Americans).

- [ ] **Step 8: Batch 7 — fill category gaps (20 saints)**

Run `cd site && pnpm run validate` and a quick count per category, then curate 20 more saints to reach the targets above. Suggested pool: St. Scholastica, St. Benedict, St. Bernard of Clairvaux, St. Dominic, St. Francis de Sales, St. Jane Frances de Chantal, St. Louise de Marillac, St. Vincent Ferrer, St. Anthony Mary Claret, St. John Neumann, St. Peter Canisius, St. Robert Bellarmine, St. Lawrence of Brindisi, St. Alphonsus Liguori, St. John of the Cross, St. Teresa Benedicta (Edith Stein), St. Faustina, St. Padre Pio, St. John Paul II, St. Mother Teresa.

- [ ] **Step 9: Final verification**

Run: `cd site && pnpm run validate && pnpm test`
Expected: `OK 200 saints valid`, all smoke tests pass.

- [ ] **Step 10: Commit**

```bash
git add data/saints/
git commit -m "feat: complete 200-saint dataset"
```

---

### Task 15: Final review & deploy prep

**Files:**
- Create: `README.md`

**Interfaces:**
- Produces: deployable static site + docs
- Consumes: everything

- [ ] **Step 1: Create `README.md`**

```markdown
# Saint For That

A searchable website of Catholic saints: who they are, what they intercede
for, and their life story. Inspired by "There Is a Saint for That" by
Peter's Barque.

## Development

- Node 20+, pnpm 9
- `cd site && pnpm install`
- `pnpm dev` — dev server (search requires a build)
- `pnpm run build` — validate data, build site, generate Pagefind index
- `pnpm preview` — serve the built site (search works here)
- `pnpm test` — schema tests + full build smoke tests

## Data

Saints live in `data/saints/*.json`, one file per saint. Schema is
validated at build time (zod). See `site/src/content/config.ts`.

## Deploy

`site/dist/` is a fully static site. Host anywhere (GitHub Pages,
Cloudflare Pages, VPS).
```

- [ ] **Step 2: Final full run**

Run: `cd site && pnpm test`
Expected: all green.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README with dev and deploy instructions"
```
