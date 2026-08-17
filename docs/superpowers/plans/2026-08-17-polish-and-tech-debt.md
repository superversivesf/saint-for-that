# Polish & Tech Debt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix content quality (missing images), add 4 UX polish features (no-results hint, need-count badges, related saints, A-Z index), and clear 3 tech-debt items (redundant synonyms, trailing newlines, upper-bound check).

**Architecture:** All work is in the existing Astro static site. No new dependencies. New page at `/saints/`. Modifications to 4 existing pages, 1 script, 1 test, 1 lib file. Image fetch is a one-shot script run.

**Tech Stack:** Astro 5, Tailwind 4, Pagefind 1.5, vitest, zod, tsx, Node 20, pnpm 9.15.0

## Global Constraints

- No comments in code
- Warm colour scheme: parchment `#FAF6EE`, deep red `#8C2F2F`, gold `#C9A227`, ink `#3E2F23`
- NEED_SYNONYMS: `Record<string, string[]>`, 5-10 synonyms per need, lowercase, no duplicates, no empty arrays
- Synonyms must NOT include the key itself (no redundant synonym==key)
- Build script: `pnpm run validate && tsx ../scripts/check-synonyms.ts && astro check && astro build && pagefind --site dist`
- All pages use `BaseLayout.astro` and the container pattern `mx-auto max-w-screen-sm px-4 pb-24 pt-4 sm:max-w-2xl lg:max-w-5xl lg:px-8`
- SaintCard.astro signature: `{ saint: Saint; variant?: 'featured' | 'list' }`
- Saint type imported from `../content/config` (re-exports from `../lib/schema`)
- Content collection accessed via `getCollection('saints')`, filter drafts with `!s.data.draft`
- Existing 29 tests must stay green; final test count 31 (29 + 2 new synonym tests)

---

### Task 1: Tech debt cleanup (synonyms, newlines, upper-bound check)

**Files:**
- Modify: `site/src/lib/taxonomy.ts` (remove redundant synonym==key from ~19 entries)
- Modify: `scripts/check-synonyms.ts` (add upper-bound check, add trailing newline)
- Modify: `site/test/synonyms.test.ts` (add upper-bound test, add trailing newline)

**Interfaces:**
- Consumes: `NEED_SYNONYMS` from `site/src/lib/taxonomy.ts`
- Produces: `check-synonyms.ts` now exits 1 if any need has > 10 synonyms; test suite has 5 synonym tests

- [ ] **Step 1: Write the failing upper-bound test**

Add to `site/test/synonyms.test.ts`, inside the existing `describe` block, after the last `it()`:

```typescript
  it('has no more than 10 synonyms per need', () => {
    for (const [need, syns] of Object.entries(NEED_SYNONYMS)) {
      expect(syns.length, `${need} has ${syns.length} synonyms (max 10)`).toBeLessThanOrEqual(10);
    }
  });

  it('no synonym equals its key', () => {
    for (const [need, syns] of Object.entries(NEED_SYNONYMS)) {
      expect(syns, `${need} contains itself as a synonym`).not.toContain(need);
    }
  });
```

Ensure the file ends with a trailing newline.

- [ ] **Step 2: Run tests to verify which fail**

Run: `cd site && pnpm exec vitest run test/synonyms.test.ts`
Expected: The `no synonym equals its key` test FAILS (19 entries have redundant synonym==key). The `no more than 10` test PASSES (all entries already have ≤10).

- [ ] **Step 3: Remove redundant synonym==key entries from taxonomy.ts**

In `site/src/lib/taxonomy.ts`, scan every `NEED_SYNONYMS` entry. For each key, remove any array element that exactly equals the key string. Examples to fix (not exhaustive — check all 152 entries):
- `'blindness': [..., 'blindness']` → remove `'blindness'`
- `'cancer': [..., 'cancer']` → no, check: only remove if the synonym string exactly equals the key

Write a quick one-liner to find them all first:
```bash
cd site && pnpm exec tsx -e "
import { NEED_SYNONYMS } from './src/lib/taxonomy';
for (const [k, v] of Object.entries(NEED_SYNONYMS)) {
  if (v.includes(k)) console.log(k);
}
"
```
Edit each flagged entry to remove the redundant synonym. Ensure all arrays still have ≥5 entries after removal (if any would drop below 5, add a relevant synonym to compensate).

