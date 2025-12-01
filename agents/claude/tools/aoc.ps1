# AoC 2025 Runner Wrapper
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $ScriptDir "..")
npx tsx (Join-Path $ScriptDir "runner\dist\cli.js") $args
