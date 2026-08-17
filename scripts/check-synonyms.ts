import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { NEED_SYNONYMS } from '../site/src/lib/taxonomy';

const SAINTS_DIR = join(process.cwd(), '..', 'data', 'saints');

function main() {
  const files = readdirSync(SAINTS_DIR).filter((f) => f.endsWith('.json'));
  const needs = new Set<string>();
  for (const f of files) {
    const saint = JSON.parse(readFileSync(join(SAINTS_DIR, f), 'utf-8'));
    for (const p of saint.patronages ?? []) {
      needs.add(p.need);
    }
  }

  const errors: string[] = [];
  for (const need of needs) {
    const syns = NEED_SYNONYMS[need];
    if (!syns) {
      errors.push(`missing synonyms for need "${need}"`);
    } else if (syns.length < 5) {
      errors.push(`need "${need}" has only ${syns.length} synonyms (min 5)`);
    } else if (syns.length > 10) {
      errors.push(`need "${need}" has ${syns.length} synonyms (max 10)`);
    }
  }

  if (errors.length) {
    console.error('Synonym coverage failed:\n' + errors.map((e) => `  • ${e}`).join('\n'));
    process.exit(1);
  }
  console.log(`OK ${needs.size} needs covered`);
}

main();
