# Scale to 2000 Saints — Design

Date: 2026-08-17
Status: approved

## Goal

Scale the saint database from 201 to ~2000 saints using an AI-driven research pipeline with human QA.

## Scope

All documented saints with Wikipedia articles, Catholic Encyclopedia entries, or established patronages. Prayers: traditional where available + verifiable, otherwise original collect-style.

## Architecture: 4-Phase Pipeline

### Phase 1: Curation (`scripts/curate-saints.ts`)

Fetch master list of candidate saints from Wikipedia API.

**Process:**
- Query Wikipedia API for saints: iterate `Category:Christian saints by century`, `Category:Saints by nationality`, `Category:Saints by occupation`, and `Category:Patron saints` to build a broad candidate list
- For each candidate, fetch article summary + infobox via Wikipedia REST API (`/api/rest_v1/page/summary/{title}`)
- Extract: name (normalise to "St. X" or "Blessed X"), feast day (from infobox `feast_day`), raw patronages (from infobox `patronage`), Wikipedia URL, raw summary text
- Deduplicate against existing 201 slugs (skip saints already in `data/saints/`)
- Filter: keep only saints with (a) a Wikipedia article and (b) at least one patronage OR notable veneration (feast day present)
- Output: `data/curation/master-list.json` — array of `{ name, slug, wikipediaUrl, feastDay, rawPatronages, rawSummary }`

**Estimated output:** 2000-3000 candidates (trim to ~2000 by prioritising those with patronages).

**Polite rate limiting:** 100ms delay between API calls, User-Agent header `SaintForThat/1.0 (https://saints.superversive.net)`.

### Phase 2: AI Enrichment (batched subagents)

Transform raw Wikipedia data into valid saint JSON files.

**Batching:** 10 saints per subagent (proven reliable from prior synonym work). ~180 batches for 1800 new saints.

**Subagent input:** 10 master-list entries (name, slug, wikipediaUrl, feastDay, rawPatronages, rawSummary).

**Subagent output:** 10 `data/saints/{slug}.json` files, each containing:
- `slug`: kebab-case, matches master-list
- `name`: normalised ("St. X" or "Blessed X")
- `feastDay`: MM-DD format (or "unknown" if not determinable)
- `bio`: 500-800 chars, hagiographic style matching existing saints (see `data/saints/anthony-of-padua.json` for reference). Grounded in the Wikipedia summary — no fabricated facts.
- `patronages`: array of `{ need, category }`. Map raw Wikipedia patronages to existing needs where possible (see existing needs via `grep -o '"need": "[^"]*"' data/saints/*.json | sort -u`). New needs must fit one of the 10 existing categories.
- `prayer`: `{ text, source }`. If a traditional prayer is known and verifiable, use it with `source: "traditional"`. Otherwise write an original collect-style prayer (`source: "original"`, format: "O God, who... We ask this through Christ our Lord. Amen.").
- `sources`: `[wikipediaUrl]`
- `featured`: `false`
- `draft`: `false`

**Subagent constraints:**
- Must only mark a prayer as `traditional` if it can cite the source (e.g. Catholic Encyclopedia, EWTN, a Catholic prayer book). If uncertain, use `original`.
- Must map patronages to existing needs where a reasonable match exists. New needs only when no existing need fits.
- Must not duplicate an existing saint's slug.
- Must produce valid JSON matching the zod schema (see `site/src/lib/schema.ts`).

### Phase 3: Post-Processing

**3a. Image fetch:** Re-run `scripts/fetch-images.ts` (no --force needed for new saints; they lack images). Fetches Wikipedia images for all new saints.

**3b. Need taxonomy expansion:** Collect all new needs introduced by the new saints (diff against the original 152). For each new need, add to `NEED_SYNONYMS` with 5-10 lowercase synonyms. Batched subagents, same pattern as the synonym enrichment work (10-15 needs per batch).

**3c. Validation:** Run `pnpm run validate` to catch schema violations. Run `pnpm exec tsx ../scripts/check-synonyms.ts` to verify synonym coverage.

