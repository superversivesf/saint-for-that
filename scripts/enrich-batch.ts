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