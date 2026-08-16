# Saint For That

A searchable website of Catholic saints: who they are, what they intercede
for, and their life story. Inspired by "There Is a Saint for That" by
Peter's Barque.

## Development

- Node 20+, pnpm 9
- `cd site && pnpm install`
- `pnpm dev` — dev server (search requires a build)
- `pnpm run build` — validate data, build site, generate Pagefind index
- `pnpm preview` — serve the built site (search works here)
- `pnpm test` — schema tests + full build smoke tests

## Data

Saints live in `data/saints/*.json`, one file per saint. Schema is
validated at build time (zod). See `site/src/content/config.ts`.

## Deploy

`site/dist/` is a fully static site. Host anywhere (GitHub Pages,
Cloudflare Pages, VPS).
