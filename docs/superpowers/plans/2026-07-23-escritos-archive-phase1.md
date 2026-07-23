# Escritos Archive (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the `/writing/` stub into a filterable Escritos archive (columnas + hand-picked cartas), with multi-select topic chips and a type filter, plus one page per piece.

**Architecture:** An Eleventy collection tagged `escrito`, one Markdown file per piece under `src/writing/posts/`. A single source-of-truth data file (`src/_data/tax.js`) holds the topic taxonomy and type labels. `src/writing/index.njk` renders every piece as a card carrying `data-type` / `data-topics`; a small client-side script (`src/escritos.js`, loaded only on that page, mirroring how `/portfolio/` loads `script.js`) shows/hides cards. Each piece renders through `src/_includes/escrito.njk`, which wraps the shared `layout.njk`.

**Tech Stack:** Eleventy (11ty) + Nunjucks, plain vanilla JS, plain CSS. No new dependencies. No test suite — verification is a local build (`npx @11ty/eleventy`) plus manual click-through, per project `CLAUDE.md`.

## Global Constraints

- **Humanize BEFORE writing any visitor-facing string** (labels, ledes, empty states, microcopy). No em-dash-as-inciso, no AI muletillas, varied rhythm, real facts only. Escrito bodies are Felipe's untouched words and are exempt. (project `CLAUDE.md`, HARD RULE)
- **No emojis anywhere** — code, comments, docs, commits.
- **No AI attribution** in commits or anywhere. Commit and push directly to `master`; **do not open a PR** unless explicitly asked.
- **Never invent facts.** Titles/dates/temas come from Felipe's source files and logs; bodies are copied verbatim. Where a date or title is uncertain, confirm with Felipe rather than guessing.
- **Build output `_site/` is committed** (the deploy serves it). Rebuild with `npx @11ty/eleventy` before the final commit.
- Source content lives at `~/Desktop/felipe_skill_voice/` (Windows: `C:\Users\Beetlejuice\Desktop\felipe_skill_voice`). Do not modify those source files; copy from them.
- Verify cycle for every task: `npx @11ty/eleventy` builds with no errors, then `cd _site && python -m http.server 8000` and eyeball the affected page (desktop + ≤640px).

---

### Task 1: Taxonomy data, date filters, escrito layout, one real seed piece

**Files:**
- Create: `src/_data/tax.js`
- Modify: `.eleventy.js` (add two date filters + one passthrough)
- Create: `src/_includes/escrito.njk`
- Create: `src/writing/posts/posts.json` (directory data: layout, tag, permalink)
- Create: `src/writing/posts/2026-07-09_tercerizacion-bc-tecnologia.md` (seed columna)

**Interfaces:**
- Produces: `tax.topics` (ordered array of `{slug,label}`), `tax.labelOf` (`{slug: label}`), `tax.tipos` (`{carta|columna|articulo: {singular, plural}}`) — consumed by Tasks 2 and later.
- Produces: Nunjucks filters `fechaLarga` (Date -> "9 de julio de 2026") and `isoDate` (Date -> "2026-07-09").
- Produces: collection `collections.escrito` (every file tagged `escrito`), each item at permalink `/writing/<fileSlug>/`.

- [ ] **Step 1: Create the taxonomy data file**

`src/_data/tax.js`:

```js
// Single source of truth for the Escritos taxonomy and type labels.
// `topics` order is also the display order of the filter chips.
const topics = [
  { slug: "ia",       label: "Inteligencia Artificial" },
  { slug: "trabajo",  label: "Trabajo y empleo" },
  { slug: "economia", label: "Economía y fiscalidad" },
  { slug: "software", label: "Software e ingeniería" },
  { slug: "govtech",  label: "GovTech, datos y transparencia" },
  { slug: "ciudad",   label: "Vivienda, ciudad e infraestructura" },
  { slug: "ciencia",  label: "Ciencia, medio ambiente y educación" },
  { slug: "justicia", label: "Justicia, derechos e instituciones" },
  { slug: "politica", label: "Política y partidos" },
];

const labelOf = {};
topics.forEach(function (t) { labelOf[t.slug] = t.label; });

const tipos = {
  carta:    { singular: "Carta al director", plural: "Cartas" },
  columna:  { singular: "Columna",           plural: "Columnas" },
  articulo: { singular: "Artículo",          plural: "Artículos" },
};

module.exports = { topics: topics, labelOf: labelOf, tipos: tipos };
```

