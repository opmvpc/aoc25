@echo off
REM AoC 2025 Runner Wrapper
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%.." && npx tsx "%SCRIPT_DIR%runner\dist\cli.js" %*
