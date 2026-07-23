# Adding new escritos (runbook for a future agent)

Felipe writes almost every day (cartas al director, columnas, LinkedIn artículos).
This is how to publish a new piece to the Escritos section (`/writing/`) quickly
and safely, without hand-copying text or leaking private data.

## The one command

Use the importer. It reads a source file, strips what must not be published,
and writes the collection file with the right front matter.

```bash
node scripts/import-escrito.js --type <carta|columna|articulo> \
  --source "<absolute path to the source .md>" \
  --topics <slug,slug>
```

Then rebuild and check:

```bash
npx @11ty/eleventy
cd _site && python -m http.server 8000   # open http://localhost:8000/writing/
```

Then commit `src/writing/posts/` and the rebuilt `_site/`, and (only when Felipe
says go) deploy per the "Deploying to Hostinger" section of the root `CLAUDE.md`.

## What the script does for you

- **Title:** carta -> the `asunto:` field (minus a leading "Carta: "); columna ->
  the source `# H1`; artículo -> the `seo_title:` field. Override with `--title`.
- **Date:** carta -> the `fecha:` field; columna -> the `YYYY-MM-DD` in the
  filename; artículo -> the date in the parent folder name. Override with `--date`.
- **Slug / URL:** derived from the filename (or the parent folder for LinkedIn's
  `articulo.md`), date prefix and `_CIPER`/`_plain`/`columna_` noise removed, so
  the URL is clean: `/writing/<slug>/`. Override with `--slug`.
- **Strips (never published):** the "Asunto sugerido..." email line, the
  duplicated `# H1`, and — most important — the **signature block with RUT and
  phone number** that cartas al director carry. Always sanity-check after import:
  `grep -rilE 'rut:|\+56 9' src/writing/posts/` should return nothing (the word
  "teléfono" inside body prose is fine; a `RUT:`/`Teléfono:` line is not).
- **Flattens** markdown citation links `[texto](url)` -> `texto` for a clean read
  (matches the plain style of the rest of the archive).
- **LinkedIn scaffolding:** strips the trailing `@mentions` line, the `#hashtags`
  line, and the caption after them (real `##` subheadings are kept).
- **Cover image (artículos):** auto-detects `cover.png` in the source folder,
  optimizes it to webp (1200px wide, ~20KB) at `src/writing/covers/<date>-<slug>.webp`,
  and adds `cover:` to the front matter. Pass `--cover <path>` to point elsewhere,
  or `--no-cover` to skip. Needs `sharp` (already a dependency).

The one thing the script does NOT decide is **topics** — that is the editorial
call, so `--topics` is required.

## Topics (the taxonomy)

The 9 topic slugs live in `src/_data/tax.js` (single source of truth). Read the
piece and pick the one or two that fit:

`ia` (Inteligencia Artificial) · `trabajo` (Trabajo y empleo) ·
`economia` (Economía y fiscalidad) · `software` (Software e ingeniería) ·
`govtech` (GovTech, datos y transparencia) · `ciudad` (Vivienda, ciudad e
infraestructura) · `ciencia` (Ciencia, medio ambiente y educación) ·
`justicia` (Justicia, derechos e instituciones) · `politica` (Política y partidos)

A piece can carry several: `--topics ia,justicia`. To add a brand-new topic,
add it to `tax.js` (slug + label) and it appears as a filter chip automatically;
the type chips are already data-driven (a "Artículos" chip appears the moment the
first `articulo` is imported).

## Source locations

- Cartas al director: `~/Desktop/felipe_skill_voice/cartas/sent/<mes>/<fecha>_<slug>.md`
- Columnas: `~/Desktop/felipe_skill_voice/columnas/` (prefer the `_plain.md`; if
  only a `_CIPER.md` exists, the script flattens its links)
- LinkedIn artículos: `~/Desktop/linkedin-articles/linkedin/<fecha>_<slug>/articulo.md`

## Preview before writing

Add `--dry` to print exactly what would be written without creating the file —
use it to confirm the title/date/topics and that the signature was stripped:

```bash
node scripts/import-escrito.js --type carta --source "<...>" --topics economia --dry
```

## Batch import

To import many at once, loop over source files, passing the topics you chose per
file (see the commit that first imported the cartas for the pattern). Re-running
on an already-imported file is a no-op unless you pass `--force`.
