# odela-website

Static product site for **odela**, a local-first multi-agent workspace: landing, download, docs, changelog, license and privacy.

## Stack

- Astro + Starlight
- npm for install/build
- GitHub Pages, custom domain `odela.beer`
- Pagefind search; no backend

## Status

S0 scaffold: landing, Chinese/English docs, download placeholder, Pages workflow.

## Commands

Node.js >= 22.23.4 is required. The repo pins it in `.mise.toml`.

```bash
mise install
npm ci
npm run dev
npm run build
npm run check
```

The private product repo does not call these.

## Boundaries

- No product source, no contracts imports, no app builds.
- Download links point to [odela-releases](https://github.com/suj1e/odela-releases).
- Public docs are curated here; internal product docs stay in the private repo.

## Routes

- `/` — 中文首页
- `/en/` — English landing
- `/download`, `/en/download`
- `/docs`, `/docs/getting-started`
- `/en/docs`, `/en/docs/getting-started`
- `/changelog`
- `/license`
- `/privacy`

`/changelog`, `/license` and `/privacy` are next; S0 only ships landing, docs and download placeholder.

<!-- Starlight serves English docs under `/en/docs`; the locale prefix comes before the docs directory. -->

## License

Apache-2.0. See [LICENSE](LICENSE).
