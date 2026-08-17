# Polish & Tech Debt — Design

Date: 2026-08-17
Status: approved

## Scope

Three buckets, executed in order:
1. Content quality (missing images)
2. Search/UX polish (no-results state, need-count badges, related saints, A-Z index)
3. Tech debt (redundant synonyms, trailing newlines, upper-bound check)

## 1. Content Quality — Missing Images

**Problem:** 26 saints lack images (no `image` field in JSON).

**Solution:** Re-run `scripts/fetch-images.ts --force` for these 26 saints. The script queries the Wikipedia API, downloads images, and writes the `image` field (`{ src, alt, width, height }`) into each saint's JSON file. Saints with no Wikipedia image stay imageless (graceful — existing UI handles missing images).

**No code changes.** Run script, commit updated JSON files.

**Verification:** `grep -l '"image"' data/saints/*.json | wc -l` should increase from 175.

## 2. Search/UX Polish

### 2a. "No results" state on search page (`site/src/pages/search.astro`)

PagefindUI already shows "No results found" automatically when a query returns nothing. Enhance with a styled hint below the empty state.

**Implementation:** Add a `MutationObserver` in the existing `<script>` tag that watches `#search` (the Pagefind results container). When Pagefind renders its no-results message, inject a `<div class="no-results-hint">` with: "Try searching a synonym — e.g. 'lost wallet' for lost items, or browse <a href="/">categories</a>." Styled with the warm colour scheme (parchment bg, ink text, gold link).

### 2b. Need-count badges on category chips (`site/src/pages/index.astro`)

**Problem:** Home page category chips show category label only — no indication of how many saints/needs fall under each.

**Implementation:** Server-side computation in the Astro frontmatter. For each of the 10 categories, count distinct needs in that category across all saints, then render `<span class="badge">{count}</span>` beside the label. Badge styled as a small gold pill (`bg-gold/20 text-gold rounded-full px-2 text-sm`).

### 2c. Related saints section (`site/src/pages/saints/[slug]/index.astro`)

**Problem:** Profile pages don't surface other saints who intercede for the same needs.

**Implementation:** At the bottom of the profile page, after the prayer section, add "Other saints for [need]" section. Logic:
- Take the saint's patronage needs (in order)
- For each need (capped at 2 needs), find up to 4 other saints sharing that need
- Render as a section heading "Other saints for [need]" + card grid using existing `SaintCard.astro`
- Skip the current saint
- If no other saints share the need, skip that need
- If no related saints at all, skip the entire section

**Data flow:** Use `getCollection('saints')` to fetch all saints, filter by shared need, exclude current saint, slice to 4. Computed server-side at build time.

### 2d. Alphabetical saint index (`site/src/pages/saints/index.astro`)

**Problem:** No way to browse all 201 saints alphabetically.

**Implementation:** New page at `/saints/`.
- Hero heading "All Saints" with parchment background
- Sticky A-Z letter nav at top: 26 letters, letters with no saints disabled (greyed out, not clickable)
- Below, saints grouped by first letter of `name` (stripping "St. " prefix)
- Each group: letter heading (`#letter-X` anchor) + card grid using `SaintCard.astro`
- Letter nav links to `#letter-X` anchors
- Same layout as home page (BaseLayout, container max-width)

## 3. Tech Debt

### 3a. Redundant synonym==key entries

**Problem:** 19 entries in `NEED_SYNONYMS` have a synonym that exactly equals its key (e.g. `"youth": ["youth", "young people", ...]`). Harmless but noisy.

**Solution:** Script to scan `NEED_SYNONYMS`, remove any synonym string that exactly equals its key. One-time cleanup. Verify hygiene tests still pass (4/4). Commit.

### 3b. Missing trailing newlines

**Problem:** `scripts/check-synonyms.ts` and `site/test/synonyms.test.ts` lack trailing newlines.

**Solution:** Add `\n` to end of both files.

### 3c. Upper-bound check (<=10 synonyms)

**Problem:** `check-synonyms.ts` enforces `>=5` synonyms but not `<=10`.

**Solution:**
- In `check-synonyms.ts`: after the existing lower-bound check, add a check for `synonyms.length > 10`. If any need exceeds 10, print error and exit 1.
- In `site/test/synonyms.test.ts`: add a test asserting no `NEED_SYNONYMS` entry has more than 10 synonyms.

## Testing

- Existing 29 tests stay green
- Add 1 test (upper-bound check) → 30 tests total
- Build pipeline: `pnpm run validate && tsx ../scripts/check-synonyms.ts && astro check && astro build && pagefind --site dist`
- Deploy: `docker compose up -d --build`
- Verify live at `https://saints.superversive.net`

## File Inventory

| File | Change |
|------|--------|
| `data/saints/*.json` (26 files) | Add `image` field via fetch-images.ts |
| `site/src/pages/search.astro` | Add no-results hint + MutationObserver |
| `site/src/pages/index.astro` | Add need-count badges to category chips |
| `site/src/pages/saints/[slug]/index.astro` | Add related saints section |
| `site/src/pages/saints/index.astro` | New: A-Z saint index page |
| `site/src/lib/taxonomy.ts` | Remove 19 redundant synonym==key entries |
| `scripts/check-synonyms.ts` | Add upper-bound check, trailing newline |
| `site/test/synonyms.test.ts` | Add upper-bound test, trailing newline |

## Out of Scope

- Adding new saints
- Expanding thin-coverage needs (91 needs with only 1 saint)
- Prayer sharing/copy button
- Saint of the day
- Random saint button
- Open Graph / social card meta tags