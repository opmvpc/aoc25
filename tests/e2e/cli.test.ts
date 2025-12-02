/**
 * 🧪 Tests - CLI Integration
 *
 * Teste l'exécution réelle du CLI depuis les dossiers agents
 * comme le feraient les IA en compétition.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { chmod } from "node:fs/promises";

const ROOT = process.cwd();
const AGENTS = ["claude", "codex", "gemini"] as const;

describe("CLI integration", () => {
  beforeAll(async () => {
    // S'assurer que les wrappers sont exécutables
    for (const agent of AGENTS) {
      const aocPath = join(ROOT, "agents", agent, "tools", "aoc");
      await chmod(aocPath, 0o755);
    }
  });

  for (const agent of AGENTS) {
    const agentDir = join(ROOT, "agents", agent);

    describe(`${agent}`, () => {
      it("should run day 0 part 1 with sample", () => {
        const result = execSync("./tools/aoc run 0 1 --sample", {
          cwd: agentDir,
          encoding: "utf-8",
          timeout: 30000,
        });

        expect(result).toContain("Day 00 Part 1");
        expect(result).toContain(`Agent: ${agent}`);
        expect(result).toContain("Answer:");
        expect(result).toContain("8"); // Expected sample answer
      });

      it("should run day 0 part 2 with sample", () => {
        const result = execSync("./tools/aoc run 0 2 --sample", {
          cwd: agentDir,
          encoding: "utf-8",
          timeout: 30000,
        });

        expect(result).toContain("Answer:");
        expect(result).toContain("146"); // Expected sample answer
      });

      it("should check day 0 part 1 sample and pass", () => {
        const result = execSync("./tools/aoc check 0 1 --sample", {
          cwd: agentDir,
          encoding: "utf-8",
          timeout: 30000,
        });

        expect(result).toContain("✅");
      });

      it("should run C version", () => {
        const result = execSync("./tools/aoc run 0 1 --sample --lang c", {
          cwd: agentDir,
          encoding: "utf-8",
          timeout: 30000,
        });

        expect(result).toContain("Language: C");
        expect(result).toContain("Answer:");
        expect(result).toContain("8");
      });

      it("should run with final input", () => {
        const result = execSync("./tools/aoc run 0 1", {
          cwd: agentDir,
          encoding: "utf-8",
          timeout: 30000,
        });

        expect(result).toContain("Input: final");
        expect(result).toContain("Answer:");
        // Final answer depends on generated input
      });
    });
  }

  describe("error handling", () => {
    it("should return NOT_IMPLEMENTED for unimplemented day", () => {
      const agentDir = join(ROOT, "agents", "claude");

      // Day 12 should have template solver returning NOT_IMPLEMENTED
      const result = execSync("./tools/aoc run 12 1", {
        cwd: agentDir,
        encoding: "utf-8",
        timeout: 10000,
      });

      // The command runs but returns NOT_IMPLEMENTED
      expect(result).toContain("NOT_IMPLEMENTED");
    });

    it("should reject invalid part number", () => {
      const agentDir = join(ROOT, "agents", "claude");

      // Invalid part should print error message
      const result = execSync("./tools/aoc run 0 3 2>&1 || true", {
        cwd: agentDir,
        encoding: "utf-8",
        timeout: 10000,
        shell: "/bin/bash",
      });

      expect(result).toContain("Invalid part");
    });
  });
});