- [ ] **Step 2: Add date filters and the escritos.js passthrough to `.eleventy.js`**

Inside `module.exports = function (eleventyConfig) { ... }`, after the existing `bust` filter (around line 20), add:

```js
  // Spanish long-date formatting for escritos. Read UTC fields so a date-only
  // front-matter value ("2026-07-09") is not shifted a day by local timezone.
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  eleventyConfig.addFilter("fechaLarga", function (d) {
    const dt = new Date(d);
    return dt.getUTCDate() + " de " + MESES[dt.getUTCMonth()] + " de " + dt.getUTCFullYear();
  });
  eleventyConfig.addFilter("isoDate", function (d) {
    return new Date(d).toISOString().slice(0, 10);
  });
```

And next to the other `addPassthroughCopy` lines (around line 24), add:

```js
  eleventyConfig.addPassthroughCopy({ "src/escritos.js": "escritos.js" });
```

- [ ] **Step 3: Create the posts directory-data file**

`src/writing/posts/posts.json` (applies to every file in `posts/`, so each piece needs only its own front matter):

```json
{
  "layout": "escrito.njk",
  "tags": "escrito",
  "lang": "es",
  "permalink": "/writing/{{ page.fileSlug }}/"
}
```

- [ ] **Step 4: Create the escrito layout**

`src/_includes/escrito.njk`:

```njk
---
layout: layout.njk
bodyClass: page-editorial
---
<article class="escrito">
    <a class="escrito-back" href="/writing/">&larr; Volver a Escritos</a>
    <p class="escrito-eyebrow">{{ tax.tipos[type].singular }}{% if medium %} · {{ medium }}{% endif %}</p>
    <h1 class="escrito-title">{{ title }}</h1>
    <p class="escrito-date"><time datetime="{{ page.date | isoDate }}">{{ page.date | fechaLarga }}</time></p>
    {% if topics.length %}
    <ul class="escrito-topics">
        {% for t in topics %}<li class="topic-chip">{{ tax.labelOf[t] }}</li>{% endfor %}
    </ul>
    {% endif %}
    <div class="escrito-body">
        {{ content | safe }}
    </div>
</article>
```

- [ ] **Step 5: Create the seed piece (real columna, verbatim body)**

Create `src/writing/posts/2026-07-09_tercerizacion-bc-tecnologia.md`. Front matter below; for the body, copy the prose **verbatim** from `~/Desktop/felipe_skill_voice/columnas/sent/columna_tercerizacion_bc_tecnologia_plain.md`, **stripping** (a) any leading "Asunto sugerido..." email-subject line and (b) the trailing signature block ("Felipe Carvajal Brown / Magíster... / Ñuñoa..."). Keep the article's own `#` H1 out of the body (the layout renders `title`); start the body at the first prose paragraph.

```markdown
---
title: "El Estado sabe nombrar el fraude laboral, pero se prohibió decirlo"
date: 2026-07-09
type: columna
topics: [trabajo, justicia]
---

<paste the verbatim prose paragraphs from the plain.md here, minus subject line, H1, and signature>
```

- [ ] **Step 6: Build and verify the individual page renders**

Run: `npx @11ty/eleventy`
Expected: build succeeds; console lists `writing/tercerizacion-bc-tecnologia/index.html` (or similar) written.

Run: `cd _site && python -m http.server 8000`, open `http://localhost:8000/writing/tercerizacion-bc-tecnologia/`
Expected: page shows the eyebrow "Columna", the title, "9 de julio de 2026", topic chips "Trabajo y empleo" + "Justicia, derechos e instituciones", the full body, and a "← Volver a Escritos" link. Warm accent (`#d9a55c`) on accented elements. (Styling is minimal until Task 4; content correctness is what matters here.)

- [ ] **Step 7: Commit**

```bash
git add src/_data/tax.js .eleventy.js src/_includes/escrito.njk src/writing/posts/
git commit -m "feat(escritos): taxonomy data, date filters, escrito layout, seed columna"
```

---

### Task 2: Rebuild `/writing/` as the archive index (render only, no JS yet)

**Files:**
- Delete: `src/writing/index.md` (the stub)
- Create: `src/writing/index.njk`

**Interfaces:**
- Consumes: `collections.escrito`, `tax.topics`, `tax.labelOf`, `tax.tipos`, filters `fechaLarga` / `isoDate` (Task 1).
- Produces: DOM contract for Task 3 — `#escritos-list` containing `li.escrito-card[data-type][data-topics]`; filter controls `.chip-topic[data-topic]` and `.chip-type[data-type]`; `#escritos-count`; `#escritos-empty`.

