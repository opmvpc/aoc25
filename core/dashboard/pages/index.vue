<script setup lang="ts">
import type { DayWithRuns, Agent, Language } from "~/types";

const { data: days, pending, error, refresh } = await useFetch<DayWithRuns[]>("/api/days");

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

// Pre-compute status grid with raw time in ms
const statusGrid = computed(() => {
  if (!days.value) return new Map();
  
  const grid = new Map<string, { 
    status: string; 
    timeMs: number | null;
    timeFormatted: string | null;
    answer: string | null;
    isCorrect: boolean | null;
  }>();
  
  for (const day of days.value) {
    for (const agent of agents) {
      for (const lang of languages) {
        for (const part of [1, 2] as const) {
          const key = `${day.id}-${agent}-${lang}-${part}`;
          const run = day.latestRuns?.[agent]?.[lang]?.[`part${part}`];
          
          let status = "none";
          let timeMs: number | null = null;
          let timeFormatted: string | null = null;
          let answer: string | null = null;
          let isCorrect: boolean | null = null;
          
          if (run) {
            isCorrect = run.is_correct;
            answer = run.answer ?? null;
            timeMs = run.time_ms;
            if (run.is_correct === true) status = "success";
            else if (run.is_correct === false) status = "error";
            else status = "pending";
            
            if (timeMs < 1) timeFormatted = `${(timeMs * 1000).toFixed(0)}µs`;
            else if (timeMs < 1000) timeFormatted = `${timeMs.toFixed(1)}ms`;
            else timeFormatted = `${(timeMs / 1000).toFixed(2)}s`;
          }
          
          grid.set(key, { status, timeMs, timeFormatted, answer, isCorrect });
        }
      }
    }
  }
  
  return grid;
});

function getStatus(dayId: number, agent: Agent, lang: Language, part: 1 | 2): string {
  return statusGrid.value.get(`${dayId}-${agent}-${lang}-${part}`)?.status || "none";
}

function getTimeMs(dayId: number, agent: Agent, lang: Language, part: 1 | 2): number | null {
  return statusGrid.value.get(`${dayId}-${agent}-${lang}-${part}`)?.timeMs ?? null;
}

function getTimeFormatted(dayId: number, agent: Agent, lang: Language, part: 1 | 2): string | null {
  return statusGrid.value.get(`${dayId}-${agent}-${lang}-${part}`)?.timeFormatted || null;
}

// Speed rankings per day/part/lang - only count successful runs
const speedRankings = computed(() => {
  if (!days.value) return new Map();
  
  const rankings = new Map<string, { agent: Agent; timeMs: number; rank: number }[]>();
  
  for (const day of days.value) {
    for (const part of [1, 2] as const) {
      for (const lang of languages) {
        const key = `${day.id}-${part}-${lang}`;
        const times: { agent: Agent; timeMs: number }[] = [];
        
        for (const agent of agents) {
          const status = getStatus(day.id, agent, lang, part);
          const timeMs = getTimeMs(day.id, agent, lang, part);
          if (status === "success" && timeMs !== null) {
            times.push({ agent, timeMs });
          }
        }
        
        // Sort by time (fastest first)
        times.sort((a, b) => a.timeMs - b.timeMs);
        
        // Assign ranks
        const ranked = times.map((t, idx) => ({ ...t, rank: idx + 1 }));
        rankings.set(key, ranked);
      }
    }
  }
  
  return rankings;
});

function getRank(dayId: number, agent: Agent, lang: Language, part: 1 | 2): number | null {
  const key = `${dayId}-${part}-${lang}`;
  const ranking = speedRankings.value.get(key);
  if (!ranking) return null;
  const entry = ranking.find(r => r.agent === agent);
  return entry?.rank ?? null;
}

function isFastest(dayId: number, agent: Agent, lang: Language, part: 1 | 2): boolean {
  return getRank(dayId, agent, lang, part) === 1;
}

