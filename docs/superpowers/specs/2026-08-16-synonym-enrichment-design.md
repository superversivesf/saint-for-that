# Search Synonym Enrichment — Design Spec

Date: 2026-08-16
Status: Approved

## Overview

Enrich search results by expanding the synonym map so every patronage
need in the dataset is findable through everyday phrasings, related
terms, and common misspellings.

## Goals

- Expand `NEED_SYNONYMS` in `site/src/lib/taxonomy.ts` to cover every
  distinct `need` in `data/saints/*.json` (~150 needs)
- 5-10 synonyms per need: everyday phrasings, related terms, common
  misspellings
- Curated, committed to git — no external API, no network dependency
- Build-time coverage check: every need has >= 5 synonyms; unknown
  needs fail the build
- Indexing mechanism unchanged: sr-only span on profile pages renders
  needs + synonyms into `data-pagefind-body`; Pagefind indexes them

## Non-Goals

- No client-side query expansion
- No saint-name variants (e.g. "Antony" for "Anthony") — needs only
- No changes to the search UI

## Synonym Map

`site/src/lib/taxonomy.ts` — `NEED_SYNONYMS: Record<string, string[]>`.

Rules:

- Keys are exact `need` strings from the dataset
- 5-10 synonyms per need, lowercase, no punctuation
- Include: everyday phrasings ("lost keys" for "lost items"), related
  terms ("worry" for "anxiety"), common misspellings ("travellers")
- No duplicates within a need's list
- No empty arrays

## Coverage Check

New script `scripts/check-synonyms.ts`:

- Reads all `data/saints/*.json`, collects distinct `need` values
- Every need must exist as a key in `NEED_SYNONYMS` with >= 5 entries
- Missing/insufficient needs: print file + need, exit 1
- Wired into the build: `site/package.json` build script runs it after
  validate

## Indexing (unchanged)

Profile page sr-only span already renders:

```
{saint.patronages.flatMap((p) => [p.need, ...(NEED_SYNONYMS[p.need] ?? [])]).join(', ')}
```

inside `data-pagefind-body`. The expanded map flows through with no
template changes.

## Error Handling

- Unknown need in data → build fails with need name and file
- Need with < 5 synonyms → build fails with need name

## Testing

- vitest: no empty arrays, no duplicate synonyms within a need, all
  keys lowercase
- Coverage check passes against real data (201 saints)
- Existing 25 tests pass
