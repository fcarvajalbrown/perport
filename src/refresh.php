<?php
/**
 * Refreshes data.json from the GitHub API. Intended to be run only via an
 * hPanel cron job (php refresh.php); does nothing if requested over HTTP.
 */

if (php_sapi_name() !== 'cli') {
    exit;
}

define('GITHUB_USER', 'fcarvajalbrown');
define('OUTPUT_PATH', __DIR__ . '/data.json');
define('TOKEN_CONFIG_PATH', __DIR__ . '/../gh_config.php');

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

function filter_repos($repos)
{
    return array_values(array_filter($repos, function ($repo) {
        $isFork = !empty($repo['fork']);
        $name = strtolower($repo['name'] ?? '');
        return !$isFork && $name !== 'perport';
    }));
}

function write_snapshot_atomic($data, $outputPath)
{
    $tmpPath = $outputPath . '.tmp';
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
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
        $profile = fetch_profile($token);
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
