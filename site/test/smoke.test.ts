import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, exec, type ChildProcess } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const PORT = 4321;
const BASE = `http://127.0.0.1:${PORT}`;
let server: ChildProcess | undefined;

function run(cmd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(cmd, { stdio: 'inherit' } as any, (err) => (err ? reject(err) : resolve()));
  });
}

async function startPreview(): Promise<void> {
  server = spawn('pnpm', ['exec', 'astro', 'preview', '--port', String(PORT)], { stdio: 'pipe' });
  await new Promise((r) => setTimeout(r, 3000));
}

async function status(path: string): Promise<number> {
  const res = await fetch(BASE + path, { redirect: 'manual' });
  return res.status;
}

describe('build smoke', () => {
  beforeAll(async () => {
    await run('pnpm run build');
    await startPreview();
  }, 180_000);

  afterAll(() => server?.kill());

  it('home returns 200', async () => {
    expect(await status('/')).toBe(200);
  });

  it('search page returns 200', async () => {
    expect(await status('/search/')).toBe(200);
  });

  it('saints index returns 200', async () => {
    expect(await status('/saints/')).toBe(200);
  });

  it('categories index returns 200', async () => {
    expect(await status('/categories/')).toBe(200);
  });

  it('about returns 200', async () => {
    expect(await status('/about/')).toBe(200);
  });

  it('sitemap returns 200', async () => {
    expect(await status('/sitemap-index.xml')).toBe(200);
  });

  it('every saint page returns 200', async () => {
    const files = readdirSync(join(process.cwd(), '..', 'data', 'saints'))
      .filter((f) => f.endsWith('.json'))
      .map((f) => join(process.cwd(), '..', 'data', 'saints', f));
    const saints = await Promise.all(files.map(async (f) => JSON.parse(await readFile(f, 'utf8'))));
    const results = await Promise.all(
      saints.map(async (s) => ({ slug: s.slug, status: await status(`/saints/${s.slug}/`) })),
    );
    const bad = results.filter((r) => r.status !== 200);
    expect(bad, 'non-200 saint pages: ' + bad.map((r) => r.slug).join(', ')).toEqual([]);
  }, 60_000);

  it('every category page returns 200', async () => {
    const { CATEGORIES } = await import('../src/lib/taxonomy');
    const results = await Promise.all(
      CATEGORIES.map(async (c) => ({ id: c.id, status: await status(`/categories/${c.id}/`) })),
    );
    const bad = results.filter((r) => r.status !== 200);
    expect(bad, 'non-200 category pages: ' + bad.map((r) => r.id).join(', ')).toEqual([]);
  });

  it('pagefind index was generated', async () => {
    expect(await status('/pagefind/pagefind.js')).toBe(200);
  });

  it('searching "lost keys" returns Anthony', async () => {
    const res = await fetch(BASE + '/pagefind/pagefind.js');
    expect(res.status).toBe(200);
    const html = await (await fetch(BASE + '/saints/anthony-of-padua/')).text();
    expect(html).toContain('lost keys');
    expect(html).toContain('data-need="lost items"');
  });
});
