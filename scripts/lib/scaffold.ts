/**
 * 🏗️ AoC 2025 Battle Royale - Scaffold Library
 * Fonctions exportables pour tester le scaffolding
 */

import {
  mkdir,
  writeFile,
  access,
  readdir,
  copyFile,
  stat,
} from "node:fs/promises";
import { join, dirname } from "node:path";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

export const DAYS = 12;
export const AGENTS = ["claude", "codex", "gemini"] as const;
export type Agent = (typeof AGENTS)[number];

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function writeIfNotExists(
  path: string,
  content: string,
  silent = false
): Promise<boolean> {
  try {
    await access(path);
    if (!silent) console.log(`  ⏭️  Skip (exists): ${path}`);
    return false;
  } catch {
    await ensureDir(dirname(path));
    await writeFile(path, content, "utf-8");
    if (!silent) console.log(`  ✅ Created: ${path}`);
    return true;
  }
}

export function dayDir(day: number): string {
  return `day${day.toString().padStart(2, "0")}`;
}

// ═══════════════════════════════════════════════════════════════
// Templates
// ═══════════════════════════════════════════════════════════════

export const PUZZLE_MD_TEMPLATE = (day: number, part: number) => `# Day ${day
  .toString()
  .padStart(2, "0")} - Part ${part}

## Description

<!-- Coller l'énoncé ici -->

## Notes

<!-- Notes personnelles -->
`;

export const SAMPLE_EXPECTED_JSON = `{
  "part1": null,
  "part2": null
}
`;

export const ANSWERS_JSON = `{
  "part1": null,
  "part2": null
}
`;

export const TS_SOLVER_TEMPLATE = (day: number, part: number) => `/**
 * 🎄 Advent of Code 2025 - Day ${day.toString().padStart(2, "0")} Part ${part}
 * @see https://adventofcode.com/2025/day/${day}
 */

import type { ISolver } from "../../tools/runner/types.js";

export const solver: ISolver = {
  solve(input: string): string {
    const lines = input.trim().split("\\n");

    // TODO: Implement solution

    return "NOT_IMPLEMENTED";
  },
};
`;

export const C_SOLVER_TEMPLATE = (day: number, part: number) => `/**
 * 🎄 Advent of Code 2025 - Day ${day.toString().padStart(2, "0")} Part ${part}
 * Compile: clang -O2 -o part${part} part${part}.c
 * Run: ./part${part} < input.txt
 */

#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(parse);
    // Parse input
    int line_count = 0;
    char** lines = aoc_split_lines(input, &line_count);
    AOC_TIMER_END(parse);

    AOC_TIMER_START(solve);
    // TODO: Implement solution
    long long result = 0;
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(result);

    free(lines);
    aoc_cleanup(input);
    return 0;
}
`;

export const GITKEEP = "";

// Gemini settings to disable web search
export const GEMINI_SETTINGS_JSON = `{
  "tools": {
    "exclude": ["WebSearchTool", "WebFetchTool"]
  }
}
`;

// ═══════════════════════════════════════════════════════════════
// Scaffold Options
// ═══════════════════════════════════════════════════════════════

