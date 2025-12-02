<script setup lang="ts">
import type { DayWithRuns, Agent, Language } from "~/types";

const {
  data: days,
  pending,
  error,
  refresh,
} = await useFetch<DayWithRuns[]>("/api/days");

const agents: Agent[] = ["claude", "codex", "gemini"];
const languages: Language[] = ["ts", "c"];

// Running state
const runningDay = ref<number | null>(null);
const runningItems = ref<Set<string>>(new Set());

// Results modal
const showResults = ref(false);
const currentResults = ref<{
  day: number;
  results: Array<{
    agent: Agent;
    part: 1 | 2;
    language: Language;
    inputType: "sample" | "input";
    answer: string;
    isCorrect: boolean | null;
    timeMs: number;
    error?: string;
  }>;
} | null>(null);

// Pre-compute status grid
const statusGrid = computed(() => {
  if (!days.value) return new Map();

  const grid = new Map<
    string,
    {
      status: string;
      time: string | null;
      answer: string | null;
      isCorrect: boolean | null;
    }
  >();

  for (const day of days.value) {
    for (const agent of agents) {
      for (const lang of languages) {
        for (const part of [1, 2] as const) {
          const key = `${day.id}-${agent}-${lang}-${part}`;
          const run = day.latestRuns?.[agent]?.[lang]?.[`part${part}`];

          let status = "none";
          let time: string | null = null;
          let answer: string | null = null;
          let isCorrect: boolean | null = null;

          if (run) {
            isCorrect = run.is_correct;
            answer = run.answer ?? null;
            if (run.is_correct === true) status = "success";
            else if (run.is_correct === false) status = "error";
            else status = "pending";

            const ms = run.time_ms;
            if (ms < 1) time = `${(ms * 1000).toFixed(0)}µs`;
            else if (ms < 1000) time = `${ms.toFixed(1)}ms`;
            else time = `${(ms / 1000).toFixed(2)}s`;
          }

          grid.set(key, { status, time, answer, isCorrect });
        }
      }
    }
  }

  return grid;
});

function getStatus(
  dayId: number,
  agent: Agent,
  lang: Language,
  part: 1 | 2
): string {
  return (
    statusGrid.value.get(`${dayId}-${agent}-${lang}-${part}`)?.status || "none"
  );
}

function getTime(
  dayId: number,
  agent: Agent,
  lang: Language,
  part: 1 | 2
): string | null {
  return (
    statusGrid.value.get(`${dayId}-${agent}-${lang}-${part}`)?.time || null
  );
}

function getAnswer(
  dayId: number,
  agent: Agent,
  lang: Language,
  part: 1 | 2
): string | null {
  return (
    statusGrid.value.get(`${dayId}-${agent}-${lang}-${part}`)?.answer || null
  );
}

function getIsCorrect(
  dayId: number,
  agent: Agent,
  lang: Language,
  part: 1 | 2
): boolean | null {
  return (
    statusGrid.value.get(`${dayId}-${agent}-${lang}-${part}`)?.isCorrect ?? null
  );
}

// Day stats
const dayStats = computed(() => {
  if (!days.value) return new Map();

  const stats = new Map<
    number,
    { gold: number; silver: number; total: number }
  >();

  for (const day of days.value) {
    let gold = 0,
      silver = 0;

    for (const agent of agents) {
      for (const lang of languages) {
        if (getStatus(day.id, agent, lang, 1) === "success") gold++;
        if (getStatus(day.id, agent, lang, 2) === "success") silver++;
      }
    }

    stats.set(day.id, { gold, silver, total: gold + silver });
  }

  return stats;
});

// Agent leaderboard
const agentLeaderboard = computed(() => {
  const scores: Record<
    Agent,
    { gold: number; silver: number; total: number; errors: number }
  > = {
    claude: { gold: 0, silver: 0, total: 0, errors: 0 },
    codex: { gold: 0, silver: 0, total: 0, errors: 0 },
    gemini: { gold: 0, silver: 0, total: 0, errors: 0 },
  };

  if (!days.value)
    return Object.entries(scores).sort((a, b) => b[1].total - a[1].total);

  for (const day of days.value) {
    for (const agent of agents) {
      for (const lang of languages) {
        const s1 = getStatus(day.id, agent, lang, 1);
        const s2 = getStatus(day.id, agent, lang, 2);

        if (s1 === "success") {
          scores[agent].gold++;
          scores[agent].total++;
        }
        if (s2 === "success") {
          scores[agent].silver++;
          scores[agent].total++;
        }
        if (s1 === "error") scores[agent].errors++;
        if (s2 === "error") scores[agent].errors++;
      }
    }
  }

  return Object.entries(scores).sort((a, b) => b[1].total - a[1].total);
});

