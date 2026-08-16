import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { saintSchema } from '../site/src/lib/schema';

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