- [ ] **Step 4: Add upper-bound check to check-synonyms.ts**

In `scripts/check-synonyms.ts`, inside the `for (const need of needs)` loop, after the `else if (syns.length < 5)` block, add:

```typescript
    else if (syns.length > 10) {
      errors.push(`need "${need}" has ${syns.length} synonyms (max 10)`);
    }
```

Ensure the file ends with a trailing newline.

- [ ] **Step 5: Run all tests + check to verify everything passes**

Run: `cd site && pnpm exec vitest run test/synonyms.test.ts`
Expected: 5/5 pass

Run: `cd site && pnpm exec tsx ../scripts/check-synonyms.ts`
Expected: `OK 152 needs covered`

- [ ] **Step 6: Run full test suite to confirm no regressions**

Run: `cd site && pnpm test`
Expected: 30 tests pass (was 29, +1 upper-bound, +1 no-synonym-equals-key — but the no-synonym-equals-key test is the 6th test in synonyms.test.ts... actually count: original 4 + 2 new = 6 synonym tests. Total was 29, now 31.)

Correction: the original synonyms.test.ts has 4 tests. Adding 2 → 6 synonym tests. Total suite was 29 → 31 tests.

Expected: 31 tests pass.

- [ ] **Step 7: Commit**

```bash
git add site/src/lib/taxonomy.ts scripts/check-synonyms.ts site/test/synonyms.test.ts
git commit -m "fix: remove redundant synonyms, add upper-bound check, trailing newlines"
```

---

### Task 2: Re-run image fetcher for 26 missing saints

**Files:**
- Modify: up to 26 files in `data/saints/*.json` (those lacking `image` field)

**Interfaces:**
- Consumes: `scripts/fetch-images.ts` (existing, supports `--force` flag)
- Produces: updated saint JSON files with `image: { url, altText, attribution }` field

- [ ] **Step 1: Identify saints missing images**

Run:
```bash
cd /home/jason/Repos/saint-for-that
for f in data/saints/*.json; do
  if ! grep -q '"image"' "$f"; then basename "$f" .json; fi
done
```
Expected: 26 slugs printed.

- [ ] **Step 2: Run the image fetcher**