- [ ] **Step 1: Delete the stub**

```bash
git rm src/writing/index.md
```

- [ ] **Step 2: Create the archive index template**

`src/writing/index.njk` (the lede/labels below already pass the humanizer scrub — plain, factual, no muletillas, no em-dash-as-inciso):

```njk
---
layout: layout.njk
title: Escritos
description: "Cartas al director, columnas y artículos de Felipe Carvajal Brown sobre tecnología, trabajo y lo público. Filtra por tema o por tipo."
lang: es
bodyClass: page-editorial
altUrl: /en/
---
<div class="editorial-body escritos">
    <p class="editorial-eyebrow">Escritos</p>
    <h1 class="editorial-title">Cartas, columnas y <em>artículos</em>.</h1>
    <p class="editorial-lede">Textos sobre tecnología, trabajo y lo público. Filtra por tema o por tipo.</p>

    <div class="escritos-filter" id="escritos-filter">
        <div class="filter-group filter-topics" role="group" aria-label="Filtrar por tema">
            <button class="chip chip-topic is-active" data-topic="all" type="button">Todos</button>
            {% for t in tax.topics %}
            <button class="chip chip-topic" data-topic="{{ t.slug }}" type="button">{{ t.label }}</button>
            {% endfor %}
        </div>
        <div class="filter-group filter-types" role="group" aria-label="Filtrar por tipo">
            <button class="chip chip-type is-active" data-type="all" type="button">Todas</button>
            <button class="chip chip-type" data-type="carta" type="button">Cartas</button>
            <button class="chip chip-type" data-type="columna" type="button">Columnas</button>
            <button class="chip chip-type" data-type="articulo" type="button">Artículos</button>
        </div>
        <p class="escritos-count" id="escritos-count" aria-live="polite"></p>
    </div>

    <ul class="escritos-list" id="escritos-list">
        {% for e in collections.escrito | reverse %}
        <li class="escrito-card" data-type="{{ e.data.type }}" data-topics="{{ e.data.topics | join(' ') }}">
            <a class="escrito-card-link" href="{{ e.url }}">
                <span class="escrito-card-eyebrow">{{ tax.tipos[e.data.type].singular }}{% if e.data.medium %} · {{ e.data.medium }}{% endif %}</span>
                <span class="escrito-card-title">{{ e.data.title }}</span>
                <time class="escrito-card-date" datetime="{{ e.date | isoDate }}">{{ e.date | fechaLarga }}</time>
                <span class="escrito-card-topics">
                    {% for t in e.data.topics %}<span class="topic-chip">{{ tax.labelOf[t] }}</span>{% endfor %}
                </span>
            </a>
        </li>
        {% endfor %}
    </ul>
    <p class="escritos-empty" id="escritos-empty" hidden>No hay escritos con esa combinación. Prueba con otro tema o tipo.</p>
</div>
```

- [ ] **Step 3: Build and verify the index renders**

Run: `npx @11ty/eleventy`
Expected: build succeeds; `/writing/index.html` written.

Open `http://localhost:8000/writing/`
Expected: the "Escritos" header + lede, a row of topic chips (Todos + 9 topics) and type chips (Todas/Cartas/Columnas/Artículos), and one card (the seed columna) linking to its page. Chips do nothing yet (no JS). Nav "Escritos" is marked active.

- [ ] **Step 4: Commit**

```bash
git add src/writing/index.njk
git commit -m "feat(escritos): filterable archive index (render), replace stub"
```

---

### Task 3: Client-side filter (topic multi-select + type + count/empty)

**Files:**
- Create: `src/escritos.js`
- Modify: `src/writing/index.njk` (append the script tag)

**Interfaces:**
- Consumes: the DOM contract from Task 2.
- Behavior: type is single-select (`all` default); topics are multi-select (empty = all). A card is visible when `(type == all OR card.type == type)` AND `(no topics selected OR card shares any selected topic)`. Count and empty-state update on every change.

- [ ] **Step 1: Create the filter script**

`src/escritos.js`:

