import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { saintSchema } from '../site/src/lib/schema';

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
