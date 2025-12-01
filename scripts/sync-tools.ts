#!/usr/bin/env tsx
/**
 * 🏗️ AoC 2025 Battle Royale - Sync Tools Script
 *
 * Build le runner et le copie dans tous les agents/{claude,codex,gemini}/tools/
 * Crée aussi un wrapper shell/batch "aoc" pour faciliter l'exécution
 *
 * Usage: npm run sync-tools
 */

import {
  mkdir,
  copyFile,
  writeFile,
  readdir,
  stat,
  rm,
} from "node:fs/promises";
import { join } from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const AGENTS = ["claude", "codex", "gemini"] as const;

async function copyDir(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true });

  const entries = await readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function buildRunner(): Promise<void> {
  console.log("🔨 Building runner...");

  try {
    execSync("npm run build", {
      cwd: join(ROOT, "core", "runner"),
      stdio: "inherit",
    });
    console.log("✅ Runner built successfully\n");
  } catch (err) {
    console.error("❌ Failed to build runner");
    process.exit(1);
  }
}

async function syncToAgent(agent: string): Promise<void> {
  const toolsDir = join(ROOT, "agents", agent, "tools");
  const runnerSrcDir = join(ROOT, "core", "runner");
  const runnerDestDir = join(toolsDir, "runner");

  console.log(`🤖 Syncing to ${agent}...`);

  // Clean existing
  try {
    await rm(runnerDestDir, { recursive: true, force: true });
  } catch {
    // Ignore
  }

  // Create tools dir
  await mkdir(toolsDir, { recursive: true });
  await mkdir(runnerDestDir, { recursive: true });

  // Copy dist/
  await copyDir(join(runnerSrcDir, "dist"), join(runnerDestDir, "dist"));

  // Copy package.json
  await copyFile(
    join(runnerSrcDir, "package.json"),
    join(runnerDestDir, "package.json")
  );

  // Create types.js for solver imports (aliases to dist/types.js)
  await writeFile(
    join(runnerDestDir, "types.js"),
    `// Re-export types for solver imports\nexport * from "./dist/types.js";\n`
  );

  // Copy C common header
  const cHeaderDir = join(runnerDestDir, "c");
  await mkdir(cHeaderDir, { recursive: true });
  await copyFile(
    join(runnerSrcDir, "c", "common.h"),
    join(cHeaderDir, "common.h")
  );
  console.log(`  ✅ C common header synced`);

  // Create shell wrapper (Unix)
  const shellWrapper = `#!/bin/bash
# AoC 2025 Runner Wrapper
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.." && npx tsx "$SCRIPT_DIR/runner/dist/cli.js" "$@"
`;
  await writeFile(join(toolsDir, "aoc"), shellWrapper);

  // Create batch wrapper (Windows)
  const batchWrapper = `@echo off
REM AoC 2025 Runner Wrapper
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%.." && npx tsx "%SCRIPT_DIR%runner\\dist\\cli.js" %*
`;
  await writeFile(join(toolsDir, "aoc.bat"), batchWrapper);

  // Create PowerShell wrapper (Windows alternative)
  const psWrapper = `# AoC 2025 Runner Wrapper
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $ScriptDir "..")
npx tsx (Join-Path $ScriptDir "runner\\dist\\cli.js") $args
`;
  await writeFile(join(toolsDir, "aoc.ps1"), psWrapper);

  console.log(`  ✅ Runner synced`);
  console.log(`  ✅ Created aoc wrapper (bash/bat/ps1)`);
}

async function main(): Promise<void> {
  console.log("🏗️  AoC 2025 Battle Royale - Sync Tools\n");
  console.log("═".repeat(50) + "\n");

  // Build runner first
  await buildRunner();

  // Sync to each agent
  for (const agent of AGENTS) {
    await syncToAgent(agent);
    console.log("");
  }

  console.log("═".repeat(50));
  console.log("✨ Tools synced to all agents!");
  console.log("\nUsage from agent directory:");
  console.log("  ./tools/aoc run 1 1 --sample");
  console.log("  ./tools/aoc check 1 1 --sample");
}

main().catch((err) => {
  console.error("❌ Sync failed:", err);
  process.exit(1);
});
