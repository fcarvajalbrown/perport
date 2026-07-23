// Build-time GitHub data for the portfolio. Runs once per Eleventy build:
// fetches the profile + repos, trims to the fields the page actually uses
// (the raw API payload is ~400KB of mostly unused `_url` fields), filters out
// forks and the `perport` repo, and attaches a language color + a relative
// "updated" label. The last good result is cached to .cache/gh.json so repeated
// or offline builds don't hammer the API or break.
//
// Freshness model: repos are as current as the last build/deploy (deploy-time),
// so there is NO per-visitor GitHub fetch. Re-run a build to refresh.
const fs = require("fs");
const path = require("path");

const USER = "fcarvajalbrown";
const CACHE = path.join(__dirname, "..", "..", ".cache", "gh.json");
const CACHE_TTL_MS = 60 * 60 * 1000; // reuse a cached fetch within the hour

// GitHub's per-language brand colors (single source of truth: used for both the
// server-rendered card dots and, via each card's embedded JSON, the modal).
const LANG_COLORS = {
  JavaScript: "#f1e05a", TypeScript: "#2b7489", Python: "#3572A5", Java: "#b07219",
  "C++": "#f34b7d", C: "#555555", "C#": "#178600", Go: "#00ADD8", Rust: "#dea584",
  Ruby: "#701516", PHP: "#4F5D95", Swift: "#ffac45", Kotlin: "#A97BFF", Dart: "#00B4AB",
  HTML: "#e34c26", CSS: "#563d7c", Shell: "#89e051", Vue: "#41b883", Svelte: "#ff3e00",
  Dockerfile: "#384d54", "Jupyter Notebook": "#DA5B0B", Scala: "#c22d40", Elixir: "#6e4a7e",
  Haskell: "#5e5086", Lua: "#000080", Perl: "#0298c3", R: "#198CE7", MATLAB: "#e16737",
  Assembly: "#6E4C13", Clojure: "#db5855", Julia: "#a270ba", Solidity: "#AA6746",
  PowerShell: "#012456", SQL: "#e38c00", YAML: "#cb171e", Markdown: "#083fa1",
  Tex: "#3D6117", WebAssembly: "#04133b",
};

const KEEP = ["name", "description", "html_url", "homepage", "language",
  "stargazers_count", "forks_count", "updated_at", "topics", "fork", "visibility"];

function timeAgo(dateString) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  const units = [["year", 31536000], ["month", 2592000], ["week", 604800],
    ["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [unit, s] of units) {
    const n = Math.floor(seconds / s);
    if (n >= 1) return n + " " + unit + (n > 1 ? "s" : "") + " ago";
  }
  return "just now";
}

async function ghJson(url) {
  const headers = { "User-Agent": "perport-build", Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = "Bearer " + process.env.GITHUB_TOKEN;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error("GitHub " + res.status + " for " + url);
  return res.json();
}

function trimRepo(r) {
  const out = {};
  KEEP.forEach(function (k) { out[k] = r[k]; });
  out.owner_login = (r.owner && r.owner.login) ? r.owner.login : USER;
  out.lang_color = LANG_COLORS[r.language] || "#8b949e";
  out.updated_display = timeAgo(r.updated_at);
  out.topics = Array.isArray(r.topics) ? r.topics : [];
  return out;
}

function readCache() {
  try { return JSON.parse(fs.readFileSync(CACHE, "utf8")); } catch (e) { return null; }
}
function writeCache(data) {
  try {
    fs.mkdirSync(path.dirname(CACHE), { recursive: true });
    fs.writeFileSync(CACHE, JSON.stringify(data));
  } catch (e) { /* cache is best-effort */ }
}

module.exports = async function () {
  const cached = readCache();
  if (cached && cached.fetchedAt && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached;
  }
  try {
    const profile = await ghJson("https://api.github.com/users/" + USER);
    let repos = [];
    for (let page = 1; page <= 5; page++) {
      const batch = await ghJson("https://api.github.com/users/" + USER +
        "/repos?sort=updated&per_page=100&page=" + page);
      repos = repos.concat(batch);
      if (batch.length < 100) break;
    }
    const filtered = repos
      .filter(function (r) { return !r.fork && (r.name || "").toLowerCase() !== "perport"; })
      .map(trimRepo);
    const data = {
      profile: {
        name: profile.name || profile.login,
        login: profile.login,
        bio: profile.bio || "",
        public_repos: profile.public_repos,
        followers: profile.followers,
        following: profile.following,
      },
      repos: filtered,
      fetchedAt: Date.now(),
    };
    writeCache(data);
    console.log("[repos.js] fetched " + filtered.length + " repos from GitHub");
    return data;
  } catch (e) {
    console.warn("[repos.js] GitHub fetch failed (" + e.message + "); using cache/empty");
    if (cached) return cached;
    return {
      profile: { name: "Felipe Carvajal Brown", login: USER, bio: "", public_repos: 0, followers: 0, following: 0 },
      repos: [], fetchedAt: 0,
    };
  }
};
