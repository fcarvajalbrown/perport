const GITHUB_USER = 'fcarvajalbrown';
const REPOS_PER_PAGE = 12;
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function cacheGet(key) {
    try {
        const raw = localStorage.getItem(`gh_${key}`);
        if (!raw) return null;
        const { ts, data } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL_MS) {
            localStorage.removeItem(`gh_${key}`);
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

function cacheSet(key, data) {
    try {
        localStorage.setItem(`gh_${key}`, JSON.stringify({ ts: Date.now(), data }));
    } catch {
        // storage full or disabled
    }
}

const languageColors = {
    JavaScript: '#f1e05a',
    TypeScript: '#2b7489',
    Python: '#3572A5',
    Java: '#b07219',
    'C++': '#f34b7d',
    C: '#555555',
    'C#': '#178600',
    Go: '#00ADD8',
    Rust: '#dea584',
    Ruby: '#701516',
    PHP: '#4F5D95',
    Swift: '#ffac45',
    Kotlin: '#A97BFF',
    Dart: '#00B4AB',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Shell: '#89e051',
    Vue: '#41b883',
    React: '#61dafb',
    Svelte: '#ff3e00',
    Dockerfile: '#384d54',
    'Jupyter Notebook': '#DA5B0B',
    Scala: '#c22d40',
    Elixir: '#6e4a7e',
    Haskell: '#5e5086',
    Lua: '#000080',
    Perl: '#0298c3',
    R: '#198CE7',
    MATLAB: '#e16737',
    Arduino: '#00979D',
    Groovy: '#e69f56',
    'Objective-C': '#438eff',
    'Objective-C++': '#6866fb',
    Assembly: '#6E4C13',
    Clojure: '#db5855',
    'Emacs Lisp': '#c065db',
    'Common Lisp': '#3fb68b',
    Erlang: '#B83998',
    Fortran: '#4d41b1',
    Julia: '#a270ba',
    OCaml: '#3be133',
    Pascal: '#E3F171',
    Prolog: '#74283c',
    Scheme: '#1e4aec',
    Solidity: '#AA6746',
    VBA: '#867db1',
    PowerShell: '#012456',
    SQL: '#e38c00',
    GraphQL: '#e10098',
    YAML: '#cb171e',
    JSON: '#292929',
    XML: '#0060ac',
    Markdown: '#083fa1',
    Tex: '#3D6117',
    WebAssembly: '#04133b',
};

let allRepos = [];
let displayedCount = 0;
let isLoading = false;
let currentPage = 1;

const reposGrid = document.getElementById('repos-grid');
const sentinel = document.getElementById('sentinel');
const modal = document.getElementById('repo-modal');

function getLangColor(lang) {
    return languageColors[lang] || '#8b949e';
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60,
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }
    return 'just now';
}

async function fetchProfile() {
    const cached = cacheGet('profile');
    if (cached) {
        renderProfile(cached);
        return;
    }
    try {
        const res = await fetchWithTimeout(`https://api.github.com/users/${GITHUB_USER}`);
        if (!res.ok) {
            if (res.status === 403) throw new Error('Rate limited by GitHub API (status 403)');
            const body = await res.text();
            throw new Error(`Failed to load profile (status ${res.status}): ${body}`);
        }
        const data = await res.json();
        cacheSet('profile', data);
        renderProfile(data);

    } catch (err) {
        console.error(err);
        const avatar = document.getElementById('avatar-img');
        avatar.src = `https://github.com/${GITHUB_USER}.png`;
        avatar.onerror = null;
        document.getElementById('name').textContent = GITHUB_USER;
        document.getElementById('bio').textContent = 'Portfolio';

        // Show a helpful error above the repos grid with exact API message/status
        const reposGrid = document.getElementById('repos-grid');
        const existing = reposGrid.querySelector('.error');
        const message = err && err.message ? err.message : 'Unknown error';
        if (!existing) {
            const errDiv = document.createElement('div');
            errDiv.className = 'error';
            errDiv.innerHTML = `<strong>Profile load error:</strong> ${escapeHtml(message)}`;
            reposGrid.prepend(errDiv);
        } else {
            existing.innerHTML = `<strong>Profile load error:</strong> ${escapeHtml(message)}`;
        }
    }
}

function renderProfile(data) {
    const avatar = document.getElementById('avatar-img');
    avatar.src = data.avatar_url || `https://github.com/${GITHUB_USER}.png`;
    avatar.onerror = () => { avatar.src = `https://github.com/${GITHUB_USER}.png`; };

    document.getElementById('name').textContent = data.name || data.login;
    document.getElementById('bio').textContent = data.bio || `GitHub user @${data.login}`;
    document.getElementById('stat-repos').textContent = data.public_repos;
    document.getElementById('stat-followers').textContent = data.followers;
    document.getElementById('stat-following').textContent = data.following;
}

async function fetchReposPage(page) {
    const cacheKey = `repos_page_${page}`;
    const cached = cacheGet(cacheKey);
    if (cached) return cached;

    const url = `https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=${REPOS_PER_PAGE}&page=${page}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Failed to load repos (status ${res.status}): ${body}`);
    }
    const data = await res.json();
    cacheSet(cacheKey, data);
    return data;
}

