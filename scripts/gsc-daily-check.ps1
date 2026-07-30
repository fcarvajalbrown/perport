$ErrorActionPreference = "Stop"

$projectDir = "C:\Projects\portfolio"
$claudeExe = "C:\Users\Beetlejuice\AppData\Roaming\npm\claude.cmd"
$promptFile = Join-Path $projectDir "scripts\gsc-check-prompt.txt"
$debugLog = Join-Path $projectDir "gsc-check-debug.log"

$allowedTools = "mcp__gsc-server__list_properties,mcp__gsc-server__check_indexing_issues,mcp__gsc-server__get_search_analytics,mcp__gsc-server__compare_search_periods,mcp__gsc-server__get_sitemaps,mcp__gsc-server__get_performance_overview,Read,Write,PushNotification"

Set-Location $projectDir

# The prompt is piped via stdin rather than passed as a CLI argument: its
# multi-line text breaks argument parsing through the claude.cmd shim and
# silently drops the --permission-mode/--allowedTools flags that follow it.
$output = Get-Content -Raw -Encoding utf8 $promptFile | & $claudeExe -p --permission-mode bypassPermissions --allowedTools $allowedTools --output-format text 2>&1

$stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"---- $stamp ----" | Out-File -Append -Encoding utf8 $debugLog
$output | Out-File -Append -Encoding utf8 $debugLog
