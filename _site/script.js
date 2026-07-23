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

// Modal listeners
modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
modal.querySelector('.modal-close').addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrateCards);
} else {
    hydrateCards();
}