```js
(function () {
  var list = document.getElementById('escritos-list');
  if (!list) return;

  var cards = Array.prototype.slice.call(list.querySelectorAll('.escrito-card'));
  var topicButtons = Array.prototype.slice.call(document.querySelectorAll('.chip-topic'));
  var typeButtons = Array.prototype.slice.call(document.querySelectorAll('.chip-type'));
  var countEl = document.getElementById('escritos-count');
  var emptyEl = document.getElementById('escritos-empty');
  var allTopicBtn = document.querySelector('.chip-topic[data-topic="all"]');

  var activeTopics = {};          // set of selected topic slugs; empty = all
  var activeType = 'all';

  function topicCount() {
    return Object.keys(activeTopics).length;
  }

  function apply() {
    var shown = 0;
    var hasTopicFilter = topicCount() > 0;
    cards.forEach(function (card) {
      var cardType = card.getAttribute('data-type');
      var cardTopics = (card.getAttribute('data-topics') || '').split(/\s+/);
      var typeOk = activeType === 'all' || cardType === activeType;
      var topicOk = !hasTopicFilter || cardTopics.some(function (t) { return activeTopics[t]; });
      var visible = typeOk && topicOk;
      card.hidden = !visible;
      if (visible) shown++;
    });
    countEl.textContent = shown + (shown === 1 ? ' escrito' : ' escritos');
    emptyEl.hidden = shown !== 0;
  }

  topicButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var topic = btn.getAttribute('data-topic');
      if (topic === 'all') {
        activeTopics = {};
        topicButtons.forEach(function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-topic') === 'all');
        });
      } else {
        if (activeTopics[topic]) {
          delete activeTopics[topic];
          btn.classList.remove('is-active');
        } else {
          activeTopics[topic] = true;
          btn.classList.add('is-active');
        }
        if (allTopicBtn) allTopicBtn.classList.toggle('is-active', topicCount() === 0);
      }
      apply();
    });
  });

  typeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      activeType = btn.getAttribute('data-type');
      typeButtons.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      apply();
    });
  });

  apply();
})();
```

- [ ] **Step 2: Wire the script into the index**

In `src/writing/index.njk`, add as the last line of the file (after the closing `</div>`), matching how `/portfolio/` loads its script:

```njk
<script src="{{ '/escritos.js' | bust }}"></script>
```

- [ ] **Step 3: Build and verify filtering works**

Run: `npx @11ty/eleventy`
Open `http://localhost:8000/writing/`
Expected with the single seed card present:
- Count reads "1 escrito".
- Click topic "Trabajo y empleo": card stays (it has that topic); count "1 escrito"; "Todos" chip goes inactive.
- Click topic "Economía y fiscalidad" as well (multi-select): card still shows (shares Trabajo); both chips active.
- Click type "Cartas": card hides; count "0 escritos"; empty-state text appears.
- Click type "Todas" then topic "Todos": back to "1 escrito", empty-state hidden.

(With only one seed piece the filtering is thin but provable; it gets exercised for real after the imports.)

- [ ] **Step 4: Commit**

```bash
git add src/escritos.js src/writing/index.njk
git commit -m "feat(escritos): client-side topic + type filtering"
```

---

### Task 4: Styling (filter bar, chips, cards, escrito page, empty state)

**Files:**
- Modify: `src/styles.css` (append a new section at end of file)

**Interfaces:**
- Consumes: existing tokens `--bg`, `--bg-elevated`, `--border`, `--border-hover`, `--text`, `--text-muted`, `--text-dim`, `--accent` (which `.page-editorial` overrides to `#d9a55c`).

- [ ] **Step 1: Append the escritos styles**

Add at the end of `src/styles.css`:

