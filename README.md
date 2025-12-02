# 🏆 AoC 2025 Battle Royale

<div align="center">

```
   ___       ______   ___   __ ___  _____
  / _ |___  / ___/ | / / | / / __/ / ___/
 / __ / _ \/ /__/  |/ /| |/ /__ \/ __ \
/_/ |_\___/\___/_/|___/ |___/____/____/

 ___       __  __  __       ___          __
/ _ )___ _/ /_/ /_/ /__    / _ \___  __ ____ _/ /__
/ _  / _ `/ __/ __/ / -_)  / , _/ _ \/ // / _ `/ / -_)
/____/\_,_/\__/\__/_/\__/  /_/|_|\___/\_, /\_,_/_/\__/
                                     /___/
```

**3 AI Agents. 12 Days. 2 Languages. 1 Champion.**

🏎️ **The goal: write the FASTEST algorithms!** 🏎️

</div>

---

## 🤖 Les Combattants

| Agent | Model | Interface | Color |
|-------|-------|-----------|-------|
| 🟠 **Claude** | **Claude Sonnet 4.5** | Claude Code (VS Code) | Orange |
| 🟢 **Codex** | **GPT-5.1-codex-max** | Codex CLI | Green |
| 🟣 **Gemini** | **Gemini 3 Pro** | Gemini CLI | Purple |

```
   🟠 CLAUDE              🟢 CODEX              🟣 GEMINI
   Sonnet 4.5            GPT-5.1-codex-max       Gemini 3 Pro
      ⚔️                     ⚔️                    ⚔️
    ┌─────┐               ┌─────┐              ┌─────┐
    │TS C │               │TS C │              │TS C │
    └──┬──┘               └──┬──┘              └──┬──┘
       │                     │                    │
       └─────────────────────┼────────────────────┘
                             ▼
                        📊 DASHBOARD
                      ⏱️ Who's fastest?
```

_Let the machines fight it out on Advent of Code 2025!_

---

## ⚔️ Les Règles du Combat

| #   | Règle                 | Pourquoi                                          |
| --- | --------------------- | ------------------------------------------------- |
| 1   | 🎯 **Même puzzle**    | Tous les agents reçoivent l'énoncé au même moment |
| 2   | 💻 **Double langage** | Solutions TypeScript ET C obligatoires            |
| 3   | ⏱️ **Speed is King**  | Le plus rapide gagne, pas le premier fini !       |
| 4   | 📊 **100 benchmarks** | Pour départager les performances avec précision   |
| 5   | 🏠 **Sandbox isolé**  | Chaque agent dans son dossier, pas de triche !    |
| 6   | 🏆 **Points système** | 🥇 +3pts, 🥈 +2pts, 🥉 +1pt par puzzle           |

### 📊 Scoring

Pour chaque puzzle (day × part × language = 48 puzzles max) :
- 🥇 **1ère place** (fastest correct) : **3 points**
- 🥈 **2ème place** : **2 points**  
- 🥉 **3ème place** : **1 point**
- ❌ **Wrong answer** : **0 points**

**L'agent avec le plus de points à la fin gagne le Battle Royale !**

---

## 🎮 Commandes

Chaque agent travaille depuis son dossier (`agents/claude/`, `agents/codex/`, `agents/gemini/`).

### ▶️ Exécuter une solution

```bash
./tools/aoc run <day> <part> [options]
```

```bash
# Jour 1, partie 1, avec l'exemple
./tools/aoc run 1 1 --sample

# Jour 5, partie 2, input final
./tools/aoc run 5 2

# Forcer la version C
./tools/aoc run 3 1 --lang c
```

### ✅ Vérifier la réponse

```bash
./tools/aoc check <day> <part> [options]
```

Compare le résultat avec la réponse attendue. ✅ ou ❌, pas de pitié.

### 📊 Benchmarker

```bash
./tools/aoc bench <day> <part> [options]
```

Lance 100 exécutions et calcule les stats (avg, min, max, p50, p95, p99).

### Options

| Option           | Alias | Description                                 |
| ---------------- | ----- | ------------------------------------------- |
| `--sample`       | `-s`  | Utilise `sample.txt` au lieu de `input.txt` |
| `--lang <ts\|c>` | `-l`  | Force le langage (défaut: `ts`)             |

---

## 📝 Écrire une Solution

### TypeScript

```typescript
// agents/claude/ts/day01/part1.ts
import type { Solver } from "../../../tools/runner/types.js";

const solve: Solver = (input: string) => {
  const lines = input.trim().split("\n");
  const answer = lines.reduce((sum, n) => sum + Number(n), 0);
  return String(answer);
};

export default solve;
```

### C

```c
// agents/claude/c/day01/part1.c
#include "../../tools/runner/c/common.h"

int main(void) {
    char* input = aoc_read_input();

    AOC_TIMER_START(solve);
    int sum = 0;
    // ... parsing et calcul ...
    AOC_TIMER_END(solve);

    AOC_RESULT_INT(sum);
    aoc_cleanup(input);
    return 0;
}
```

---

## 🚀 Installation

```bash
# Clone & install
git clone https://github.com/your-username/aoc25.git && cd aoc25
npm install

# Build & setup
npm run build -w core/runner
npx tsx scripts/init-db.ts
npx tsx scripts/sync-tools.ts

# 🎉 Ready to rumble!
```

**Prérequis:** Node.js 24+, clang

---

## 📊 Dashboard

```bash
npm run dev -w core/dashboard
```

Visualise les scores, compare les performances, observe les IA s'affronter en temps réel.

---

## 🛠️ Scripts Utiles

| Script          | Commande                           | Description                           |
| --------------- | ---------------------------------- | ------------------------------------- |
| **publish-day** | `npx tsx scripts/publish-day.ts 5` | Publie le jour 5 vers tous les agents |
| **sync-tools**  | `npx tsx scripts/sync-tools.ts`    | Re-sync le runner après modifications |
| **init-db**     | `npx tsx scripts/init-db.ts`       | Initialise la base de données         |
| **test**        | `npm test`                         | Lance les 156 tests                   |

---

<div align="center">

**May the best AI win!** 🤖⚔️🤖

MIT License • Built with ☕ and TypeScript

</div>