// Run all agents for a specific day with full results
async function runDayBattle(dayId: number, useSample: boolean = false) {
  runningDay.value = dayId;
  const results: typeof currentResults.value = { day: dayId, results: [] };

  try {
    // Run all combinations sequentially for visibility
    for (const agent of agents) {
      for (const part of [1, 2] as const) {
        for (const lang of languages) {
          const key = `${agent}-${dayId}-${part}-${lang}`;
          runningItems.value.add(key);

          try {
            const res = await $fetch<{
              answer: string;
              is_correct: boolean | null;
              time_ms: number;
              error?: string;
            }>("/api/runs", {
              method: "POST",
              body: { agent, day: dayId, part, language: lang, useSample },
            });

            results.results.push({
              agent,
              part,
              language: lang,
              inputType: useSample ? "sample" : "input",
              answer: res.answer,
              isCorrect: res.is_correct,
              timeMs: res.time_ms,
              error: res.error,
            });
          } catch (e: any) {
            results.results.push({
              agent,
              part,
              language: lang,
              inputType: useSample ? "sample" : "input",
              answer: "",
              isCorrect: false,
              timeMs: 0,
              error: e.message || "Unknown error",
            });
          } finally {
            runningItems.value.delete(key);
          }
        }
      }
    }

    await refresh();
    currentResults.value = results;
    showResults.value = true;
  } finally {
    runningDay.value = null;
    runningItems.value.clear();
  }
}

// Run single solver
async function runSingle(
  dayId: number,
  agent: Agent,
  part: 1 | 2,
  lang: Language,
  useSample: boolean = false
) {
  const key = `${agent}-${dayId}-${part}-${lang}`;
  runningItems.value.add(key);

  try {
    await $fetch("/api/runs", {
      method: "POST",
      body: { agent, day: dayId, part, language: lang, useSample },
    });
    await refresh();
  } catch (e) {
    console.error("Run failed:", e);
  } finally {
    runningItems.value.delete(key);
  }
}

function isRunning(agent: Agent, dayId: number, part: number, lang: Language) {
  return runningItems.value.has(`${agent}-${dayId}-${part}-${lang}`);
}

function formatTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function closeResults() {
  showResults.value = false;
  currentResults.value = null;
}
</script>