```css
/* ===== Escritos archive ===== */
.escritos {
    max-width: 860px;
}

.escritos-filter {
    margin: 2.5rem 0 0.5rem;
}
.filter-group {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}
.filter-types {
    padding-top: 0.75rem;
    border-top: 1px solid var(--border);
}
.chip {
    font: inherit;
    font-size: 0.85rem;
    color: var(--text-muted);
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.35rem 0.85rem;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
}
.chip:hover {
    border-color: var(--border-hover);
    color: var(--text);
}
.chip.is-active {
    color: var(--bg);
    background: var(--accent);
    border-color: var(--accent);
    font-weight: 600;
}
.escritos-count {
    color: var(--text-dim);
    font-size: 0.85rem;
    margin: 0.25rem 0 0;
}

.escritos-list {
    list-style: none;
    margin: 1.5rem 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}
.escrito-card[hidden] { display: none; }
.escrito-card-link {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding: 1.1rem 1.25rem;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 10px;
    text-decoration: none;
    transition: border-color 0.15s;
}
.escrito-card-link:hover {
    border-color: var(--accent);
}
.escrito-card-eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.72rem;
    color: var(--text-dim);
}
.escrito-card-title {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 1.25rem;
    color: var(--text);
    line-height: 1.35;
}
.escrito-card-date {
    font-size: 0.85rem;
    color: var(--text-muted);
}
.escrito-card-topics {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.4rem;
}
.topic-chip {
    font-size: 0.72rem;
    color: var(--accent);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.15rem 0.55rem;
    list-style: none;
}
.escritos-empty {
    color: var(--text-muted);
    margin-top: 1.5rem;
}

/* Individual escrito page */
.page-editorial .escrito {
    max-width: 720px;
    margin: 0 auto;
    padding: 4rem 1.5rem 0;
}
.escrito-back {
    display: inline-block;
    color: var(--text-muted);
    text-decoration: none;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
}
.escrito-back:hover { color: var(--accent); }
.escrito-eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.78rem;
    color: var(--text-dim);
    margin-bottom: 0.5rem;
}
.escrito-title {
    font-family: Georgia, 'Times New Roman', serif;
    font-weight: 400;
    font-size: 2.2rem;
    line-height: 1.2;
    color: var(--text);
    margin: 0 0 0.75rem;
}
.escrito-date {
    color: var(--text-muted);
    font-size: 0.9rem;
    margin: 0 0 1rem;
}
.escrito-topics {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    padding: 0;
    margin: 0 0 2rem;
}
.escrito-body {
    font-size: 1.1rem;
    line-height: 1.8;
    color: var(--text);
}
.escrito-body p { margin: 0 0 1.4rem; }

@media (max-width: 640px) {
    .escrito-title { font-size: 1.7rem; }
    .escrito-body { font-size: 1rem; }
}
```

- [ ] **Step 2: Build and verify styling**

Run: `npx @11ty/eleventy`
Open `http://localhost:8000/writing/` and the seed escrito page.
Expected: chips are pill-shaped; active chip fills warm amber with dark text; card has elevated background and hovers to an amber border; the escrito page reads as a single serif column with comfortable measure. Check ≤640px: chips wrap, title shrinks, nav toggle still works.

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "feat(escritos): styling for filter, cards, and article pages"
```

---

### Task 5: Curate and import the columnas

This task is interactive with Felipe (hand-pick). It produces one collection file per approved columna.

**Files:**
- Create: `src/writing/posts/<date>_<slug>.md` (one per approved columna)

**Source columnas** (in `~/Desktop/felipe_skill_voice/columnas/` and `columnas/sent/`), canonical bodies (prefer `_plain.md`, else the base `.md`, never the `_CIPER.md` or `.html`/`.pdf`):
- `columna_ley_ia_vigilancia_thiel_plain.md` — "Once principios para la máquina, ninguno para el Estado" (topics: ia, politica)
- `2026-07-05_synco-y-mi-alcalde_CIPER.md` — "Lo que Synco soñó, y lo que mi alcalde no contestó" (topics: govtech, politica)
- `columna_4_de_julio_250_anos.md` — "Por qué celebro el 4 de julio siendo socialista" (topics: politica)
- `ps_base_vs_cupula_CIPER.md` — "Cuarenta personas un sábado a las diez" (topics: politica)
- (the tercerización columna is already imported as the Task 1 seed)

- [ ] **Step 1: Present the columnas list to Felipe for selection**

Show the list above (título, fecha if known, proposed topics) and ask Felipe: which to include, any title/topic edits, and the correct date for any piece whose date is not in a filename or `columnas_log.csv`. Do not guess dates — confirm.

- [ ] **Step 2: Create one collection file per approved columna**

For each, create `src/writing/posts/<date>_<slug>.md` with front matter (`title`, `date`, `type: columna`, `topics: [...]`, optional `medium`) and the **verbatim** body from the canonical source file, stripping any email-subject line, the source H1, and the trailing signature block (same rule as Task 1 Step 5).

- [ ] **Step 3: Build and verify**

Run: `npx @11ty/eleventy`
Open `http://localhost:8000/writing/`
Expected: each approved columna appears as a card, newest first; opening one renders its full body; topic filtering narrows correctly across the several columnas now present.

- [ ] **Step 4: Commit**

```bash
git add src/writing/posts/
git commit -m "content(escritos): import curated columnas"
```

---

### Task 6: Curate and import the cartas, then final verification

