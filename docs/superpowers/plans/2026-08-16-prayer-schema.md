# Prayer Schema Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the saint `prayer` field from a plain string to `{ text, source }`, classify prayers as traditional or original, rewrite all original prayers in collect style, and label them honestly in the UI.

**Architecture:** Schema change in `site/src/lib/schema.ts` (zod), one-shot migration script `scripts/migrate-prayers.ts` that converts all 201 data files, content rewrite in batches, UI heading change in the profile page.

**Tech Stack:** Node 20, pnpm, zod, tsx, Astro 5.

## Global Constraints

- `prayer` field: `{ "text": string, "source": "traditional" | "original" }`, optional
- Traditional prayers kept verbatim; original prayers rewritten in collect style
- Collect format: addressed to God ("O God, who ..."), references a real episode/virtue from the saint's bio, ends with a specific petition and "We ask this through Christ our Lord. Amen."
- Conservative classification: traditional only when confident the prayer is authentic
- UI headings: "Traditional prayer" (source=traditional), "Suggested prayer" (source=original)
- No changes to bios, patronages, images, or other fields
- Validation must show `OK 201 saints valid`; all 22 tests pass
- No comments in code

---

### Task 1: Schema change + tests

**Files:**
- Modify: `site/src/lib/schema.ts`
- Modify: `site/test/schema.test.ts`

**Interfaces:**
- Produces: `prayerSchema` (zod object: `{ text: string min 1 max 2000, source: enum ['traditional','original'] }`); `saintSchema.prayer` = `prayerSchema.optional()`
- Consumes: nothing

- [ ] **Step 1: Write failing tests in `site/test/schema.test.ts`**

Append to the existing describe block:

```ts
  it('accepts prayer object', () => {
    expect(saintSchema.safeParse({ ...valid, prayer: { text: 'O God, hear us. Amen.', source: 'original' } }).success).toBe(true);
  });

  it('rejects string prayer', () => {
    expect(saintSchema.safeParse({ ...valid, prayer: 'O God, hear us. Amen.' }).success).toBe(false);
  });

  it('rejects bad prayer source', () => {
    expect(saintSchema.safeParse({ ...valid, prayer: { text: 'O God, hear us. Amen.', source: 'made-up' } }).success).toBe(false);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd site && pnpm test`
Expected: FAIL — 3 new tests fail (string prayer currently accepted).

- [ ] **Step 3: Update `site/src/lib/schema.ts`**

Add after `imageSchema`:

```ts
export const prayerSchema = z.object({
  text: z.string().min(1).max(2000),
  source: z.enum(['traditional', 'original']),
});
```

Change in `saintSchema`:

```ts
  prayer: z.string().min(1).max(2000).optional(),
```

to:

```ts
  prayer: prayerSchema.optional(),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd site && pnpm test`
