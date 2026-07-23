#!/usr/bin/env node
/*
 * import-escrito.js — turn one source writing file (carta al director, columna,
 * or LinkedIn artículo) into an Escritos collection file under src/writing/posts/.
 *
 * It does the mechanical part of the import that is easy to get wrong by hand:
 *   - pulls the title and date from the source (front matter or filename),
 *   - strips the parts that must NOT be published: the email "Asunto sugerido"
 *     line, the duplicated H1, and (critically) the signature block with RUT and
 *     phone number that cartas al director carry,
 *   - flattens markdown citation links [texto](url) -> texto for a clean read,
 *   - writes the collection file with the right front matter.
 *
 * Topic assignment is the human/editorial call, so --topics is required. A
 * future agent reads the piece, decides which of the 9 taxonomy topics fit
 * (see src/_data/tax.js), and passes them.
 *
 * Usage:
 *   node scripts/import-escrito.js --type carta \
 *     --source "C:/Users/Beetlejuice/Desktop/felipe_skill_voice/cartas/sent/julio/2026-07-17_ley-ia-no-audita-al-estado.md" \
 *     --topics ia,justicia
 *
 * Flags:
 *   --source <path>     (required) the source .md file
 *   --type <t>          (required) carta | columna | articulo
 *   --topics <a,b>      (required) comma-separated topic slugs from tax.js
 *   --title "<t>"       (optional) override the inferred title
 *   --date <YYYY-MM-DD> (optional) override the inferred date
 *   --slug <slug>       (optional) override the inferred URL slug
 *   --medium "<m>"      (optional) where it ran (only if actually published)
 *   --out <dir>         (optional) output dir (default: src/writing/posts)
 *   --force             (optional) overwrite an existing output file
 *   --dry               (optional) print what would be written, write nothing
 */

const fs = require("fs");
const path = require("path");

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

function fail(msg) {
  console.error("import-escrito: " + msg);
  process.exit(1);
}

// Very small front-matter reader: returns { data, body }. Only handles the flat
// `key: value` pairs these source files use; good enough, avoids a dependency.
function splitFrontMatter(raw) {
  const lines = raw.split(/\r?\n/);
  if (lines[0] !== "---") return { data: {}, body: raw };
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "---") { end = i; break; }
  }
  if (end === -1) return { data: {}, body: raw };
  const data = {};
  for (let i = 1; i < end; i++) {
    const m = lines[i].match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (m) {
      let v = m[2].trim();
      if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
      data[m[1]] = v;
    }
  }
  return { data: data, body: lines.slice(end + 1).join("\n") };
}

function firstDateInName(name) {
  const m = name.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

// LinkedIn articles live in <date>_<slug>/articulo.md, so their date/slug come
// from the parent directory, not the (generic) filename. Return the "naming
// token" for a source: its filename, unless that filename is generic (articulo,
// index, articulo.md), in which case the parent directory name.
function namingToken(source) {
  const base = path.basename(source);
  const stem = base.replace(/\.md$/i, "");
  if (/^(articulo|index|articulo\.md)$/i.test(stem)) {
    return path.basename(path.dirname(source));
  }
  return stem;
}

// slug from a naming token: drop leading date, drop known suffixes, tidy.
function slugFromName(token) {
  let s = token.replace(/\.md$/i, "");
  s = s.replace(/^\d{4}-\d{2}-\d{2}[_-]?/, "");
  s = s.replace(/_(CIPER|plain|250_anos)$/i, "");
  s = s.replace(/^columna_/i, "");
  s = s.replace(/[_\s]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return s.toLowerCase();
}

function firstH1(body) {
  const m = body.match(/^#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : null;
}

function cleanBody(body) {
  let lines = body.split(/\r?\n/);
  // Drop the email subject-suggestion line(s).
  lines = lines.filter(function (l) { return !/^Asunto sugerido/i.test(l.trim()); });
  // Drop the first ATX H1 (the title is rendered from front matter).
  let removedH1 = false;
  lines = lines.filter(function (l) {
    if (!removedH1 && /^#\s+/.test(l)) { removedH1 = true; return false; }
    return true;
  });
  // Cut the signature block: everything from the "Felipe Carvajal Brown" line on.
  const sigIdx = lines.findIndex(function (l) { return /^Felipe Carvajal Brown\s*$/.test(l.trim()); });
  if (sigIdx !== -1) lines = lines.slice(0, sigIdx);
  let text = lines.join("\n");
  // Flatten markdown links [texto](url) -> texto.
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  // Collapse 3+ blank lines and trim.
  text = text.replace(/\n{3,}/g, "\n\n").trim();
  return text;
}

function inferTitle(type, data, body) {
  if (type === "carta") {
    let t = data.asunto || firstH1(body) || "";
    return t.replace(/^Carta:\s*/i, "").trim();
  }
  if (type === "articulo") {
    return (data.seo_title || firstH1(body) || "").trim();
  }
  // columna
  return (firstH1(body) || "").trim();
}

function inferDate(type, data, token) {
  if (data.fecha) return data.fecha.trim();
  const fromName = firstDateInName(token);
  if (fromName) return fromName;
  return null;
}

function yamlString(s) {
  return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
}

function main() {
  const args = parseArgs(process.argv);
  const source = args.source;
  const type = args.type;
  const topicsRaw = args.topics;

  if (!source) fail("missing --source");
  if (!type || ["carta", "columna", "articulo"].indexOf(type) === -1) {
    fail("--type must be one of: carta | columna | articulo");
  }
  if (!topicsRaw || topicsRaw === true) fail("missing --topics (comma-separated slugs from src/_data/tax.js)");
  if (!fs.existsSync(source)) fail("source file not found: " + source);

  const raw = fs.readFileSync(source, "utf8");
  const parsed = splitFrontMatter(raw);
  const token = namingToken(source);

  const title = (args.title && args.title !== true) ? args.title : inferTitle(type, parsed.data, parsed.body);
  const date = (args.date && args.date !== true) ? args.date : inferDate(type, parsed.data, token);
  const slug = (args.slug && args.slug !== true) ? args.slug : slugFromName(token);
  const topics = topicsRaw.split(",").map(function (t) { return t.trim(); }).filter(Boolean);
  const body = cleanBody(parsed.body);

  if (!title) fail("could not infer a title; pass --title");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) fail("could not infer a valid date; pass --date YYYY-MM-DD (got: " + date + ")");
  if (!slug) fail("could not infer a slug; pass --slug");
  if (!body) fail("empty body after cleaning; check the source file");

  const outDir = (args.out && args.out !== true) ? args.out : path.join("src", "writing", "posts");
  const outName = date + "-" + slug + ".md";
  const outPath = path.join(outDir, outName);

  let fm = "---\n";
  fm += "title: " + yamlString(title) + "\n";
  fm += "date: " + date + "\n";
  fm += "type: " + type + "\n";
  fm += "topics: [" + topics.join(", ") + "]\n";
  if (args.medium && args.medium !== true) fm += "medium: " + yamlString(args.medium) + "\n";
  fm += "---\n\n";
  const out = fm + body + "\n";

  if (args.dry) {
    console.log("--- would write " + outPath + " ---");
    console.log(out);
    return;
  }
  if (fs.existsSync(outPath) && !args.force) {
    fail("output exists (use --force to overwrite): " + outPath);
  }
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, out, "utf8");
  console.log("wrote " + outPath + "  [" + type + " | " + date + " | " + topics.join(",") + "]");
}

main();