### Phase 4: QA + Deploy

**4a. Automated:**
- `pnpm test` — all 31 tests pass
- `pnpm run build` — full build succeeds (validate → check-synonyms → astro check → astro build → pagefind)
- Build time estimate: 3-5 min for 2000 pages (was ~30s for 201)

**4b. Human spot-check (10% sample):**
- Random ~180 saints selected
- Verify: bio accuracy (cross-check with Wikipedia), patronages correct, prayer appropriate (traditional prayers are verifiable, originals are theologically sound)
- Fix any issues found

**4c. Deploy:**
- `docker compose up -d --build`
- Verify live at `https://saints.superversive.net`

## Key Decisions

**Need taxonomy:** New saints introduce new needs. Subagents map to existing needs where possible. Genuinely new needs (e.g. "stonecutters") get added with categories. After all batches, collect new needs and run synonym enrichment.

**Category assignment:** Subagents pick from the existing 10 categories (`everyday`, `illness`, `jobs`, `travel`, `persecution`, `spiritual`, `military`, `family`, `nature`, `special`). New needs must fit one of these.

**Prayer sourcing:** Subagents only mark a prayer as `traditional` if they can cite a source. Uncertain → `original`. Original prayers follow the collect style.

**Quality gates:**
- Every saint has a Wikipedia source URL
- Every saint passes zod schema validation
- `check-synonyms.ts` passes (all needs have 5-10 synonyms)
- 10% human spot-check for factual accuracy

## Cost/Time Estimate

- API costs: ~$20-60 in LLM tokens for ~180 batches
- Wikipedia API: free (polite rate limiting)
- Wall-clock: 2-4 hours of subagent dispatching (10 saints/batch, ~5 min/batch)
- Human QA: 2-4 hours for 10% spot-check

## Technical Scaling

- Build time: 2000 pages → ~3-5 min Astro build. Pagefind indexing ~1-2 min. Acceptable.
- Data size: ~2.4 MB JSON — trivial
- Docker image: no change (nginx serves static files)
- Pagefind index: scales fine for client-side search

## New Scripts

| Script | Purpose |
|--------|---------|
| `scripts/curate-saints.ts` | Fetch master list from Wikipedia API, write master-list.json |
| `scripts/qa-sample.ts` | (optional) Pick random 10% sample for human QA, output slug list |

Reuses existing `scripts/fetch-images.ts`, `scripts/validate-saints.ts`, `scripts/check-synonyms.ts`.

## What Does NOT Change

- Schema (`site/src/lib/schema.ts`) — unchanged
- All page templates — unchanged (iterate over collection)
- Search — Pagefind scales fine
- Docker/nginx — unchanged
- Tests — unchanged (schema tests cover new data automatically)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| AI bios contain hallucinations | Require Wikipedia source URL; 10% spot-check; bios summarise Wikipedia, not original research |
| Prayer mislabelled "traditional" | Subagents must cite source for traditional; uncertain → original |
| Need taxonomy bloat | Subagents map to existing needs first; new needs only when no fit |
| Subagent batch failure (empty result) | Use 10-item batches (proven reliable); re-dispatch failures |
| Wikipedia API rate limiting | 100ms delay between calls; User-Agent header |

## File Inventory

| File | Change |
|------|--------|
| `scripts/curate-saints.ts` | New: fetch master list from Wikipedia |
| `data/curation/master-list.json` | New: intermediate data |
| `data/saints/*.json` | ~1799 new files |
| `site/src/lib/taxonomy.ts` | New needs added to NEED_SYNONYMS |
| `scripts/fetch-images.ts` | No change (re-run) |
| `scripts/validate-saints.ts` | No change (re-run) |
| `scripts/qa-sample.ts` | New (optional): random 10% sample for QA |

## Out of Scope

- Changing the schema
- Adding new page templates or UI features
- Modifying Docker/nginx config
- Adding non-Wikipedia sources (Catholic Encyclopedia, Roman Martyrology) — future enhancement