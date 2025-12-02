/**
 * 🏗️ AoC 2025 Battle Royale - Sync Tools Library
 * Fonctions exportables pour synchroniser le runner vers les agents
 */

import {
  mkdir,
  copyFile,
  writeFile,
  readdir,
  rm,
  stat,
} from "node:fs/promises";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

export const AGENTS = ["claude", "codex", "gemini"] as const;
export type Agent = (typeof AGENTS)[number];

export interface SyncOptions {
  root: string;
  agents?: readonly string[];
  silent?: boolean;
  skipBuild?: boolean;
}

export interface SyncResult {
  success: boolean;
  builtRunner: boolean;
  syncedAgents: string[];
  errors: string[];
}

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

export async function buildRunner(
  root: string,
  silent = false
): Promise<{ success: boolean; error?: string }> {
  if (!silent) console.log("🔨 Building runner...");

  try {
    execSync("npm run build", {
      cwd: join(root, "core", "runner"),
      stdio: silent ? "pipe" : "inherit",
    });
    if (!silent) console.log("✅ Runner built successfully\n");
    return { success: true };
  } catch (err) {
    const error = `Failed to build runner: ${
      err instanceof Error ? err.message : String(err)
    }`;
    if (!silent) console.error(`❌ ${error}`);
    return { success: false, error };
  }
}

export async function syncToAgent(
  root: string,
  agent: string,
  silent = false
): Promise<{ success: boolean; error?: string }> {
  const toolsDir = join(root, "agents", agent, "tools");
  const runnerSrcDir = join(root, "core", "runner");
  const runnerDestDir = join(toolsDir, "runner");

  if (!silent) console.log(`🤖 Syncing to ${agent}...`);

  try {
    // Clean existing
    await rm(runnerDestDir, { recursive: true, force: true });

    // Create tools dir
    await mkdir(toolsDir, { recursive: true });
    await mkdir(runnerDestDir, { recursive: true });

    // Copy dist/
    const distSrc = join(runnerSrcDir, "dist");
    if (existsSync(distSrc)) {
      await copyDir(distSrc, join(runnerDestDir, "dist"));
    } else {
      return { success: false, error: "Runner dist/ not found. Build first." };
    }

    // Copy package.json
    await copyFile(
      join(runnerSrcDir, "package.json"),
      join(runnerDestDir, "package.json")
    );

    // Create types.js for solver imports
    await writeFile(
      join(runnerDestDir, "types.js"),
      `// Re-export types for solver imports\nexport * from "./dist/types.js";\n`
    );

    // Copy C common header
    const cHeaderSrc = join(runnerSrcDir, "c", "common.h");
    if (existsSync(cHeaderSrc)) {
      const cHeaderDir = join(runnerDestDir, "c");
      await mkdir(cHeaderDir, { recursive: true });
      await copyFile(cHeaderSrc, join(cHeaderDir, "common.h"));
      if (!silent) console.log(`  ✅ C common header synced`);
    }

    // Create shell wrapper (Unix)
    const shellWrapper = `#!/bin/bash
# AoC 2025 Runner Wrapper
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
AGENT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ROOT_DIR="$(cd "$AGENT_DIR/../.." && pwd)"

# Export agent dir for the runner to detect
export AOC_AGENT_DIR="$AGENT_DIR"

# Run from root where node_modules exists
cd "$ROOT_DIR" && npx tsx "$ROOT_DIR/core/runner/dist/cli.js" "$@"
`;
    await writeFile(join(toolsDir, "aoc"), shellWrapper);

    // Create batch wrapper (Windows)
    const batchWrapper = `@echo off
REM AoC 2025 Runner Wrapper
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%.." && npx tsx "%SCRIPT_DIR%runner\\dist\\cli.js" %*
`;
    await writeFile(join(toolsDir, "aoc.bat"), batchWrapper);

    // Create PowerShell wrapper
    const psWrapper = `# AoC 2025 Runner Wrapper
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $ScriptDir "..")
npx tsx (Join-Path $ScriptDir "runner\\dist\\cli.js") $args
`;
    await writeFile(join(toolsDir, "aoc.ps1"), psWrapper);

    if (!silent) {
      console.log(`  ✅ Runner synced`);
      console.log(`  ✅ Created aoc wrapper (bash/bat/ps1)`);
    }

    return { success: true };
  } catch (err) {
    const error = `Sync failed: ${
      err instanceof Error ? err.message : String(err)
    }`;
    if (!silent) console.error(`  ❌ ${error}`);
    return { success: false, error };
  }
}

export async function syncTools(options: SyncOptions): Promise<SyncResult> {
  const { root, agents = AGENTS, silent = false, skipBuild = false } = options;

  const result: SyncResult = {
    success: true,
    builtRunner: false,
    syncedAgents: [],
    errors: [],
  };

  if (!silent) {
    console.log("🏗️  AoC 2025 Battle Royale - Sync Tools\n");
    console.log("═".repeat(50) + "\n");
  }

  // Build runner first (unless skipped)
  if (!skipBuild) {
    const buildResult = await buildRunner(root, silent);
    if (!buildResult.success) {
      result.success = false;
      if (buildResult.error) result.errors.push(buildResult.error);
      return result;
    }
    result.builtRunner = true;
  }

  // Sync to each agent
  for (const agent of agents) {
    const syncResult = await syncToAgent(root, agent, silent);
    if (syncResult.success) {
      result.syncedAgents.push(agent);
    } else {
      result.success = false;
      if (syncResult.error) result.errors.push(syncResult.error);
    }
    if (!silent) console.log("");
  }

  if (!silent) {
    console.log("═".repeat(50));
    if (result.success) {
      console.log("✨ Tools synced to all agents!");
      console.log("\nUsage from agent directory:");
      console.log("  ./tools/aoc run 1 1 --sample");
      console.log("  ./tools/aoc check 1 1 --sample");
    } else {
      console.log("❌ Some syncs failed. Check errors above.");
    }
  }

  return result;
}
