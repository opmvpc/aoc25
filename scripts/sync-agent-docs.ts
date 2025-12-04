#!/usr/bin/env tsx
/**
 * 🏗️ AoC 2025 Battle Royale - Sync Agent MD Script
 *
 * Publie le template AGENT.md vers tous les agents avec les noms appropriés
 * Publie aussi le template de journal de solution dans notes/
 *
 * Usage: npm run sync-agent-md
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.cwd();
const AGENTS = ["claude", "codex", "gemini"] as const;
type Agent = (typeof AGENTS)[number];

const AGENT_DISPLAY_NAMES: Record<Agent, string> = {
  claude: "Claude",
  codex: "Codex",
  gemini: "Gemini",
};

async function syncAgentMd(): Promise<void> {
  console.log("📄 Syncing AGENT.md to all agents...\n");

  // Read template
  const templatePath = join(ROOT, "core", "templates", "AGENT.md");
  let template: string;

  try {
    template = await readFile(templatePath, "utf-8");
  } catch (err) {
    console.error("❌ Could not read template from core/templates/AGENT.md");
    process.exit(1);
  }

  for (const agent of AGENTS) {
    const agentDir = join(ROOT, "agents", agent);
    const displayName = AGENT_DISPLAY_NAMES[agent];
    // Use AGENT.md as the universal filename for all agents
    const fileName = "AGENT.md";

    // Replace placeholders
    let content = template
      .replace(/\{\{AGENT_NAME\}\}/g, displayName)
      .replace(/\{\{AGENT_DIR\}\}/g, agent);

    const destPath = join(agentDir, fileName);
    await writeFile(destPath, content, "utf-8");
    console.log(`  ✅ ${agent}/${fileName}`);
  }

  console.log("");
}

async function syncSolutionJournalTemplate(): Promise<void> {
  console.log("📝 Syncing solution journal template to all agents...\n");

  // Read template
  const templatePath = join(ROOT, "core", "templates", "solution-journal.md");
  let template: string;

  try {
    template = await readFile(templatePath, "utf-8");
  } catch (err) {
    console.error(
      "❌ Could not read template from core/templates/solution-journal.md"
    );
    process.exit(1);
  }

  for (const agent of AGENTS) {
    const notesDir = join(ROOT, "agents", agent, "notes");
    await mkdir(notesDir, { recursive: true });

    // Create template file
    const destPath = join(notesDir, "SOLUTION_TEMPLATE.md");
    await writeFile(destPath, template, "utf-8");
    console.log(`  ✅ ${agent}/notes/SOLUTION_TEMPLATE.md`);

    // Create solution journals for days 1-12 if they don't exist
    for (let day = 0; day <= 12; day++) {
      const dayPadded = day.toString().padStart(2, "0");
      const journalPath = join(notesDir, `solution-day${dayPadded}.md`);

      try {
        await readFile(journalPath);
        // File exists, skip
      } catch {
        // File doesn't exist, create from template
        const content = template
          .replace(/\{\{DAY\}\}/g, day.toString())
          .replace(/\{\{DAY_PADDED\}\}/g, dayPadded)
          .replace(
            /\{\{TITLE\}\}/g,
            day === 0 ? "Number Cruncher (Test Day)" : "[Titre à définir]"
          )
          .replace(/\{\{DATE\}\}/g, "")
          .replace(/\{\{TIME\}\}/g, "");

        await writeFile(journalPath, content, "utf-8");
        console.log(`  📝 Created ${agent}/notes/solution-day${dayPadded}.md`);
      }
    }
  }

  console.log("");
}

async function main(): Promise<void> {
  console.log("🏗️  AoC 2025 Battle Royale - Sync Agent Docs\n");
  console.log("═".repeat(50) + "\n");

  await syncAgentMd();
  await syncSolutionJournalTemplate();

  console.log("═".repeat(50));
  console.log("✨ Agent documentation synced!");
}

main().catch((err) => {
  console.error("❌ Sync failed:", err);
  process.exit(1);
});