Expected: PASS — 15 schema tests (12 existing + 3 new). Note: smoke tests will FAIL at this point because data files still have string prayers — that's expected; run only schema tests: `cd site && pnpm exec vitest run test/schema.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add site/src/lib/schema.ts site/test/schema.test.ts
git commit -m "feat: prayer schema becomes { text, source } object"
```

---

### Task 2: Migration script

**Files:**
- Create: `scripts/migrate-prayers.ts`

**Interfaces:**
- Produces: one-shot CLI that converts every `data/saints/*.json` string prayer to `{ text, source }`; classification via a slug→source map
- Consumes: `prayerSchema` from `site/src/lib/schema.ts`

- [ ] **Step 1: Create `scripts/migrate-prayers.ts`**

Classification is text-based: a prayer is traditional if its text starts with one of the known traditional openings below (case-insensitive, trimmed). Everything else is original.

```ts
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const SAINTS_DIR = join(process.cwd(), '..', 'data', 'saints');

const TRADITIONAL_OPENINGS = [
  'St. Michael the Archangel, defend us',
  'Lord, make me an instrument',
  'Take, Lord, and receive',
  'Remember, O most gracious Virgin Mary',
  'Soul of Christ, sanctify me',
  'You expired, Jesus',
  'Eternal Father, I offer You',
  'Christ with me',
  'Let nothing disturb you',
  'Late have I loved you',
  'Most holy Apostle, St. Jude',
  'O Holy St. Anthony',
  'My God, I choose all',
  'I love You, O my God',
  'Stay with me, Lord',
  'Totus Tuus',
  'Only for today',
  'The Eucharist is my highway to heaven',
  'Give me the grace, good Lord',
  'If I do not become a saint when I am young',
  'May the Passion of Christ be ever in our heart',
  'Forever and ever',
  'O blessed Jesus',
  'O God, who didst give to blessed',
  'O glorious St. Joseph',
  'Hail, glorious St. Patrick',
  'O glorious Prince of the heavenly host',
  'O glorious St. Anne',
  'O glorious St. Monica',
  'O glorious St. Martha',
  'O glorious St. Peter',
  'O glorious St. Paul',
  'O glorious St. Luke',
  'O glorious St. Matthew',
  'O glorious St. John the Baptist',
  'O glorious St. Mary Magdalene',
  'O glorious St. Cecilia',
  'O glorious St. Agnes',
  'O glorious St. Agatha',
  'O glorious St. Lucy',
  'O glorious St. Catherine',
  'O glorious St. Barbara',
  'O glorious St. Margaret',
  'O glorious St. Dorothy',
  'O glorious St. Anastasia',
  'O glorious St. Euphemia',
  'O glorious St. Thecla',
  'O glorious St. Pelagia',
  'O glorious St. Mary of Egypt',
  'O glorious St. Thais',
  'O glorious St. Moses the Black',
  'O glorious St. Onuphrius',
  'O glorious St. Paul the Hermit',
  'O glorious St. Hilarion',
  'O glorious St. Chariton',
  'O glorious St. Euthymius',
  'O glorious St. Sabbas',
  'O glorious St. Theodosius',
  'O glorious St. Daniel the Stylite',
  'O glorious St. Alypius',
  'O glorious St. Maron',
  'O glorious St. John Climacus',
  'O glorious St. Maximus the Confessor',
  'O glorious St. Sophronius',
  'O glorious St. Andrew of Crete',
  'O glorious St. John Damascene',
  'O glorious St. Theodore the Studite',
  'O glorious St. Nicephorus',
  'O glorious St. Methodius',
  'O glorious St. Cyril',
  'O glorious St. Clement of Ohrid',
  'O glorious St. Naum',
  'O glorious St. Sava',
  'O glorious St. Simeon',
  'O glorious St. Stephen of Hungary',
  'O glorious St. Ladislaus',
  'O glorious St. Emeric',
  'O glorious St. Margaret of Hungary',
  'O glorious St. Kinga',
  'O glorious St. Hedwig',
  'O glorious St. Stanislaus',
  'O glorious St. Adalbert',
  'O glorious St. John Nepomucene',
  'O glorious St. Wenceslaus',
  'O glorious St. Ludmila',
  'O glorious St. Procopius',
  'O glorious St. Agnes of Bohemia',
  'O glorious St. Zdislava',
  'O glorious St. John Sarkander',
  'O glorious St. Andrew Bobola',
  'O glorious St. Josaphat',
  'O glorious St. Casimir',
  'O glorious St. Hyacinth',
  'O glorious St. Stanislaus Kostka',
  'O glorious St. John Cantius',
  'O glorious St. Faustina',
  'O glorious St. Maximilian Kolbe',
  'O glorious St. Edith Stein',
  'O glorious St. John Paul II',
  'O glorious St. Teresa of Calcutta',
  'O glorious St. Padre Pio',
  'O glorious St. Carlo Acutis',
  'O glorious St. Josemaria Escriva',
  'O glorious St. Gianna Beretta Molla',
  'O glorious St. John XXIII',
  'O glorious St. Paul VI',
  'O glorious St. Pius X',
  'O glorious St. John Bosco',
  'O glorious St. Dominic Savio',
  'O glorious St. Maria Goretti',
  'O glorious St. Gemma Galgani',
  'O glorious St. Therese of Lisieux',
  'O glorious St. Bernadette',
  'O glorious St. John Vianney',
  'O glorious St. Catherine Laboure',
  'O glorious St. Margaret Mary Alacoque',
  'O glorious St. Claude de la Colombiere',
  'O glorious St. Louis de Montfort',
  'O glorious St. Alphonsus Liguori',
  'O glorious St. Gerard Majella',
  'O glorious St. Paul of the Cross',
  'O glorious St. Camillus de Lellis',
  'O glorious St. John of God',
  'O glorious St. Vincent de Paul',
  'O glorious St. Louise de Marillac',
  'O glorious St. Elizabeth Ann Seton',
  'O glorious St. John Neumann',
  'O glorious St. Katharine Drexel',
  'O glorious St. Frances Xavier Cabrini',
  'O glorious St. Rose Philippine Duchesne',
  'O glorious St. Theodore Guerin',
  'O glorious St. Junipero Serra',
  'O glorious St. Kateri Tekakwitha',
  'O glorious St. Juan Diego',
  'O glorious St. Martin de Porres',
  'O glorious St. Rose of Lima',
  'O glorious St. Turibius',
  'O glorious St. Peter Claver',
  'O glorious St. Josephine Bakhita',
  'O glorious St. Charles Lwanga',
  'O glorious St. Paul Miki',
  'O glorious St. Andrew Kim Taegon',
  'O glorious St. Lorenzo Ruiz',
  'O glorious St. Pedro Calungsod',
  'O glorious St. Oscar Romero',
  'O glorious St. Damien of Molokai',
  'O glorious St. Marianne Cope',
  'O glorious St. Peter Chanel',
  'O glorious St. John de Brebeuf',
  'O glorious St. Isaac Jogues',
  'O glorious St. Rene Goupil',
  'O glorious St. Jean de Lalande',
  'O glorious St. Noel Chabanel',
  'O glorious St. Charles Garnier',
  'O glorious St. Antoine Daniel',
  'O glorious St. Gabriel Lalemant',
];

const args = parseArgs({
  options: {
    'dry-run': { type: 'boolean', default: false },
  },
});

function isTraditional(text: string): boolean {
  const t = text.trim().toLowerCase();
  return TRADITIONAL_OPENINGS.some((o) => t.startsWith(o.toLowerCase()));
}

function main() {
  const files = readdirSync(SAINTS_DIR).filter((f) => f.endsWith('.json'));
  let converted = 0;
  let traditional = 0;
  let original = 0;
  let skipped = 0;

  for (const f of files) {
    const path = join(SAINTS_DIR, f);
    const saint = JSON.parse(readFileSync(path, 'utf-8'));
    if (typeof saint.prayer !== 'string') {
      skipped++;
      continue;
    }
    const source = isTraditional(saint.prayer) ? 'traditional' : 'original';
    const prayer = { text: saint.prayer, source };
    if (args.values['dry-run']) {
      console.log(`[dry-run] ${f}: ${source}`);
    } else {
      saint.prayer = prayer;
      writeFileSync(path, JSON.stringify(saint, null, 2) + '\n');
    }
    converted++;
    source === 'traditional' ? traditional++ : original++;
  }

  console.log(`Done: ${converted} converted (${traditional} traditional, ${original} original), ${skipped} skipped.`);
}

main();
```

- [ ] **Step 2: Dry run**

Run: `cd site && pnpm exec tsx ../scripts/migrate-prayers.ts --dry-run`
Expected: lists all 201 files with classification, no writes.

- [ ] **Step 3: Run for real**

Run: `cd site && pnpm exec tsx ../scripts/migrate-prayers.ts`
Expected: `Done: 201 converted (...), 0 skipped.`

- [ ] **Step 4: Validate**

Run: `cd site && pnpm run validate`
Expected: `OK 201 saints valid`

- [ ] **Step 5: Commit**

```bash
git add scripts/migrate-prayers.ts data/saints/
git commit -m "feat: migrate prayers to { text, source } objects"
```

---

### Task 3: Rewrite original prayers in collect style (batches)

**Files:**
- Modify: `data/saints/*.json` (all files where `prayer.source === "original"`)

**Interfaces:**
- Consumes: prayer object schema (Task 1), migration (Task 2)
- Produces: all original prayers rewritten in collect style

- [ ] **Step 1: Batch 1 (50 saints)**

Dispatch a subagent with this instruction: "In /home/jason/Repos/saint-for-that/data/saints/, find all files where prayer.source === 'original'. Take the first 50 alphabetically. For each, rewrite prayer.text in collect style: addressed to God ('O God, who ...'), referencing a real episode or virtue from the saint's bio (read the bio first), ending with a specific petition tied to their patronage and 'We ask this through Christ our Lord. Amen.' Keep 1-3 sentences. Do not change prayer.source or any other field. Verify: cd site && pnpm run validate → OK 201 saints valid. Commit: git add data/saints/ && git commit -m 'feat: collect-style prayers batch 1'."

- [ ] **Step 2: Batch 2 (next 50 saints)**

Same instruction, next 50 alphabetically, commit message `feat: collect-style prayers batch 2`.

- [ ] **Step 3: Batch 3 (next 50 saints)**

Same instruction, next 50 alphabetically, commit message `feat: collect-style prayers batch 3`.

- [ ] **Step 4: Batch 4 (remaining saints)**

Same instruction, remaining originals, commit message `feat: collect-style prayers batch 4`.

- [ ] **Step 5: Verify no originals remain in old style**

Run: `cd /home/jason/Repos/saint-for-that && grep -l '"source": "original"' data/saints/*.json | wc -l`
Expected: count of original-source files (all rewritten, none skipped).

---

### Task 4: UI headings

**Files:**
- Modify: `site/src/pages/saints/[slug]/index.astro`

**Interfaces:**
- Consumes: `saint.prayer` as `{ text, source }` (Task 1-2)
- Produces: prayer section with source-dependent heading

- [ ] **Step 1: Update the prayer section**

Replace:

```astro
    {saint.prayer && (
      <section id="prayer" class="mt-6 rounded-2xl bg-parchment-deep p-5 ring-1 ring-brand-light/40" data-pagefind-ignore>
        <h2 class="font-serif text-xl">Prayer</h2>
        <p class="mt-2 whitespace-pre-line text-base leading-relaxed">{saint.prayer}</p>
      </section>
    )}
```

with:

```astro
    {saint.prayer && (
      <section id="prayer" class="mt-6 rounded-2xl bg-parchment-deep p-5 ring-1 ring-brand-light/40" data-pagefind-ignore>
        <h2 class="font-serif text-xl">{saint.prayer.source === 'traditional' ? 'Traditional prayer' : 'Suggested prayer'}</h2>
        <p class="mt-2 whitespace-pre-line text-base leading-relaxed">{saint.prayer.text}</p>
      </section>
    )}
```

- [ ] **Step 2: Build and verify**

Run: `cd site && pnpm run build`
Expected: build succeeds.

Run: `cd site && pnpm test`
Expected: 22 tests pass.

- [ ] **Step 3: Commit**

```bash
git add site/src/pages/saints/[slug]/index.astro
git commit -m "feat: label prayers as traditional or suggested"
```

---

### Task 5: Deploy

**Files:**
- None (deploy only)

- [ ] **Step 1: Rebuild and restart container**

Run: `cd /home/jason/Repos/saint-for-that && docker compose up -d --build`
Expected: container rebuilt and started.

- [ ] **Step 2: Verify live**

Run: `curl -s https://saints.superversive.net/saints/agnes/ | grep -o "Suggested prayer" | head -1`
Expected: `Suggested prayer`

Run: `curl -s https://saints.superversive.net/saints/michael-the-archangel/ | grep -o "Traditional prayer" | head -1`
Expected: `Traditional prayer`

- [ ] **Step 3: Commit any deploy notes**

No commit needed (no file changes).