function createRepoCard(repo, index) {
    const card = document.createElement('div');
    card.className = 'repo-card';
    card.style.animationDelay = `${(index % REPOS_PER_PAGE) * 0.05}s`;
    card.dataset.repo = JSON.stringify(repo);

    const langColor = getLangColor(repo.language);
    const updated = timeAgo(repo.updated_at);

    card.innerHTML = `
        <div class="repo-header">
            <span class="repo-name">${escapeHtml(repo.name)}</span>
            <span class="repo-visibility">${repo.fork ? 'Fork' : repo.visibility}</span>
        </div>
        <p class="repo-desc">${escapeHtml(repo.description || 'No description provided.')}</p>
        <div class="repo-footer">
            ${repo.language ? `
                <span class="repo-lang">
                    <span class="lang-dot" style="background:${langColor}"></span>
                    ${escapeHtml(repo.language)}
                </span>
            ` : ''}
            <span class="repo-stars">
                <svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z"/></svg>
                ${repo.stargazers_count}
            </span>
            <span class="repo-forks">
                <svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.25a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm0 2.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm0 2.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm0 2.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zM10 3.25a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm0 2.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm0 2.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zm0 2.75a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z"/></svg>
                ${repo.forks_count}
            </span>
            <span class="repo-updated">${updated}</span>
        </div>
    `;

    // 3D tilt effect on mouse move
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;
        card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'rotateX(0) rotateY(0) scale(1)';
    });

    card.addEventListener('click', () => openModal(repo));

    return card;
}

function renderNextBatch() {
    const next = allRepos.slice(displayedCount, displayedCount + REPOS_PER_PAGE);
    if (next.length === 0) return false;

    // Remove loading if present
    const loading = reposGrid.querySelector('.loading');
    if (loading) loading.remove();

    const fragment = document.createDocumentFragment();
    next.forEach((repo, i) => {
        fragment.appendChild(createRepoCard(repo, displayedCount + i));
    });
    reposGrid.appendChild(fragment);

    displayedCount += next.length;
    return true;
}

function showSentinelLoading() {
    const existing = sentinel.querySelector('.sentinel-loading');
    if (existing) return;

    const div = document.createElement('div');
    div.className = 'sentinel-loading';
    div.innerHTML = `<div class="spinner"></div><span>Loading more...</span>`;
    sentinel.appendChild(div);
}

function hideSentinelLoading() {
    sentinel.innerHTML = '';
}

async function loadMoreRepos() {
    if (isLoading) return;
    isLoading = true;
    showSentinelLoading();

    try {
        const repos = await fetchReposPage(currentPage);

        if (repos.length === 0) {
            hideSentinelLoading();
            if (displayedCount === 0) {
                reposGrid.innerHTML = '<div class="empty">No public repositories found.</div>';
            }
            observer.disconnect();
            return;
        }

        allRepos.push(...repos);
        renderNextBatch();
        currentPage++;
        hideSentinelLoading();
    } catch (err) {
        console.error(err);
        hideSentinelLoading();
        const message = err && err.message ? err.message : 'Unknown error';
        if (displayedCount === 0) {
            reposGrid.innerHTML = `<div class="error"><strong>Unable to load repositories:</strong><br>${escapeHtml(message)}<br>Please try again later.</div>`;
        } else {
            // Non-blocking error banner
            let existing = reposGrid.querySelector('.error');
            if (!existing) {
                existing = document.createElement('div');
                existing.className = 'error';
                reposGrid.prepend(existing);
            }
            existing.innerHTML = `<strong>Repository load error:</strong> ${escapeHtml(message)}`;
        }
        observer.disconnect();
    } finally {
        isLoading = false;
    }
}

// Infinite scroll observer
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        loadMoreRepos();
    }
}, { rootMargin: '200px' });

// Modal functions
function openModal(repo) {
    document.getElementById('modal-title').textContent = repo.name;
    document.getElementById('modal-visibility').textContent = repo.fork ? 'Fork' : repo.visibility;
    document.getElementById('modal-desc').textContent = repo.description || 'No description provided.';
    document.getElementById('modal-stars').textContent = `${repo.stargazers_count} star${repo.stargazers_count !== 1 ? 's' : ''}`;
    document.getElementById('modal-forks').textContent = `${repo.forks_count} fork${repo.forks_count !== 1 ? 's' : ''}`;
    document.getElementById('modal-updated').textContent = `Updated ${timeAgo(repo.updated_at)}`;
    document.getElementById('modal-lang').textContent = repo.language || 'Unknown';
    document.getElementById('modal-lang-dot').style.background = getLangColor(repo.language);

    const topicsContainer = document.getElementById('modal-topics');
    topicsContainer.innerHTML = '';
    if (repo.topics && repo.topics.length > 0) {
        repo.topics.forEach(topic => {
            const tag = document.createElement('span');
            tag.className = 'topic-tag';
            tag.textContent = topic;
            topicsContainer.appendChild(tag);
        });
    }

    const linkBtn = document.getElementById('modal-link');
    linkBtn.href = repo.html_url;

    const homepageBtn = document.getElementById('modal-homepage');
    if (repo.homepage) {
        homepageBtn.href = repo.homepage;
        homepageBtn.classList.remove('hidden');
    } else {
        homepageBtn.classList.add('hidden');
    }

    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Event listeners
modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);
modal.querySelector('.modal-close').addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
        closeModal();
    }
});

function fetchWithTimeout(url, opts = {}, ms = 8000) {
    return Promise.race([
        fetch(url, opts),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timed out')), ms)
        )
    ]);
}

// Clear any old corrupted cache from before this version
(function clearOldCache() {
    try {
        const keys = Object.keys(localStorage).filter(k => k.startsWith('gh_'));
        keys.forEach(k => localStorage.removeItem(k));
    } catch { /* ignore */ }
})();

// Init after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    fetchProfile();
    loadMoreRepos();
    observer.observe(sentinel);
});