export interface ScaffoldOptions {
  root: string;
  days?: number;
  agents?: readonly string[];
  silent?: boolean;
  skipSyncTools?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Scaffold Functions
// ═══════════════════════════════════════════════════════════════

export async function scaffoldCoreData(
  options: ScaffoldOptions
): Promise<void> {
  const { root, days = DAYS, silent = false } = options;

  if (!silent) console.log("\n📦 Scaffolding core/data...");

  // Days 0-days (0 is test day)
  for (let day = 0; day <= days; day++) {
    const dir = join(root, "core", "data", dayDir(day));

    await writeIfNotExists(
      join(dir, "puzzle1.md"),
      PUZZLE_MD_TEMPLATE(day, 1),
      silent
    );
    await writeIfNotExists(
      join(dir, "puzzle2.md"),
      PUZZLE_MD_TEMPLATE(day, 2),
      silent
    );
    await writeIfNotExists(join(dir, "sample.txt"), "", silent);
    await writeIfNotExists(
      join(dir, "sample.expected.json"),
      SAMPLE_EXPECTED_JSON,
      silent
    );
    await writeIfNotExists(join(dir, "input.txt"), "", silent);
    await writeIfNotExists(join(dir, "answers.json"), ANSWERS_JSON, silent);
  }
}

export async function scaffoldAgents(options: ScaffoldOptions): Promise<void> {
  const { root, days = DAYS, agents = AGENTS, silent = false } = options;

  if (!silent) console.log("\n🤖 Scaffolding agents...");

  for (const agent of agents) {
    if (!silent) console.log(`\n  📂 ${agent}/`);
    const agentDir = join(root, "agents", agent);

    // Agent-specific MD file
    await writeIfNotExists(
      join(agentDir, `${agent}.md`),
      `# ${agent} Agent\n\nInstructions for ${agent} agent.\n`,
      silent
    );

    // notes/
    await writeIfNotExists(
      join(agentDir, "notes", ".gitkeep"),
      GITKEEP,
      silent
    );

    // data/ (placeholder)
    await writeIfNotExists(join(agentDir, "data", ".gitkeep"), GITKEEP, silent);

    // tools/ (placeholder)
    await writeIfNotExists(
      join(agentDir, "tools", ".gitkeep"),
      GITKEEP,
      silent
    );

    // Gemini-specific: .gemini/settings.json to disable web search
    if (agent === "gemini") {
      await writeIfNotExists(
        join(agentDir, ".gemini", "settings.json"),
        GEMINI_SETTINGS_JSON,
        silent
      );
    }

    // Days 0-days - TS and C templates
    for (let day = 0; day <= days; day++) {
      const tsDir = join(agentDir, "ts", dayDir(day));
      await writeIfNotExists(
        join(tsDir, "part1.ts"),
        TS_SOLVER_TEMPLATE(day, 1),
        silent
      );
      await writeIfNotExists(
        join(tsDir, "part2.ts"),
        TS_SOLVER_TEMPLATE(day, 2),
        silent
      );

      const cDir = join(agentDir, "c", dayDir(day));
      await writeIfNotExists(
        join(cDir, "part1.c"),
        C_SOLVER_TEMPLATE(day, 1),
        silent
      );
      await writeIfNotExists(
        join(cDir, "part2.c"),
        C_SOLVER_TEMPLATE(day, 2),
        silent
      );
    }
  }
}

export async function scaffoldCoreRunner(
  options: ScaffoldOptions
): Promise<void> {
  const { root, silent = false } = options;

  if (!silent) console.log("\n🔧 Scaffolding core/runner...");

  const runnerDir = join(root, "core", "runner");

  await writeIfNotExists(
    join(runnerDir, "package.json"),
    JSON.stringify(
      {
        name: "@aoc25/runner",
        version: "1.0.0",
        type: "module",
        main: "./dist/index.js",
        types: "./dist/index.d.ts",
        bin: { aoc: "./dist/cli.js" },
        scripts: { build: "tsc", dev: "tsc --watch" },
        dependencies: { commander: "^12.0.0" },
        devDependencies: {
          "@types/node": "^20.10.0",
          typescript: "^5.3.0",
        },
      },
      null,
      2
    ),
    silent
  );

  await writeIfNotExists(
    join(runnerDir, "tsconfig.json"),
    JSON.stringify(
      {
        extends: "../../tsconfig.base.json",
        compilerOptions: { outDir: "./dist", rootDir: "./src" },
        include: ["src/**/*"],
      },
      null,
      2
    ),
    silent
  );
}

export async function scaffoldCoreDb(options: ScaffoldOptions): Promise<void> {
  const { root, silent = false } = options;

  if (!silent) console.log("\n🗄️ Scaffolding core/db...");

  const dbDir = join(root, "core", "db");

  await writeIfNotExists(
    join(dbDir, "package.json"),
    JSON.stringify(
      {
        name: "@aoc25/db",
        version: "1.0.0",
        type: "module",
        main: "./dist/index.js",
        types: "./dist/index.d.ts",
        scripts: { build: "tsc" },
        dependencies: { "better-sqlite3": "^11.0.0" },
        devDependencies: {
          "@types/better-sqlite3": "^7.6.8",
          "@types/node": "^20.10.0",
          typescript: "^5.3.0",
        },
      },
      null,
      2
    ),
    silent
  );

  await writeIfNotExists(
    join(dbDir, "tsconfig.json"),
    JSON.stringify(
      {
        extends: "../../tsconfig.base.json",
        compilerOptions: { outDir: "./dist", rootDir: "./src" },
        include: ["src/**/*"],
      },
      null,
      2
    ),
    silent
  );
}

export async function scaffoldGitignore(
  options: ScaffoldOptions
): Promise<void> {
  const { root, silent = false } = options;

  if (!silent) console.log("\n📝 Scaffolding .gitignore...");

  const gitignore = `# Dependencies
node_modules/

# Build outputs
dist/
*.js.map

# Database
*.db
*.db-journal

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Compiled C binaries
agents/*/c/**/*.exe
agents/*/c/**/part1
agents/*/c/**/part2

# Nuxt
.nuxt/
.output/
.data/

# Logs
*.log
`;

  await writeIfNotExists(join(root, ".gitignore"), gitignore, silent);
}

export async function scaffoldRootPackageJson(
  options: ScaffoldOptions
): Promise<void> {
  const { root, silent = false } = options;

  if (!silent) console.log("\n📦 Scaffolding root package.json...");

  await writeIfNotExists(
    join(root, "package.json"),
    JSON.stringify(
      {
        name: "aoc25-battle-royale",
        version: "1.0.0",
        description: "AoC 2025 Battle Royale",
        type: "module",
        private: true,
        workspaces: ["core/runner", "core/dashboard", "core/db"],
        scripts: {
          scaffold: "tsx scripts/scaffold.ts",
          "sync-tools": "tsx scripts/sync-tools.ts",
          "publish-day": "tsx scripts/publish-day.ts",
          "init-db": "tsx scripts/init-db.ts",
          test: "vitest run",
        },
        devDependencies: {
          "@types/node": "^20.10.0",
          tsx: "^4.7.0",
          typescript: "^5.3.0",
        },
        engines: { node: ">=20.0.0" },
      },
      null,
      2
    ),
    silent
  );
}

export async function scaffoldTsconfig(
  options: ScaffoldOptions
): Promise<void> {
  const { root, silent = false } = options;

  if (!silent) console.log("\n📝 Scaffolding tsconfig...");

  await writeIfNotExists(
    join(root, "tsconfig.base.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
          forceConsistentCasingInFileNames: true,
          declaration: true,
          declarationMap: true,
          sourceMap: true,
        },
      },
      null,
      2
    ),
    silent
  );

  await writeIfNotExists(
    join(root, "tsconfig.json"),
    JSON.stringify(
      {
        extends: "./tsconfig.base.json",
        compilerOptions: { noEmit: true },
        include: ["scripts/**/*"],
      },
      null,
      2
    ),
    silent
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Scaffold Function
// ═══════════════════════════════════════════════════════════════

export async function scaffold(options: ScaffoldOptions): Promise<void> {
  const { silent = false } = options;

  if (!silent) {
    console.log("🏗️  AoC 2025 Battle Royale - Scaffold\n");
    console.log("═".repeat(50));
  }

  await scaffoldGitignore(options);
  await scaffoldRootPackageJson(options);
  await scaffoldTsconfig(options);
  await scaffoldCoreData(options);
  await scaffoldCoreRunner(options);
  await scaffoldCoreDb(options);
  await scaffoldAgents(options);

  if (!silent) {
    console.log("\n" + "═".repeat(50));
    console.log("✨ Scaffold complete!");
  }
}

// ═══════════════════════════════════════════════════════════════
// Validation Functions
// ═══════════════════════════════════════════════════════════════

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export async function validateScaffold(
  root: string
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required directories
  const requiredDirs = [
    "core/data",
    "core/runner",
    "core/db",
    "agents/claude",
    "agents/codex",
    "agents/gemini",
  ];

  for (const dir of requiredDirs) {
    const fullPath = join(root, dir);
    try {
      const s = await stat(fullPath);
      if (!s.isDirectory()) {
        errors.push(`${dir} exists but is not a directory`);
      }
    } catch {
      errors.push(`Missing directory: ${dir}`);
    }
  }

  // Check required files
  const requiredFiles = [
    "package.json",
    "tsconfig.json",
    "tsconfig.base.json",
    ".gitignore",
    "core/runner/package.json",
    "core/db/package.json",
  ];

  for (const file of requiredFiles) {
    const fullPath = join(root, file);
    try {
      await access(fullPath);
    } catch {
      errors.push(`Missing file: ${file}`);
    }
  }

  // Check agent structure
  for (const agent of AGENTS) {
    const agentDir = join(root, "agents", agent);

    // Check agent.md
    try {
      await access(join(agentDir, `${agent}.md`));
    } catch {
      warnings.push(`Missing ${agent}/${agent}.md`);
    }

    // Check day00 exists
    try {
      await access(join(agentDir, "ts", "day00", "part1.ts"));
      await access(join(agentDir, "c", "day00", "part1.c"));
    } catch {
      errors.push(`Missing day00 solvers for ${agent}`);
    }
  }

  // Check core/data day00
  try {
    await access(join(root, "core", "data", "day00", "puzzle1.md"));
    await access(join(root, "core", "data", "day00", "sample.txt"));
  } catch {
    errors.push("Missing core/data/day00 files");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