Run: `cd site && pnpm exec tsx ../scripts/fetch-images.ts --force`
Expected: Script queries Wikipedia API for each saint (using the Wikipedia URL in each saint's `sources` array), downloads images, writes `image` field to JSON. Some saints may still lack images if Wikipedia has none — that's graceful.

- [ ] **Step 3: Verify image count increased**

Run: `grep -l '"image"' data/saints/*.json | wc -l`
Expected: > 175 (was 175 before). Some of the 26 may still be imageless.

- [ ] **Step 4: Validate saints (schema check)**

Run: `cd site && pnpm run validate`
Expected: `OK 201 saints valid` (validates that new image fields pass zod schema)

- [ ] **Step 5: Commit**

```bash
git add data/saints/*.json
git commit -m "feat: fetch images for 26 saints missing images"
```

---

### Task 3: Need-count badges on home page category chips

**Files:**
- Modify: `site/src/pages/index.astro`

**Interfaces:**
- Consumes: `CATEGORIES` from `../lib/taxonomy`, `getCollection('saints')`
- Produces: Home page category chips now show `<span class="badge">{count}</span>`

- [ ] **Step 1: Add server-side count computation**

In `site/src/pages/index.astro`, in the frontmatter section, after the line `const featured = saints.filter((s) => s.data.featured && !s.data.draft);`, add:

```typescript
const categoryCounts = CATEGORIES.map((c) => ({
  ...c,
  count: saints.filter((s) => !s.data.draft && s.data.patronages.some((p) => p.category === c.id)).length,
}));
```

- [ ] **Step 2: Update the category chips to use categoryCounts and render badges**

In the same file, find the section:
```astro
    <section class="mt-6">
      <h2 class="text-lg font-semibold">Browse by need</h2>
      <ul class="mt-3 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <li>
            <a href={`/categories/${c.id}/`}
               class="tap-target inline-flex h-10 items-center rounded-full border border-line bg-white px-4 text-sm font-medium text-brand active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-brand">
              {c.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
```

Replace `CATEGORIES.map` with `categoryCounts.map`, and add the badge span inside the `<a>` tag, after `{c.label}`:

```astro
    <section class="mt-6">
      <h2 class="text-lg font-semibold">Browse by need</h2>
      <ul class="mt-3 flex flex-wrap gap-2">
        {categoryCounts.map((c) => (
          <li>
            <a href={`/categories/${c.id}/`}
               class="tap-target inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-medium text-brand active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-brand">
              {c.label}
              <span class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold/20 px-1.5 text-xs font-semibold text-gold">{c.count}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
```

- [ ] **Step 3: Build and verify**

Run: `cd site && pnpm run build`
Expected: Build succeeds. Check `dist/index.html` for the badge spans.

Run: `grep -o 'bg-gold/20[^"]*' dist/index.html | head -3`
Expected: 3 badge class strings printed (confirms badges rendered).

- [ ] **Step 4: Commit**

```bash
git add site/src/pages/index.astro
git commit -m "feat: need-count badges on home page category chips"
```

---

### Task 4: "No results" hint on search page

**Files:**
- Modify: `site/src/pages/search.astro`

**Interfaces:**
- Consumes: PagefindUI (existing, renders into `#pagefind-results`)
- Produces: A styled hint shown when Pagefind shows no results

- [ ] **Step 1: Add MutationObserver to detect empty results and inject hint**

In `site/src/pages/search.astro`, find the existing `<script is:inline>` block:

```javascript
    window.addEventListener('DOMContentLoaded', () => {
      const params = new URLSearchParams(window.location.search);
      const query = params.get('q') ?? '';
      const input = document.getElementById('pagefind-search');
      if (query && input) input.value = query;
      const ui = new PagefindUI({
        element: '#pagefind-results',
        input: '#pagefind-search',
        showImages: true,
        excerptLength: 12,
        openFilters: ['category'],
      });
      if (query) ui.triggerSearch(query);
    });
```

Add a MutationObserver after the `if (query) ui.triggerSearch(query);` line, still inside the `DOMContentLoaded` listener:

```javascript
      const resultsContainer = document.getElementById('pagefind-results');
      if (resultsContainer) {
        const hintId = 'no-results-hint';
        const observer = new MutationObserver(() => {
          const existing = document.getElementById(hintId);
          const hasNoResults = resultsContainer.querySelector('.pagefind-ui__no-results') ||
            (resultsContainer.textContent && resultsContainer.textContent.includes('No results') &&
             resultsContainer.querySelectorAll('.pagefind-ui__result').length === 0);
          if (hasNoResults && !existing) {
            const hint = document.createElement('div');
            hint.id = hintId;
            hint.className = 'mt-4 rounded-2xl border border-line bg-parchment-deep p-4 text-sm text-ink-soft';
            hint.innerHTML = 'Try a synonym — e.g. <strong>lost wallet</strong> for lost items, or <a href="/" class="text-gold underline">browse categories</a>.';
            resultsContainer.appendChild(hint);
          } else if (!hasNoResults && existing) {
            existing.remove();
          }
        });
        observer.observe(resultsContainer, { childList: true, subtree: true, characterData: true });
      }
```

- [ ] **Step 2: Build and verify**

Run: `cd site && pnpm run build`
Expected: Build succeeds.

Run: `grep -c 'no-results-hint' dist/search/index.html`
Expected: 1 (the hint ID appears in the built JS).

- [ ] **Step 3: Commit**

```bash
git add site/src/pages/search.astro
git commit -m "feat: no-results hint on search page"
```

---

### Task 5: Related saints section on profile pages

**Files:**
- Modify: `site/src/pages/saints/[slug]/index.astro`

**Interfaces:**
- Consumes: `getCollection('saints')`, `SaintCard.astro` (existing component, `{ saint: Saint, variant?: 'featured' | 'list' }`)
- Produces: "Other saints for [need]" sections at bottom of profile pages

- [ ] **Step 1: Add related saints computation to frontmatter**

In `site/src/pages/saints/[slug]/index.astro`, the current frontmatter is:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import { NEED_SYNONYMS } from '../../../lib/taxonomy';

export async function getStaticPaths() {
  const saints = await getCollection('saints');
  return saints
    .filter((s) => !s.data.draft)
    .map((s) => ({ params: { slug: s.data.slug }, props: { saint: s.data } }));
}
const { saint } = Astro.props;
const feast = saint.feastDay === 'unknown' ? 'varies' : saint.feastDay;
---
```

Replace with (add `SaintCard` import, fetch all saints in `getStaticPaths` and pass as prop, compute related groups):

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../../layouts/BaseLayout.astro';
import SaintCard from '../../../components/SaintCard.astro';
import { NEED_SYNONYMS } from '../../../lib/taxonomy';

export async function getStaticPaths() {
  const saints = await getCollection('saints');
  const published = saints.filter((s) => !s.data.draft);
  return published.map((s) => ({
    params: { slug: s.data.slug },
    props: { saint: s.data, allSaints: published.map((p) => p.data) },
  }));
}
const { saint, allSaints } = Astro.props;
const feast = saint.feastDay === 'unknown' ? 'varies' : saint.feastDay;

const relatedGroups = saint.patronages
  .slice(0, 2)
  .map((p) => ({
    need: p.need,
    saints: allSaints
      .filter((s) => s.slug !== saint.slug && s.patronages.some((sp) => sp.need === p.need))
      .slice(0, 4),
  }))
  .filter((g) => g.saints.length > 0);
---
```

- [ ] **Step 2: Add related saints section to the template**

In the same file, find the closing `</div>` that ends `<div class="lg:order-1">` (the left column). Right before that closing `</div>`, after the sources section, add:

```astro
        {relatedGroups.length > 0 && (
          <section class="mt-8" aria-labelledby="related">
            <h2 id="related" class="text-lg font-semibold">Other saints to pray to</h2>
            {relatedGroups.map((group) => (
              <div class="mt-4">
                <h3 class="font-serif text-base text-brand">For {group.need}</h3>
                <ul class="mt-2 grid gap-3 sm:grid-cols-2">
                  {group.saints.map((s) => (
                    <li><SaintCard saint={s} /></li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        )}
```

- [ ] **Step 3: Build and verify**

Run: `cd site && pnpm run build`
Expected: Build succeeds, 201 saint pages generated.

Run: `grep -c 'Other saints to pray to' dist/saints/anthony-of-padua/index.html`
Expected: 1 (Anthony has the "lost items" need which is shared with other saints).

Run: `grep -c 'Other saints to pray to' dist/saints/dismas/index.html`
Expected: 0 or 1 (Dismas is the only saint for "prisoners" — if no other saint shares the need, the section is skipped).

- [ ] **Step 4: Commit**

```bash
git add site/src/pages/saints/[slug]/index.astro
git commit -m "feat: related saints section on profile pages"
```

---

### Task 6: Alphabetical saint index page

**Files:**
- Create: `site/src/pages/saints/index.astro`

**Interfaces:**
- Consumes: `getCollection('saints')`, `BaseLayout.astro`, `SaintCard.astro`
- Produces: New page at `/saints/` with A-Z nav + grouped card grid

- [ ] **Step 1: Create the saints index page**

Create `site/src/pages/saints/index.astro` with this content:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import SaintCard from '../../components/SaintCard.astro';

const saints = (await getCollection('saints'))
  .filter((s) => !s.data.draft)
  .map((s) => s.data)
  .sort((a, b) => a.name.localeCompare(b.name));

const stripPrefix = (name: string) => name.replace(/^St\.?\s+/i, '').replace(/^Saint\s+/i, '');
const grouped = saints.reduce<Record<string, typeof saints>>((acc, s) => {
  const letter = stripPrefix(s.name).charAt(0).toUpperCase();
  (acc[letter] ??= []).push(s);
  return acc;
}, {});
const letters = Object.keys(grouped).sort();
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
---
<BaseLayout title="All Saints">
  <div class="mx-auto max-w-screen-sm px-4 pb-24 pt-4 sm:max-w-2xl lg:max-w-5xl lg:px-8">
    <h1 class="font-serif text-3xl text-balance sm:text-4xl">All Saints</h1>
    <p class="mt-1 text-sm text-ink-soft">{saints.length} saints</p>

    <nav class="sticky top-14 z-10 -mx-4 mt-4 bg-parchment/90 px-4 py-2 backdrop-blur" aria-label="Alphabetical navigation">
      <ul class="flex flex-wrap gap-1">
        {alphabet.map((letter) => {
          const has = letters.includes(letter);
          return (
            <li>
              {has
                ? <a href={`#letter-${letter}`} class="inline-flex h-8 w-8 items-center justify-center rounded text-sm font-medium text-brand hover:bg-white focus-visible:ring-2 focus-visible:ring-brand">{letter}</a>
                : <span class="inline-flex h-8 w-8 items-center justify-center rounded text-sm text-ink-soft/40" aria-disabled="true">{letter}</span>}
            </li>
          );
        })}
      </ul>
    </nav>

    {letters.map((letter) => (
      <section id={`letter-${letter}`} class="mt-8 scroll-mt-28">
        <h2 class="font-serif text-2xl text-brand">{letter}</h2>
        <ul class="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {grouped[letter].map((s) => (
            <li><SaintCard saint={s} /></li>
          ))}
        </ul>
      </section>
    ))}
  </div>