// Agent leaderboard based on SPEED (wins count)
const agentLeaderboard = computed(() => {
  const scores: Record<Agent, { 
    wins: number;       // 1st place finishes
    podiums: number;    // Top 3 finishes  
    totalTimeMs: number; // Total time for comparison
    correct: number;    // Correct answers
    errors: number;
  }> = {
    claude: { wins: 0, podiums: 0, totalTimeMs: 0, correct: 0, errors: 0 },
    codex: { wins: 0, podiums: 0, totalTimeMs: 0, correct: 0, errors: 0 },
    gemini: { wins: 0, podiums: 0, totalTimeMs: 0, correct: 0, errors: 0 },
  };
  
  if (!days.value) return Object.entries(scores).sort((a, b) => b[1].wins - a[1].wins);
  
  for (const day of days.value) {
    for (const agent of agents) {
      for (const lang of languages) {
        for (const part of [1, 2] as const) {
          const status = getStatus(day.id, agent, lang, part);
          const timeMs = getTimeMs(day.id, agent, lang, part);
          const rank = getRank(day.id, agent, lang, part);
          
          if (status === "success") {
            scores[agent].correct++;
            if (timeMs) scores[agent].totalTimeMs += timeMs;
            if (rank === 1) scores[agent].wins++;
            if (rank && rank <= 3) scores[agent].podiums++;
          } else if (status === "error") {
            scores[agent].errors++;
          }
        }
      }
    }
  }
  
  // Sort by: wins, then podiums, then total time (less is better)
  return Object.entries(scores).sort((a, b) => {
    if (b[1].wins !== a[1].wins) return b[1].wins - a[1].wins;
    if (b[1].podiums !== a[1].podiums) return b[1].podiums - a[1].podiums;
    return a[1].totalTimeMs - b[1].totalTimeMs;
  });
});

