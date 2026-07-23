#!/usr/bin/php
<?php
/**
 * Shebang above lets hPanel's cron run this by bare path (`timeout <path>`);
 * PHP ignores the shebang line. It's also runnable as `php refresh.php`.
 *
 * Refreshes data.json from the GitHub API for the portfolio's daily background
 * update. Emits the SAME trimmed, card-ready shape as src/_data/repos.js
 * (build-time), so script.js can drop the repos straight into the pre-rendered
 * cards. Intended to run only via an hPanel cron job (php refresh.php); does
 * nothing if requested over HTTP.
 */

if (php_sapi_name() !== 'cli') {
    exit;
}

define('GITHUB_USER', 'fcarvajalbrown');
define('OUTPUT_PATH', __DIR__ . '/data.json');
define('TOKEN_CONFIG_PATH', __DIR__ . '/../gh_config.php');

// Repos to hide (lowercased). Keep in sync with EXCLUDE in src/_data/repos.js.
const EXCLUDE = ['perport', 'segovia-rd'];

// GitHub language colors. Keep in sync with LANG_COLORS in src/_data/repos.js.
const LANG_COLORS = [
    'JavaScript' => '#f1e05a', 'TypeScript' => '#2b7489', 'Python' => '#3572A5',
    'Java' => '#b07219', 'C++' => '#f34b7d', 'C' => '#555555', 'C#' => '#178600',
    'Go' => '#00ADD8', 'Rust' => '#dea584', 'Ruby' => '#701516', 'PHP' => '#4F5D95',
    'Swift' => '#ffac45', 'Kotlin' => '#A97BFF', 'Dart' => '#00B4AB', 'HTML' => '#e34c26',
    'CSS' => '#563d7c', 'Shell' => '#89e051', 'Vue' => '#41b883', 'Svelte' => '#ff3e00',
    'Dockerfile' => '#384d54', 'Jupyter Notebook' => '#DA5B0B', 'Scala' => '#c22d40',
    'Elixir' => '#6e4a7e', 'Haskell' => '#5e5086', 'Lua' => '#000080', 'Perl' => '#0298c3',
    'R' => '#198CE7', 'MATLAB' => '#e16737', 'Assembly' => '#6E4C13', 'Clojure' => '#db5855',
    'Julia' => '#a270ba', 'Solidity' => '#AA6746', 'PowerShell' => '#012456',
    'SQL' => '#e38c00', 'YAML' => '#cb171e', 'Markdown' => '#083fa1', 'Tex' => '#3D6117',
    'WebAssembly' => '#04133b',
];

function load_token()
{
    $envToken = getenv('GITHUB_TOKEN');
    if ($envToken !== false && $envToken !== '') {
        return $envToken;
    }
    if (is_file(TOKEN_CONFIG_PATH)) {
        $config = include TOKEN_CONFIG_PATH;
        if (is_array($config) && !empty($config['token'])) {
            return $config['token'];
        }
    }
    return null;
}

function github_request($url, $token)
{
    $headers = [
        'User-Agent: perport-refresh',
        'Accept: application/vnd.github+json',
    ];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $body = curl_exec($ch);
    if ($body === false) {
        $error = curl_error($ch);
        curl_close($ch);
        throw new RuntimeException("cURL error for {$url}: {$error}");
    }
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($status !== 200) {
        throw new RuntimeException("GitHub API returned status {$status} for {$url}");
    }

    $data = json_decode($body, true);
    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        throw new RuntimeException("Failed to parse JSON from {$url}: " . json_last_error_msg());
    }
    return $data;
}

function fetch_profile($token)
{
    return github_request('https://api.github.com/users/' . GITHUB_USER, $token);
}

function fetch_all_repos($token)
{
    $repos = [];
    $page = 1;
    do {
        $url = 'https://api.github.com/users/' . GITHUB_USER
            . '/repos?sort=updated&per_page=100&page=' . $page;
        $pageData = github_request($url, $token);
        if (!is_array($pageData)) {
            throw new RuntimeException("Unexpected repos response shape on page {$page}");
        }
        $repos = array_merge($repos, $pageData);
        $page++;
    } while (count($pageData) === 100);

    return $repos;
}

function time_ago($dateString)
{
    $seconds = time() - strtotime($dateString);
    $units = ['year' => 31536000, 'month' => 2592000, 'week' => 604800,
        'day' => 86400, 'hour' => 3600, 'minute' => 60];
    foreach ($units as $unit => $s) {
        $n = intdiv($seconds, $s);
        if ($n >= 1) {
            return $n . ' ' . $unit . ($n > 1 ? 's' : '') . ' ago';
        }
    }
    return 'just now';
}

function trim_repo($repo)
{
    $language = $repo['language'] ?? null;
    return [
        'name' => $repo['name'] ?? '',
        'description' => $repo['description'] ?? null,
        'html_url' => $repo['html_url'] ?? '',
        'homepage' => $repo['homepage'] ?? null,
        'language' => $language,
        'stargazers_count' => $repo['stargazers_count'] ?? 0,
        'forks_count' => $repo['forks_count'] ?? 0,
        'updated_at' => $repo['updated_at'] ?? null,
        'topics' => isset($repo['topics']) && is_array($repo['topics']) ? $repo['topics'] : [],
        'fork' => !empty($repo['fork']),
        'visibility' => $repo['visibility'] ?? 'public',
        'owner_login' => $repo['owner']['login'] ?? GITHUB_USER,
        'lang_color' => LANG_COLORS[$language] ?? '#8b949e',
        'updated_display' => $repo['updated_at'] ? time_ago($repo['updated_at']) : '',
    ];
}

function filter_repos($repos)
{
    $kept = array_filter($repos, function ($repo) {
        $isFork = !empty($repo['fork']);
        $name = strtolower($repo['name'] ?? '');
        return !$isFork && !in_array($name, EXCLUDE, true);
    });
    return array_values(array_map('trim_repo', $kept));
}

function trim_profile($profile)
{
    return [
        'name' => $profile['name'] ?? ($profile['login'] ?? GITHUB_USER),
        'login' => $profile['login'] ?? GITHUB_USER,
        'bio' => $profile['bio'] ?? '',
        'public_repos' => $profile['public_repos'] ?? 0,
        'followers' => $profile['followers'] ?? 0,
        'following' => $profile['following'] ?? 0,
    ];
}

function write_snapshot_atomic($data, $outputPath)
{
    $tmpPath = $outputPath . '.tmp';
    $json = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        throw new RuntimeException('Failed to encode snapshot JSON: ' . json_last_error_msg());
    }
    if (file_put_contents($tmpPath, $json) === false) {
        throw new RuntimeException("Failed to write temp file {$tmpPath}");
    }
    if (!rename($tmpPath, $outputPath)) {
        throw new RuntimeException("Failed to rename {$tmpPath} to {$outputPath}");
    }
}

function main()
{
    $token = load_token();
    try {
        $profile = trim_profile(fetch_profile($token));
        $repos = filter_repos(fetch_all_repos($token));
        $snapshot = [
            'generated_at' => gmdate('Y-m-d\TH:i:s\Z'),
            'profile' => $profile,
            'repos' => $repos,
        ];
        write_snapshot_atomic($snapshot, OUTPUT_PATH);
        fwrite(STDOUT, 'Snapshot written: ' . count($repos) . " repos\n");
        exit(0);
    } catch (Throwable $e) {
        fwrite(STDERR, 'Refresh failed: ' . $e->getMessage() . "\n");
        exit(1);
    }
}

main();