</BaseLayout>
```

- [ ] **Step 2: Add link to the index page in the header**

In `site/src/layouts/BaseLayout.astro`, find the header nav (the `<header>` tag). Currently it has the site name link and the search form. Add a "Saints" link between the site name and the search form.

Find:
```astro
        <a href="/" class="font-serif text-lg text-brand">Saint For That</a>
        <form action="/search" method="get" class="ml-auto flex-1" role="search">
```

Replace with:
```astro
        <a href="/" class="font-serif text-lg text-brand">Saint For That</a>
        <nav class="ml-4 hidden sm:block" aria-label="Primary">
          <a href="/saints/" class="text-sm text-ink hover:text-brand focus-visible:ring-2 focus-visible:ring-brand">Saints</a>
        </nav>
        <form action="/search" method="get" class="ml-auto flex-1" role="search">
```

- [ ] **Step 3: Build and verify**

Run: `cd site && pnpm run build`
Expected: Build succeeds, `/saints/index.html` generated.

Run: `grep -c 'letter-A' dist/saints/index.html`
Expected: 2 (one in the nav `<a href>`, one in the section `id`).

Run: `grep -o 'All Saints' dist/saints/index.html | head -1`
Expected: `All Saints`

Run: `grep -c 'Saints</a>' dist/index.html`
Expected: 1 (the header nav link appears on all pages including home).

- [ ] **Step 4: Commit**

```bash
git add site/src/pages/saints/index.astro site/src/layouts/BaseLayout.astro
git commit -m "feat: alphabetical A-Z saint index page"
```

---

### Task 7: Full verification + deploy

**Files:**
- None (verification only)

- [ ] **Step 1: Run full test suite**

Run: `cd site && pnpm test`
Expected: 31 tests pass (29 original + 2 new synonym tests).

- [ ] **Step 2: Run full build**

Run: `cd site && pnpm run build`
Expected: Build succeeds through all stages (validate → check-synonyms → astro check → astro build → pagefind).

- [ ] **Step 3: Verify key pages in dist**

Run:
```bash
grep -c 'bg-gold/20' dist/index.html
grep -c 'no-results-hint' dist/search/index.html
grep -c 'Other saints to pray to' dist/saints/anthony-of-padua/index.html
grep -c 'letter-A' dist/saints/index.html
grep -c 'Saints</a>' dist/index.html
```
Expected: all return ≥1.

- [ ] **Step 4: Deploy**

Run: `cd /home/jason/Repos/saint-for-that && docker compose up -d --build`
Expected: Container builds and starts.

- [ ] **Step 5: Verify live**

Run:
```bash
curl -s https://saints.superversive.net/ | grep -c 'bg-gold/20'
curl -s https://saints.superversive.net/saints/ | grep -c 'letter-A'
curl -s https://saints.superversive.net/saints/anthony-of-padua/ | grep -c 'Other saints to pray to'
```
Expected: all return ≥1.

- [ ] **Step 6: Final commit (if any uncommitted changes remain)**

```bash
git status
```
If clean, done. If not, commit any remaining changes.