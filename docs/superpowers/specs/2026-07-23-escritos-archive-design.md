# Escritos archive — design spec

Date: 2026-07-23
Status: Approved (design), pending implementation
Author: Felipe Carvajal Brown

## Goal

Turn the `/writing/` stub ("Escritos", currently "en construcción") into a real,
filterable archive of Felipe's writing, sourced verbatim from existing files on
disk. Visitors browse the pieces and narrow them by **topic** (multi-select) and
by **type**. No content is invented: every body is copied from Felipe's own
files; titles, dates, and temas come from the source files and their logs.

## Sources

Two desktop folders (git repos), used in two phases:

1. **`~/Desktop/felipe_skill_voice`** (Phase 1)
   - `columnas/` and `columnas/sent/` — columnas de opinión (long-form).
   - `cartas/sent/{junio,julio}/` — cartas al director (~50 short, dated pieces).
   - Metadata: `columnas_log.csv`, `cartas_log.csv` (fecha, tema, título, medio,
     palabras, published status). Used to seed titles/dates/topics.
   - Out of scope for this section: `papers/`, `discursos/`, `propuestas/`, `voz/`.
2. **`~/Desktop/linkedin-articles/linkedin/*/`** (Phase 2)
   - One folder per article: `articulo.md` (front matter: `seo_title`,
     `seo_description`, `hashtags`, `cover`) + `cover.png`.

## Content model

An Eleventy collection, tagged `escrito`.

- One Markdown file per escrito under `src/writing/posts/<slug>.md`.
- Front matter:
  - `title` — string (from source header / log).
  - `date` — ISO date (from filename/log).
  - `type` — `carta` | `columna` | `articulo`.
  - `topics` — array of topic slugs (see taxonomy); a piece may carry several.
  - `medium` — optional string (where it was published/sent, e.g. "El Mercurio",
    "CIPER", "LinkedIn").
  - `layout: escrito.njk`, `tags: escrito`, `lang: es`.
- Body: copied verbatim from the source file (the plain/canonical version, not
  the CIPER or HTML export). Felipe's words are untouched.
- The build step and manual-verification workflow are unchanged (`npx
  @11ty/eleventy`, then click-through); `_site/` stays committed.

## Taxonomy (9 topics)

Slugs are stable identifiers; labels are display text (Spanish).

| slug        | label                                   | covers |
|-------------|-----------------------------------------|--------|
| ia          | Inteligencia Artificial                 | Ley IA, algoritmos del Estado, Thiel/Palantir, brecha de IA, citas fabricadas |
| trabajo     | Trabajo y empleo                        | tercerización (183-A), despido, informalidad, salarios tech, caso BC Tecnología |
| economia    | Economía y fiscalidad                   | megarreforma, deuda, impuestos, cobre, presupuesto, desigualdad OCDE |
| software    | Software e ingeniería                   | arquitectura de software, Rust, simulación numérica, biomimética, open source |
| govtech     | GovTech, datos y transparencia          | auditar al Estado, MySQL municipal, Mercado Público, Ley 21.663, datos abiertos |
| ciudad      | Vivienda, ciudad e infraestructura      | Plan Habitacional, Puerto San Antonio, Ley Uber, escuelas/sismo, patrimonio |
| ciencia     | Ciencia, medio ambiente y educación     | FYST, I+D, glaciares, litio, agua, gratuidad, integridad académica |
| justicia    | Justicia, derechos e instituciones      | INDH, conducción temeraria, niños haitianos, Ley de Cuotas |
| politica    | Política y partidos                     | PS base vs. cúpula, Partido Radical, 4 de julio, identidad socialista |

Topics cross-cut all types. Topic assignment per piece is curated by Felipe
during implementation (proposed by Claude from the `tema` metadata, then edited).

## The archive page (`/writing/`)

Replaces the stub. Single filterable list, all escritos visible by default,
sorted by `date` descending.

- **Filter bar** (top of page):
  - Multi-select **topic chips** — one per taxonomy topic, plus a "Todos" reset.
    Clicking chips ANDs across the type filter and ORs within topics: a card
    shows if it has *any* selected topic (or none selected) *and* matches the
    type filter.
  - **Type filter** — Todas / Cartas / Columnas / Artículos (single-select).
  - **Live count** ("N escritos") and an **empty state** when a combination
    yields nothing.
- **Cards** — título, fecha, tipo, topic chips (non-interactive on the card),
  linking to the individual page. Each card carries `data-topics` and
  `data-type` attributes the filter JS reads.
- **Filtering** is client-side JS in a new file loaded only on `/writing/`
  (same architectural pattern as the portfolio's `script.js`; no build-time
  filtering, no server dependency).

## Individual pages (`/writing/<slug>/`)

- Rendered by `src/_includes/escrito.njk`, which wraps the shared `layout.njk`.
- Shows: título (editorial serif), fecha, tipo, topic chips, optional `medium`,
  a "← Volver a Escritos" link, and the body in a readable single-column
  editorial measure.
- Uses the `.page-editorial` warm accent (`#d9a55c`).

## Styling

- Extend `src/styles.css`: filter bar, topic chips (active/inactive states),
  escrito cards, individual escrito prose column, empty state.
- Reuse existing editorial tokens; no new color system.

## Bilingual handling

Escritos are Spanish. `/writing/` is already the shared page for both the ES and
EN nav trees (per `src/_data/strings.js`). That stays: the EN nav points here and
content remains Spanish. Translating ~50 cartas is out of scope.

## Microcopy / humanizer

All framing text written by Claude (filter labels, "Todos", "N escritos", empty
state, "Volver a Escritos", any page lede) passes the project's AI-tell scrub
BEFORE being written (see project `CLAUDE.md`). No em-dash-as-inciso, no AI
muletillas, varied rhythm, real facts only. The escrito bodies are Felipe's
untouched words and are exempt (they are already in his voice).

## Curation workflow (implementation-time)

Because Felipe hand-picks, before anything goes live Claude presents titled
lists grouped by proposed topic (a readable grouped list, since the interactive
picker can't hold ~50 checkboxes). Felipe strikes out what he does not want and
adjusts topic assignments. Only approved pieces become collection files.

## Phasing

- **Phase 1** — Build the collection, `escrito.njk` layout, filter UI, styling,
  and individual pages; populate with hand-picked **columnas + cartas**. Deploy.
- **Phase 2** — Fold in the **LinkedIn artículos** (`type: articulo`), including
  their cover images, into the same list and filter. Separate approval before
  starting.

Each phase is committed task-by-task; per-file confirmation is not required once
the plan is approved, but the phase boundary (1 → 2) is an explicit check-in.

## Out of scope

- Translating escritos to English.
- Publishing papers, discursos, or propuestas (possible future "Obras" work).
- Full-text search, pagination, RSS (can be added later if the archive grows).
- Any change to the portfolio, home, or works pages beyond what the shared
  layout/styles require.

## Verification

Manual (no test suite): `npx @11ty/eleventy` builds without errors; `/writing/`
lists the pieces; topic + type filters narrow correctly and the count/empty
state update; an individual escrito page renders with correct metadata and body;
mobile nav and filter bar work at ≤640px.
