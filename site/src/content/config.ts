import { defineCollection } from 'astro:content';
import { saintSchema } from '../lib/schema';

export { saintSchema } from '../lib/schema';
export type { Saint } from '../lib/schema';

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
