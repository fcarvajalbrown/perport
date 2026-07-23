// Portfolio behavior. The repo cards and profile are rendered into the HTML at
// build time (see src/_data/repos.js), so this script does NOT fetch repo data.
// It hydrates the pre-rendered cards: 3D tilt, the detail modal, and an
// on-demand README fetch when a card is opened. READMEs are the only live
// GitHub call, and only on modal open.

const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours (README cache)
const CACHE_VERSION = 'v3';

function cacheGet(key) {
    try {
        const raw = localStorage.getItem(`gh_${CACHE_VERSION}_${key}`);
        if (!raw) return null;
        const { ts, data } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL_MS) {
            localStorage.removeItem(`gh_${CACHE_VERSION}_${key}`);
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

function cacheSet(key, data) {
    try {
        localStorage.setItem(`gh_${CACHE_VERSION}_${key}`, JSON.stringify({ ts: Date.now(), data }));
    } catch {
        // storage full or disabled
    }
}

const modal = document.getElementById('repo-modal');

function timeAgo(dateString) {
    const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    const intervals = { year: 31536000, month: 2592000, week: 604800, day: 86400, hour: 3600, minute: 60 };
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
    return 'just now';
}

// Attach tilt + click + a live "updated" refresh to each pre-rendered card.
function hydrateCards() {
    const cards = document.querySelectorAll('.repo-card');
    cards.forEach((card) => {
        let repo;
        try {
            repo = JSON.parse(card.dataset.repo);
        } catch {
            return;
        }

        const updatedEl = card.querySelector('.repo-updated');
        if (updatedEl && repo.updated_at) updatedEl.textContent = timeAgo(repo.updated_at);

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const rotateX = ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -4;
            const rotateY = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 4;
            card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'rotateX(0) rotateY(0) scale(1)';
        });
        card.addEventListener('click', () => openModal(repo));
    });
}

function openModal(repo) {
    document.getElementById('modal-title').textContent = repo.name;
    document.getElementById('modal-visibility').textContent = repo.fork ? 'Fork' : repo.visibility;
    document.getElementById('modal-desc').textContent = repo.description || 'No description provided.';
    document.getElementById('modal-stars').textContent = `${repo.stargazers_count} star${repo.stargazers_count !== 1 ? 's' : ''}`;
    document.getElementById('modal-forks').textContent = `${repo.forks_count} fork${repo.forks_count !== 1 ? 's' : ''}`;
    document.getElementById('modal-updated').textContent = `Updated ${timeAgo(repo.updated_at)}`;
    document.getElementById('modal-lang').textContent = repo.language || 'Unknown';
    document.getElementById('modal-lang-dot').style.background = repo.lang_color || '#8b949e';

    const topicsContainer = document.getElementById('modal-topics');
    topicsContainer.innerHTML = '';
    if (repo.topics && repo.topics.length > 0) {
        repo.topics.forEach((topic) => {
            const tag = document.createElement('span');
            tag.className = 'topic-tag';
            tag.textContent = topic;
            topicsContainer.appendChild(tag);
        });
    }

    document.getElementById('modal-link').href = repo.html_url;

    const homepageBtn = document.getElementById('modal-homepage');
    if (repo.homepage) {
        homepageBtn.href = repo.homepage;
        homepageBtn.classList.remove('hidden');
    } else {
        homepageBtn.classList.add('hidden');
    }

    const readmeContainer = document.getElementById('modal-readme');
    const readmeContent = document.getElementById('modal-readme-content');
    readmeContainer.classList.add('hidden');
    readmeContent.innerHTML = '<p class="readme-loading">Loading README...</p>';

    fetchReadme(repo.owner_login, repo.name).then((text) => {
        if (text && window.marked) {
            readmeContent.innerHTML = window.marked.parse(text, { breaks: true, gfm: true });
            readmeContainer.classList.remove('hidden');
        }
    });

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
}

function decodeBase64(str) {
    try {
        const binary = atob(str.replace(/\s/g, ''));
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return new TextDecoder().decode(bytes);
    } catch {
        return null;
    }
}