Interactive hand-pick, then the full Phase 1 verification and the committed rebuild.

**Files:**
- Create: `src/writing/posts/<date>_<slug>.md` (one per approved carta)
- Modify: `_site/**` (rebuilt output)

**Source cartas:** `~/Desktop/felipe_skill_voice/cartas/sent/{junio,julio}/*.md`; metadata (fecha, tema) in `cartas_log.csv`. Each carta file's date is in its filename (`YYYY-MM-DD_...`).

- [ ] **Step 1: Propose a curated carta shortlist grouped by topic**

From `cartas_log.csv`, present the ~50 cartas grouped under the 9 topics (título/tema + date + proposed topic per row) as a readable list. Recommend a shortlist (strongest pieces / broadest topic spread) but let Felipe strike out or add. The interactive picker cannot hold 50 checkboxes, so this is a grouped text list Felipe edits. Confirm each kept carta's title (derive from the file's H1 or subject; do not invent).

- [ ] **Step 2: Create one collection file per approved carta**

For each approved carta, create `src/writing/posts/<date>_<slug>.md` with front matter (`title`, `date` from the filename, `type: carta`, `topics: [...]`, optional `medium` only if it was actually published somewhere) and the verbatim body (strip subject line, H1, signature).

- [ ] **Step 3: Full Phase 1 verification**

Run: `npx @11ty/eleventy` — no errors.
Open `http://localhost:8000/writing/` and check:
- All columnas + cartas listed, newest first; count matches.
- Type filter: "Cartas" shows only cartas; "Columnas" only columnas; "Todas" resets.
- Topic multi-select: selecting two topics shows the union; deselecting returns; "Todos" resets; empty state shows only for a genuinely empty combination.
- Open several pieces: correct eyebrow/title/date/topics/body, working "Volver" link.
- ≤640px: filter chips wrap, cards and article column read well, nav toggle works.
- Click through the other three nav pages (Home / Portfolio / Obras) to confirm nothing regressed.

- [ ] **Step 4: Rebuild and commit the site output**

```bash
npx @11ty/eleventy
git add src/writing/posts/ _site/
git commit -m "content(escritos): import curated cartas; build site"
git push origin master
```

- [ ] **Step 5: Deploy note (do not run without Felipe's go-ahead)**

Per project `CLAUDE.md`, the live site updates by pulling on the Hostinger server. After push, deploy with:

```bash
ssh -i ~/.ssh/perport_hostinger -p 65002 <user>@<host> \
  "cd ~/domains/fcarvajalbrown.com/repo && git pull origin master"
```

Confirm with Felipe before deploying. Phase 2 (LinkedIn artículos) is a separate plan and a separate approval.

---

## Self-Review

**Spec coverage:**
- Content model (collection, front matter, verbatim bodies) → Tasks 1, 5, 6. ✓
- Taxonomy (9 topics, slugs+labels, multi-topic) → Task 1 (`tax.js`), used in 2/3. ✓
- Archive page (filter bar, multi-select topics, type filter, count, empty state, cards with data-attrs, JS loaded only here) → Tasks 2, 3. ✓
- Individual pages (`escrito.njk`, eyebrow/date/topics/back link, warm accent) → Tasks 1, 4. ✓
- Styling → Task 4. ✓
- Bilingual (Spanish, shared `/writing/`, `altUrl: /en/`) → Task 2 front matter. ✓
- Microcopy humanizer → Global Constraints + Task 2 note. ✓
- Curation workflow (grouped list, hand-pick) → Tasks 5, 6. ✓
- Phasing (Phase 1 here; Phase 2 separate) → Task 6 Step 5. ✓
- Verification (build + click-through + ≤640px) → each task's verify step; full pass in Task 6. ✓

**Placeholder scan:** The only deferred content is verbatim article bodies and Felipe's curation picks, both intentionally external (referenced by exact source path + transformation rule), not vague TODOs. Every code/CSS/JS block is complete.

**Type consistency:** `tax.topics` / `tax.labelOf` / `tax.tipos` used identically across Tasks 1-3. DOM ids (`escritos-list`, `escritos-count`, `escritos-empty`) and classes (`chip-topic`, `chip-type`, `is-active`, `escrito-card`, `data-type`, `data-topics`) match between Task 2 (template), Task 3 (JS), and Task 4 (CSS). Filters `fechaLarga` / `isoDate` defined in Task 1, used in Tasks 1-2. ✓
