# odela-website

Static product site for **odela**: landing, download, docs, changelog, license and privacy.

## Stack

- Astro + Starlight
- Bun for install/build
- GitHub Pages, custom domain `odela.beer`
- Pagefind search; no backend

## Status

Repository initialized. Site skeleton not scaffolded yet.

## Planned commands

```bash
bun install
bun run dev
bun run build
bun run check
```

When the site is scaffolded, these become the repo's own commands; the private product repo does not call them.

## Boundaries

- No product source, no contracts imports, no app builds.
- Download links point to [odela-releases](https://github.com/suj1e/odela-releases).
- Public docs are curated here; internal product docs stay in the private repo.

## Routes

- `/` — 中文首页
- `/en/` — English landing
- `/download`
- `/docs`, `/docs/en`
- `/changelog`
- `/license`
- `/privacy`

## License

Apache-2.0. See [LICENSE](LICENSE).
