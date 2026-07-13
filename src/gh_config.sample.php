<?php
// Copy this file to gh_config.php ONE DIRECTORY ABOVE public_html on the
// Hostinger server (never inside public_html, and never commit the real
// file). refresh.php reads it to authenticate GitHub API requests.
//
// Use a fine-grained Personal Access Token, read-only, scoped to public
// repositories only. This does not require large rate-limit headroom (the
// refresh only makes 1-2 requests every 6 hours) — the token exists so the
// refresh isn't affected by Hostinger's shared-IP unauthenticated rate limit.
return [
    'token' => 'github_pat_REPLACE_ME',
];