<template>
  <div class="space-y-8">
    <!-- Hero Header -->
    <div class="text-center py-4">
      <h1 class="text-3xl font-bold text-aoc-gold mb-2">
        🎄 AoC 2025 Battle Royale 🎄
      </h1>
      <p class="text-text-muted">3 AI Agents • 12 Days • 1 Champion</p>
    </div>

    <!-- Agent Leaderboard -->
    <div class="card p-6">
      <h2 class="text-xl font-bold text-aoc-gold mb-4">🏆 Agent Leaderboard</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="([agent, score], index) in agentLeaderboard"
          :key="agent"
          class="p-4 rounded-lg border-2 transition-all"
          :class="{
            'border-yellow-500 bg-yellow-500/10': index === 0,
            'border-gray-400 bg-gray-400/10': index === 1,
            'border-amber-700 bg-amber-700/10': index === 2,
          }"
        >
          <div class="flex items-center gap-3 mb-3">
            <span class="text-2xl">{{
              index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"
            }}</span>
            <span
              :class="`agent-${agent}`"
              class="px-3 py-1 rounded border text-lg font-bold capitalize"
            >
              {{ agent }}
            </span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center">
            <div>
              <div class="text-xl font-bold text-aoc-green">
                {{ score.gold }}
              </div>
              <div class="text-xs text-text-muted">Part 1</div>
            </div>
            <div>
              <div class="text-xl font-bold text-aoc-gold">
                {{ score.silver }}
              </div>
              <div class="text-xs text-text-muted">Part 2</div>
            </div>
            <div>
              <div class="text-xl font-bold text-aoc-red">
                {{ score.errors }}
              </div>
              <div class="text-xs text-text-muted">Errors</div>
            </div>
          </div>
          <div class="mt-2 text-center">
            <span class="text-2xl font-bold text-white">{{ score.total }}</span>
            <span class="text-text-muted ml-1">stars</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="text-center py-12">
      <div class="text-2xl animate-pulse">🎄 Loading days...</div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="card p-6 text-center text-aoc-red">
      <div class="text-2xl mb-2">❌</div>
      <p>Failed to load: {{ error.message }}</p>
      <button
        @click="refresh"
        class="mt-4 px-4 py-2 bg-bg-hover text-aoc-green rounded hover:bg-bg-card"
      >
        Retry
      </button>
    </div>

    <!-- Days Control Panel -->
    <div v-else class="space-y-4">
      <h2 class="text-xl font-bold text-aoc-gold">📅 Days Control Panel</h2>

      <div class="grid gap-4">
        <div
          v-for="day in days"
          :key="day.id"
          class="card p-4 hover:border-aoc-green/50 transition-all"
          :class="{ 'ring-2 ring-aoc-gold': runningDay === day.id }"
        >
          <!-- Day Header -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ day.id === 0 ? "🧪" : "🎄" }}</span>
              <div>
                <h3 class="text-lg font-bold text-aoc-green">
                  Day {{ day.id.toString().padStart(2, "0") }}
                  <span
                    v-if="day.id === 0"
                    class="text-sm text-text-muted font-normal"
                    >(Test)</span
                  >
                </h3>
                <div class="text-sm text-text-muted">
                  <span
                    v-if="dayStats.get(day.id)?.total"
                    class="text-aoc-gold"
                  >
                    {{ dayStats.get(day.id)?.total }} ★
                  </span>
                  <span v-else class="text-text-muted">No runs yet</span>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
              <button
                @click="runDayBattle(day.id, true)"
                :disabled="runningDay !== null"
                class="px-3 py-2 rounded text-sm font-medium transition-all"
                :class="{
                  'bg-aoc-silver/20 text-aoc-silver hover:bg-aoc-silver/30':
                    runningDay !== day.id,
                  'bg-aoc-gold/20 text-aoc-gold animate-pulse':
                    runningDay === day.id,
                  'opacity-50 cursor-not-allowed':
                    runningDay !== null && runningDay !== day.id,
                }"
              >
                {{ runningDay === day.id ? "⏳" : "🧪" }} Sample
              </button>
              <button
                @click="runDayBattle(day.id, false)"
                :disabled="runningDay !== null"
                class="px-4 py-2 rounded text-sm font-bold transition-all"
                :class="{
                  'bg-aoc-green text-bg-main hover:bg-aoc-green/80':
                    runningDay !== day.id,
                  'bg-aoc-gold text-bg-main animate-pulse':
                    runningDay === day.id,
                  'opacity-50 cursor-not-allowed':
                    runningDay !== null && runningDay !== day.id,
                }"
              >
                {{ runningDay === day.id ? "⏳ Running..." : "🏆 Run Battle" }}
              </button>
            </div>
          </div>

          <!-- Results Grid -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-text-muted border-b border-border">
                  <th class="text-left py-2 px-2 w-24">Agent</th>
                  <th class="text-center py-2 px-2">P1 TS</th>
                  <th class="text-center py-2 px-2">P1 C</th>
                  <th class="text-center py-2 px-2">P2 TS</th>
                  <th class="text-center py-2 px-2">P2 C</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="agent in agents"
                  :key="agent"
                  class="border-b border-border/50 hover:bg-bg-hover/30"
                >
                  <td class="py-2 px-2">
                    <span
                      :class="`agent-${agent}`"
                      class="px-2 py-0.5 rounded border text-xs font-medium capitalize"
                    >
                      {{ agent }}
                    </span>
                  </td>
                  <template v-for="part in [1, 2] as const" :key="part">
                    <template v-for="lang in languages" :key="lang">
                      <td class="text-center py-2 px-2">
                        <button
                          @click.stop="runSingle(day.id, agent, part, lang)"
                          :disabled="runningItems.size > 0"
                          class="inline-flex flex-col items-center gap-0.5 px-2 py-1 rounded hover:bg-bg-hover transition-all min-w-[60px]"
                          :class="{
                            'opacity-50':
                              runningItems.size > 0 &&
                              !isRunning(agent, day.id, part, lang),
                          }"
                        >
                          <span
                            class="text-lg"
                            :class="{
                              'animate-spin': isRunning(
                                agent,
                                day.id,
                                part,
                                lang
                              ),
                              'text-aoc-green':
                                getStatus(day.id, agent, lang, part) ===
                                'success',
                              'text-aoc-red':
                                getStatus(day.id, agent, lang, part) ===
                                'error',
                              'text-aoc-silver':
                                getStatus(day.id, agent, lang, part) ===
                                'pending',
                              'text-text-muted/30':
                                getStatus(day.id, agent, lang, part) === 'none',
                            }"
                          >
                            {{
                              isRunning(agent, day.id, part, lang)
                                ? "⏳"
                                : getStatus(day.id, agent, lang, part) ===
                                  "success"
                                ? "★"
                                : getStatus(day.id, agent, lang, part) ===
                                  "error"
                                ? "✗"
                                : getStatus(day.id, agent, lang, part) ===
                                  "pending"
                                ? "?"
                                : "·"
                            }}
                          </span>
                          <span
                            v-if="getTime(day.id, agent, lang, part)"
                            class="text-[10px] text-text-muted"
                          >
                            {{ getTime(day.id, agent, lang, part) }}
                          </span>
                        </button>
                      </td>
                    </template>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Results Modal -->
    <Teleport to="body">
      <div
        v-if="showResults && currentResults"
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        @click.self="closeResults"
      >
        <div
          class="bg-bg-card border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          <div
            class="p-4 border-b border-border flex items-center justify-between"
          >
            <h2 class="text-xl font-bold text-aoc-gold">
              🏆 Day {{ currentResults.day.toString().padStart(2, "0") }} Battle
              Results
            </h2>
            <button
              @click="closeResults"
              class="text-text-muted hover:text-white text-2xl"
            >
              &times;
            </button>
          </div>

          <div class="p-4 overflow-auto max-h-[calc(90vh-80px)]">
            <table class="w-full text-sm">
              <thead class="sticky top-0 bg-bg-card">
                <tr class="text-text-muted border-b border-border">
                  <th class="text-left py-2 px-2">Agent</th>
                  <th class="text-center py-2 px-2">Part</th>
                  <th class="text-center py-2 px-2">Lang</th>
                  <th class="text-left py-2 px-2">Answer</th>
                  <th class="text-center py-2 px-2">Status</th>
                  <th class="text-right py-2 px-2">Time</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(result, idx) in currentResults.results"
                  :key="idx"
                  class="border-b border-border/50 hover:bg-bg-hover/30"
                  :class="{
                    'bg-aoc-green/5': result.isCorrect === true,
                    'bg-aoc-red/5': result.isCorrect === false || result.error,
                  }"
                >
                  <td class="py-2 px-2">
                    <span
                      :class="`agent-${result.agent}`"
                      class="px-2 py-0.5 rounded border text-xs capitalize"
                    >
                      {{ result.agent }}
                    </span>
                  </td>
                  <td class="text-center py-2 px-2">P{{ result.part }}</td>
                  <td class="text-center py-2 px-2 uppercase text-text-muted">
                    {{ result.language }}
                  </td>
                  <td class="py-2 px-2 font-mono text-xs">
                    <span v-if="result.error" class="text-aoc-red">{{
                      result.error
                    }}</span>
                    <span v-else class="text-white">{{
                      result.answer || "-"
                    }}</span>
                  </td>
                  <td class="text-center py-2 px-2">
                    <span v-if="result.error" class="text-aoc-red">❌</span>
                    <span
                      v-else-if="result.isCorrect === true"
                      class="text-aoc-green"
                      >✅</span
                    >
                    <span
                      v-else-if="result.isCorrect === false"
                      class="text-aoc-red"
                      >❌</span
                    >
                    <span v-else class="text-aoc-silver">⏳</span>
                  </td>
                  <td
                    class="text-right py-2 px-2 font-mono text-xs text-text-muted"
                  >
                    {{ result.error ? "-" : formatTime(result.timeMs) }}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Summary -->
            <div
              class="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4 text-center"
            >
              <div
                v-for="agent in agents"
                :key="agent"
                class="p-3 rounded bg-bg-hover"
              >
                <span
                  :class="`agent-${agent}`"
                  class="px-2 py-0.5 rounded border text-sm font-bold capitalize"
                >
                  {{ agent }}
                </span>
                <div class="mt-2 flex justify-center gap-3">
                  <span class="text-aoc-green">
                    {{
                      currentResults.results.filter(
                        (r) => r.agent === agent && r.isCorrect === true
                      ).length
                    }}
                    ✓
                  </span>
                  <span class="text-aoc-red">
                    {{
                      currentResults.results.filter(
                        (r) =>
                          r.agent === agent &&
                          (r.isCorrect === false || r.error)
                      ).length
                    }}
                    ✗
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Quick Links -->
    <div class="flex gap-4 justify-center pt-4">
      <NuxtLink
        to="/debug"
        class="px-4 py-2 bg-bg-hover text-aoc-silver rounded hover:bg-bg-card transition-all"
      >
        🔧 Debug
      </NuxtLink>
      <NuxtLink
        to="/benchmarks"
        class="px-4 py-2 bg-bg-hover text-aoc-gold rounded hover:bg-bg-card transition-all"
      >
        📊 Benchmarks
      </NuxtLink>
      <NuxtLink
        to="/admin"
        class="px-4 py-2 bg-bg-hover text-aoc-green rounded hover:bg-bg-card transition-all"
      >
        ⚙️ Admin
      </NuxtLink>
    </div>
  </div>
</template>