async function fetchReadme(owner, repo) {
    const cacheKey = `readme_${owner}_${repo}`;
    const cached = cacheGet(cacheKey);
    if (cached) return cached;

    try {
        const res = await fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}/readme`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        const text = data.content ? decodeBase64(data.content) : null;
        if (text) cacheSet(cacheKey, text);
        return text;
    } catch {
        return null;
    }
}

function fetchWithTimeout(url, opts = {}, ms = 8000) {
    return Promise.race([
        fetch(url, opts),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms)),
    ]);
}

// --- Daily background refresh -------------------------------------------
// The cards are baked into the HTML at build time (instant paint + SEO). On top
// of that, an hPanel cron refreshes /data.json once a day with the same trimmed
// shape; here we fetch it after paint (non-blocking, HTTP-cached) and update the
// cards in place so stars/times/new repos stay current between deploys.

const STAR_SVG = '<svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>';
const FORK_SVG = '<svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.25a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm0 2.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm0 2.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm0 2.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zM10 3.25a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm0 2.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm0 2.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm0 2.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z"/></svg>';

// Build a card DOM node from a trimmed repo object. Text fields go through
// textContent (never innerHTML), so repo strings can't inject markup. Only our
// own constant SVGs and the server-derived lang_color hex touch innerHTML.
function buildCard(repo) {
    const card = document.createElement('div');
    card.className = 'repo-card';
    card.dataset.repo = JSON.stringify(repo);
    const langHtml = repo.language
        ? `<span class="repo-lang"><span class="lang-dot" style="background:${repo.lang_color || '#8b949e'}"></span><span class="lang-name"></span></span>`
        : '';
    card.innerHTML = `
        <div class="repo-header">
            <span class="repo-name"></span>
            <span class="repo-visibility"></span>
        </div>
        <p class="repo-desc"></p>
        <div class="repo-footer">
            ${langHtml}
            <span class="repo-stars">${STAR_SVG}<span class="stars-n"></span></span>
            <span class="repo-forks">${FORK_SVG}<span class="forks-n"></span></span>
            <span class="repo-updated"></span>
        </div>`;
    card.querySelector('.repo-name').textContent = repo.name;
    card.querySelector('.repo-visibility').textContent = repo.fork ? 'Fork' : repo.visibility;
    card.querySelector('.repo-desc').textContent = repo.description || 'No description provided.';
    if (repo.language) card.querySelector('.lang-name').textContent = repo.language;
    card.querySelector('.stars-n').textContent = repo.stargazers_count;
    card.querySelector('.forks-n').textContent = repo.forks_count;
    card.querySelector('.repo-updated').textContent = repo.updated_display || timeAgo(repo.updated_at);
    return card;
}

function updateProfile(p) {
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el && val != null) el.textContent = val;
    };
    set('name', p.name);
    set('stat-repos', p.public_repos);
    set('stat-followers', p.followers);
    set('stat-following', p.following);
    const bio = document.getElementById('bio');
    if (bio && p.bio) bio.textContent = p.bio;
}

async function backgroundRefresh() {
    let data;
    try {
        // 10-minute cache bucket: the URL is stable within a window (so it's
        // cacheable) but rotates, so a stale CDN copy is never pinned for hours.
        const bucket = Math.floor(Date.now() / 600000);
        const res = await fetchWithTimeout('/data.json?v=' + bucket, {}, 8000);
        if (!res.ok) return;
        data = await res.json();
    } catch {
        return; // no snapshot / offline: keep the baked cards
    }
    if (!data || !Array.isArray(data.repos) || data.repos.length === 0) return;

    const grid = document.getElementById('repos-grid');
    if (grid) {
        const fragment = document.createDocumentFragment();
        data.repos.forEach((repo, i) => {
            const card = buildCard(repo);
            card.style.animationDelay = `${(i % 12) * 0.05}s`;
            fragment.appendChild(card);
        });
        grid.replaceChildren(fragment);
        hydrateCards();
    }
    if (data.profile) updateProfile(data.profile);
}

// Modal listeners
modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
modal.querySelector('.modal-close').addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
});

function init() {
    hydrateCards();       // wire up the baked cards immediately
    backgroundRefresh();  // then refresh from the daily snapshot, if present
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