// Run all agents for a specific day with full results
async function runDayBattle(dayId: number, useSample: boolean = false) {
  runningDay.value = dayId;
  const results: typeof currentResults.value = { day: dayId, results: [] };

  try {
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
async function runSingle(dayId: number, agent: Agent, part: 1 | 2, lang: Language, useSample: boolean = false) {
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

function formatTotalTime(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

// Sorted results for modal (by time, fastest first)
const sortedResults = computed(() => {
  if (!currentResults.value) return [];
  
  // Group by part+lang, then sort each group by time
  const grouped = new Map<string, typeof currentResults.value.results>();
  
  for (const r of currentResults.value.results) {
    const key = `${r.part}-${r.language}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }
  
  // Sort each group by time and assign ranks
  const result: (typeof currentResults.value.results[0] & { rank: number })[] = [];
  
  for (const [, group] of grouped) {
    const sorted = [...group].sort((a, b) => {
      if (a.error && !b.error) return 1;
      if (!a.error && b.error) return -1;
      if (!a.isCorrect && b.isCorrect) return 1;
      if (a.isCorrect && !b.isCorrect) return -1;
      return a.timeMs - b.timeMs;
    });
    
    sorted.forEach((r, idx) => {
      result.push({ ...r, rank: r.isCorrect ? idx + 1 : 0 });
    });
  }
  
  // Sort by part, then lang, then rank
  return result.sort((a, b) => {
    if (a.part !== b.part) return a.part - b.part;
    if (a.language !== b.language) return a.language.localeCompare(b.language);
    return a.rank - b.rank;
  });
});

function closeResults() {
  showResults.value = false;
  currentResults.value = null;
}
</script>

<template>
  <div class="space-y-8">
    <!-- Hero Header -->
    <div class="text-center py-4">
      <h1 class="text-3xl font-bold text-aoc-gold mb-2">🎄 AoC 2025 Battle Royale 🎄</h1>
      <p class="text-text-muted">3 AI Agents • 12 Days • <span class="text-aoc-green font-bold">Fastest Wins</span> 🏎️</p>
    </div>

    <!-- Speed Leaderboard -->
    <div class="card p-6">
      <h2 class="text-xl font-bold text-aoc-gold mb-4">🏆 Speed Leaderboard</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          v-for="([agent, score], index) in agentLeaderboard" 
          :key="agent"
          class="p-4 rounded-lg border-2 transition-all"
          :class="{
            'border-yellow-500 bg-yellow-500/10 shadow-lg shadow-yellow-500/20': index === 0,
            'border-gray-400 bg-gray-400/10': index === 1,
            'border-amber-700 bg-amber-700/10': index === 2,
          }"
        >
          <div class="flex items-center gap-3 mb-3">
            <span class="text-3xl">{{ index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉' }}</span>
            <span :class="`agent-${agent}`" class="px-3 py-1 rounded border text-lg font-bold capitalize">
              {{ agent }}
            </span>
          </div>
          
          <!-- Main stat: Wins -->
          <div class="text-center mb-3">
            <div class="text-4xl font-bold text-aoc-gold">{{ score.wins }}</div>
            <div class="text-sm text-text-muted">🏆 Fastest Times</div>
          </div>
          
          <div class="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <div class="text-lg font-bold text-aoc-silver">{{ score.podiums }}</div>
              <div class="text-xs text-text-muted">Podiums</div>
            </div>
            <div>
              <div class="text-lg font-bold text-aoc-green">{{ score.correct }}</div>
              <div class="text-xs text-text-muted">Correct</div>
            </div>
            <div>
              <div class="text-lg font-bold text-white">{{ formatTotalTime(score.totalTimeMs) }}</div>
              <div class="text-xs text-text-muted">Total</div>
            </div>
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
      <button @click="refresh" class="mt-4 px-4 py-2 bg-bg-hover text-aoc-green rounded hover:bg-bg-card">
        Retry
      </button>
    </div>

    <!-- Days Control Panel -->
    <div v-else class="space-y-4">
      <h2 class="text-xl font-bold text-aoc-gold">📅 Race Results</h2>
      
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
              <span class="text-2xl">{{ day.id === 0 ? '🧪' : '🏁' }}</span>
              <div>
                <h3 class="text-lg font-bold text-aoc-green">
                  Day {{ day.id.toString().padStart(2, '0') }}
                  <span v-if="day.id === 0" class="text-sm text-text-muted font-normal">(Test)</span>
                </h3>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex gap-2">
              <button
                @click="runDayBattle(day.id, true)"
                :disabled="runningDay !== null"
                class="px-3 py-2 rounded text-sm font-medium transition-all"
                :class="{
                  'bg-aoc-silver/20 text-aoc-silver hover:bg-aoc-silver/30': runningDay !== day.id,
                  'bg-aoc-gold/20 text-aoc-gold animate-pulse': runningDay === day.id,
                  'opacity-50 cursor-not-allowed': runningDay !== null && runningDay !== day.id,
                }"
              >
                {{ runningDay === day.id ? '⏳' : '🧪' }} Sample
              </button>
              <button
                @click="runDayBattle(day.id, false)"
                :disabled="runningDay !== null"
                class="px-4 py-2 rounded text-sm font-bold transition-all"
                :class="{
                  'bg-aoc-green text-bg-main hover:bg-aoc-green/80': runningDay !== day.id,
                  'bg-aoc-gold text-bg-main animate-pulse': runningDay === day.id,
                  'opacity-50 cursor-not-allowed': runningDay !== null && runningDay !== day.id,
                }"
              >
                {{ runningDay === day.id ? '⏳ Racing...' : '🏎️ Start Race' }}
              </button>
            </div>
          </div>

          <!-- Results Grid with Rankings -->
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
                <tr v-for="agent in agents" :key="agent" class="border-b border-border/50 hover:bg-bg-hover/30">
                  <td class="py-2 px-2">
                    <span :class="`agent-${agent}`" class="px-2 py-0.5 rounded border text-xs font-medium capitalize">
                      {{ agent }}
                    </span>
                  </td>
                  <template v-for="part in [1, 2] as const" :key="part">
                    <template v-for="lang in languages" :key="lang">
                      <td class="text-center py-2 px-2">
                        <button
                          @click.stop="runSingle(day.id, agent, part, lang)"
                          :disabled="runningItems.size > 0"
                          class="inline-flex flex-col items-center gap-0.5 px-2 py-1 rounded transition-all min-w-[70px]"
                          :class="{
                            'opacity-50': runningItems.size > 0 && !isRunning(agent, day.id, part, lang),
                            'bg-yellow-500/20 ring-1 ring-yellow-500': isFastest(day.id, agent, lang, part),
                            'hover:bg-bg-hover': !isFastest(day.id, agent, lang, part),
                          }"
                        >
                          <!-- Rank badge -->
                          <div class="flex items-center gap-1">
                            <span 
                              v-if="getRank(day.id, agent, lang, part)"
                              class="text-xs font-bold"
                              :class="{
                                'text-yellow-400': getRank(day.id, agent, lang, part) === 1,
                                'text-gray-400': getRank(day.id, agent, lang, part) === 2,
                                'text-amber-600': getRank(day.id, agent, lang, part) === 3,
                              }"
                            >
                              {{ getRank(day.id, agent, lang, part) === 1 ? '🥇' : 
                                 getRank(day.id, agent, lang, part) === 2 ? '🥈' : 
                                 getRank(day.id, agent, lang, part) === 3 ? '🥉' : '' }}
                            </span>
                            <span 
                              class="text-lg"
                              :class="{
                                'animate-spin': isRunning(agent, day.id, part, lang),
                                'text-aoc-green': getStatus(day.id, agent, lang, part) === 'success',
                                'text-aoc-red': getStatus(day.id, agent, lang, part) === 'error',
                                'text-aoc-silver': getStatus(day.id, agent, lang, part) === 'pending',
                                'text-text-muted/30': getStatus(day.id, agent, lang, part) === 'none',
                              }"
                            >
                              {{ isRunning(agent, day.id, part, lang) ? '⏳' : 
                                 getStatus(day.id, agent, lang, part) === 'success' ? '✓' :
                                 getStatus(day.id, agent, lang, part) === 'error' ? '✗' :
                                 getStatus(day.id, agent, lang, part) === 'pending' ? '?' : '·' }}
                            </span>
                          </div>
                          <!-- Time -->
                          <span 
                            v-if="getTimeFormatted(day.id, agent, lang, part)" 
                            class="text-[10px] font-mono"
                            :class="{
                              'text-yellow-400 font-bold': isFastest(day.id, agent, lang, part),
                              'text-text-muted': !isFastest(day.id, agent, lang, part),
                            }"
                          >
                            {{ getTimeFormatted(day.id, agent, lang, part) }}
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

    <!-- Results Modal with Speed Rankings -->
    <Teleport to="body">
      <div 
        v-if="showResults && currentResults" 
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        @click.self="closeResults"
      >
        <div class="bg-bg-card border border-border rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div class="p-4 border-b border-border flex items-center justify-between">
            <h2 class="text-xl font-bold text-aoc-gold">
              🏁 Day {{ currentResults.day.toString().padStart(2, '0') }} Race Results
            </h2>
            <button @click="closeResults" class="text-text-muted hover:text-white text-2xl">&times;</button>
          </div>
          
          <div class="p-4 overflow-auto max-h-[calc(90vh-80px)]">
            <!-- Results grouped by Part/Lang -->
            <div class="space-y-6">
              <div v-for="part in [1, 2]" :key="part">
                <div v-for="lang in languages" :key="lang" class="mb-4">
                  <h3 class="text-sm font-bold text-aoc-silver mb-2 uppercase">
                    Part {{ part }} - {{ lang.toUpperCase() }}
                  </h3>
                  <div class="space-y-2">
                    <div 
                      v-for="(result, idx) in sortedResults.filter(r => r.part === part && r.language === lang)"
                      :key="`${result.agent}-${result.part}-${result.language}`"
                      class="flex items-center justify-between p-3 rounded-lg"
                      :class="{
                        'bg-yellow-500/20 border border-yellow-500': result.rank === 1 && result.isCorrect,
                        'bg-gray-500/10 border border-gray-500': result.rank === 2 && result.isCorrect,
                        'bg-amber-700/10 border border-amber-700': result.rank === 3 && result.isCorrect,
                        'bg-bg-hover': result.rank > 3 || !result.isCorrect,
                      }"
                    >
                      <div class="flex items-center gap-3">
                        <span class="text-2xl w-8 text-center">
                          {{ result.rank === 1 ? '🥇' : result.rank === 2 ? '🥈' : result.rank === 3 ? '🥉' : '' }}
                        </span>
                        <span :class="`agent-${result.agent}`" class="px-3 py-1 rounded border font-bold capitalize">
                          {{ result.agent }}
                        </span>
                        <span v-if="result.error" class="text-aoc-red text-sm">{{ result.error }}</span>
                        <span v-else-if="!result.isCorrect" class="text-aoc-red text-sm">Wrong answer</span>
                      </div>
                      <div class="text-right">
                        <div 
                          class="text-xl font-mono font-bold"
                          :class="{
                            'text-yellow-400': result.rank === 1 && result.isCorrect,
                            'text-white': result.rank !== 1 || !result.isCorrect,
                          }"
                        >
                          {{ result.error ? '-' : formatTime(result.timeMs) }}
                        </div>
                        <div class="text-xs text-text-muted font-mono">
                          {{ result.answer || '-' }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Winner Summary -->
            <div class="mt-6 pt-4 border-t border-border">
              <h3 class="text-lg font-bold text-aoc-gold mb-3">🏆 Race Summary</h3>
              <div class="grid grid-cols-3 gap-4 text-center">
                <div v-for="agent in agents" :key="agent" class="p-3 rounded bg-bg-hover">
                  <span :class="`agent-${agent}`" class="px-2 py-0.5 rounded border text-sm font-bold capitalize">
                    {{ agent }}
                  </span>
                  <div class="mt-2 flex justify-center gap-4">
                    <div>
                      <span class="text-xl font-bold text-yellow-400">
                        {{ sortedResults.filter(r => r.agent === agent && r.rank === 1).length }}
                      </span>
                      <span class="text-xs text-text-muted ml-1">🥇</span>
                    </div>
                    <div>
                      <span class="text-xl font-bold text-aoc-green">
                        {{ sortedResults.filter(r => r.agent === agent && r.isCorrect === true).length }}
                      </span>
                      <span class="text-xs text-text-muted ml-1">✓</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Quick Links -->
    <div class="flex gap-4 justify-center pt-4">
      <NuxtLink to="/debug" class="px-4 py-2 bg-bg-hover text-aoc-silver rounded hover:bg-bg-card transition-all">
        🔧 Debug
      </NuxtLink>
      <NuxtLink to="/benchmarks" class="px-4 py-2 bg-bg-hover text-aoc-gold rounded hover:bg-bg-card transition-all">
        📊 Benchmarks
      </NuxtLink>
      <NuxtLink to="/admin" class="px-4 py-2 bg-bg-hover text-aoc-green rounded hover:bg-bg-card transition-all">
        ⚙️ Admin
      </NuxtLink>
    </div>
  </div>
</template>
