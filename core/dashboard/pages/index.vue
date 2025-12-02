<script setup lang="ts">
import type { DayWithRuns, Agent, Language } from "~/types";

const { data: days, pending, error, refresh } = await useFetch<DayWithRuns[]>("/api/days");

const agents: Agent[] = ["claude", "codex", "gemini"];
const languages: Language[] = ["ts", "c"];

const modelNames: Record<Agent, string> = {
  claude: "Sonnet 4.5",
  codex: "GPT-5.1-codex-max",
  gemini: "Gemini 3 Pro",
};

// Language filter
const langFilter = ref<'all' | 'ts' | 'c'>('all');
const filteredLangs = computed(() => langFilter.value === 'all' ? languages : [langFilter.value]);

// Running state
const runningDay = ref<number | null>(null);
const runningAll = ref(false);
const runningItems = ref<Set<string>>(new Set());

// Status grid
const statusGrid = computed(() => {
  if (!days.value) return new Map();
  const grid = new Map<string, { status: "success" | "error" | "pending" | "none"; timeMs: number | null }>();

  for (const day of days.value) {
    for (const agent of agents) {
      for (const lang of languages) {
        for (const part of [1, 2] as const) {
          const run = day.latestRuns?.[agent]?.[lang]?.[`part${part}`];
          let status: "success" | "error" | "pending" | "none" = "none";
          let timeMs: number | null = null;
          if (run) {
            timeMs = run.time_ms;
            status = run.is_correct === true ? "success" : run.is_correct === false ? "error" : "pending";
          }
          grid.set(`${day.id}-${agent}-${lang}-${part}`, { status, timeMs });
        }
      }
    }
  }
  return grid;
});

function getCell(dayId: number, agent: Agent, lang: Language, part: 1 | 2) {
  return statusGrid.value.get(`${dayId}-${agent}-${lang}-${part}`) || { status: "none" as const, timeMs: null };
}

function getRank(dayId: number, agent: Agent, lang: Language, part: 1 | 2): number | null {
  const times = agents
    .map(a => ({ agent: a, time: getCell(dayId, a, lang, part) }))
    .filter(t => t.time.status === "success" && t.time.timeMs !== null)
    .sort((a, b) => a.time.timeMs! - b.time.timeMs!);
  const idx = times.findIndex(t => t.agent === agent);
  return idx >= 0 ? idx + 1 : null;
}

function getDayTotal(dayId: number, agent: Agent): number | null {
  let total = 0;
  for (const lang of filteredLangs.value) {
    for (const part of [1, 2] as const) {
      const cell = getCell(dayId, agent, lang, part);
      if (cell.status === 'success' && cell.timeMs !== null) total += cell.timeMs;
      else return null;
    }
  }
  return total;
}

function getDayRank(dayId: number, agent: Agent): number | null {
  const times = agents
    .map(a => ({ agent: a, total: getDayTotal(dayId, a) }))
    .filter(t => t.total !== null)
    .sort((a, b) => a.total! - b.total!);
  const idx = times.findIndex(t => t.agent === agent);
  return idx >= 0 ? idx + 1 : null;
}

const leaderboard = computed(() => {
  const scores: Record<Agent, { wins: number; totalMs: number; days: number }> = {
    claude: { wins: 0, totalMs: 0, days: 0 },
    codex: { wins: 0, totalMs: 0, days: 0 },
    gemini: { wins: 0, totalMs: 0, days: 0 },
  };

  if (!days.value) return [];

  for (const day of days.value) {
    if (day.id === 0) continue;
    for (const agent of agents) {
      const total = getDayTotal(day.id, agent);
      const rank = getDayRank(day.id, agent);
      if (total !== null) {
        scores[agent].days++;
        scores[agent].totalMs += total;
        if (rank === 1) scores[agent].wins++;
      }
    }
  }

  return Object.entries(scores)
    .sort((a, b) => {
      if (a[1].days > 0 && b[1].days === 0) return -1;
      if (b[1].days > 0 && a[1].days === 0) return 1;
      return a[1].totalMs - b[1].totalMs;
    })
    .map(([agent, s], idx) => ({ agent: agent as Agent, rank: idx + 1, ...s }));
});

// Run handlers
async function runDay(dayId: number, sample = false) {
  runningDay.value = dayId;
  try {
    for (const agent of agents) {
      for (const part of [1, 2] as const) {
        for (const lang of languages) {
          const key = `${agent}-${dayId}-${part}-${lang}`;
          runningItems.value.add(key);
          try {
            await $fetch("/api/runs", { method: "POST", body: { agent, day: dayId, part, language: lang, useSample: sample } });
          } catch (e) { console.error(e); }
          runningItems.value.delete(key);
        }
      }
    }
    await refresh();
  } finally {
    runningDay.value = null;
  }
}

async function runAll() {
  if (!days.value) return;
  runningAll.value = true;
  try {
    for (const day of days.value) {
      await runDay(day.id, false);
    }
  } finally {
    runningAll.value = false;
    runningItems.value.clear();
  }
}

async function runSingle(dayId: number, agent: Agent, part: 1 | 2, lang: Language) {
  const key = `${agent}-${dayId}-${part}-${lang}`;
  runningItems.value.add(key);
  try {
    await $fetch("/api/runs", { method: "POST", body: { agent, day: dayId, part, language: lang, useSample: false } });
    await refresh();
  } catch (e) { console.error(e); }
  runningItems.value.delete(key);
}

function isRunning(agent: Agent, dayId: number, part: number, lang: Language) {
  return runningItems.value.has(`${agent}-${dayId}-${part}-${lang}`);
}

function fmt(ms: number): string {
  if (ms < 0.001) return `${Math.round(ms * 1000000)}ns`;
  if (ms < 1) return `${Math.round(ms * 1000)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function fmtTotal(ms: number): string {
  if (ms < 0.001) return `${Math.round(ms * 1000000)}ns`;
  if (ms < 1) return `${Math.round(ms * 1000)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
  if (ms < 1) return `${(ms * 1000).toFixed(2)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

const medal = (r: number | null) => r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : '';
</script>

<template>
  <div class="space-y-4 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-2">
      <h1 class="text-xl font-black flex items-center gap-2">
        <span class="text-yellow-400">🏎️</span> AoC 2025 Battle Royale
      </h1>

      <div class="flex items-center gap-3">
        <!-- Run All -->
        <UButton
          size="xs"
          color="warning"
          variant="soft"
          :loading="runningAll"
          :disabled="runningAll || runningDay !== null"
          icon="i-heroicons-play"
          @click="runAll"
        >
          Run All
        </UButton>

        <!-- Language Filter -->
        <div class="flex items-center gap-1 glass-subtle px-2 py-1 rounded-lg">
          <span class="text-[10px] text-white/40">Filter:</span>
          <button
            v-for="opt in (['all', 'ts', 'c'] as const)"
            :key="opt"
            @click="langFilter = opt"
            class="px-2 py-0.5 rounded text-xs font-bold transition-all"
            :class="
              langFilter === opt
                ? 'bg-yellow-500 text-black'
                : 'text-white/50 hover:text-white'
            "
          >
            {{ opt === "all" ? "All" : opt.toUpperCase() }}
          </button>
        </div>
      </div>
    </div>

    <!-- Leaderboard -->
    <div class="grid grid-cols-3 gap-2">
      <div
        v-for="e in leaderboard"
        :key="e.agent"
        class="glass rounded-lg p-2 flex items-center gap-2"
        :class="{ 'ring-1 ring-yellow-500/50': e.rank === 1 }"
      >
        <span class="text-xl">{{ medal(e.rank) || "🏅" }}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <span
              :class="`agent-${e.agent}`"
              class="px-1.5 py-0.5 rounded text-[10px] font-bold capitalize"
              >{{ e.agent }}</span
            >
            <span class="text-[9px] text-white/30 truncate">{{
              modelNames[e.agent]
            }}</span>
          </div>
          <div class="flex items-center gap-2 mt-0.5">
            <span
              class="text-sm font-mono font-bold"
              :class="e.rank === 1 ? 'text-yellow-400' : 'text-white'"
            >
              {{ e.days > 0 ? fmtTotal(e.totalMs) : "—" }}
            </span>
            <span class="text-[10px] text-white/30"
              >{{ e.wins }}🏆 {{ e.days }}d</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="text-center py-6">
      <UIcon
        name="i-heroicons-arrow-path"
        class="w-6 h-6 animate-spin text-yellow-400"
      />
    </div>
    <UAlert v-else-if="error" color="error" :title="error.message" />

    <!-- Race Grid -->
    <div v-else class="space-y-1">
      <div
        v-for="day in days"
        :key="day.id"
        class="glass rounded-lg overflow-hidden"
        :class="{ 'ring-1 ring-yellow-500/40': runningDay === day.id }"
      >
        <div class="flex items-stretch">
          <!-- Day Column -->
          <div
            class="w-14 shrink-0 flex flex-col items-center justify-center py-1 border-r border-white/10"
            :class="day.id === 0 ? 'bg-purple-500/10' : 'bg-green-500/10'"
          >
            <span
              class="text-sm font-bold"
              :class="day.id === 0 ? 'text-purple-400' : 'text-green-400'"
            >
              {{ day.id.toString().padStart(2, "0") }}
            </span>
            <div class="flex gap-0.5 mt-0.5">
              <button
                @click="runDay(day.id, true)"
                :disabled="runningDay !== null || runningAll"
                class="text-[8px] px-1 py-0.5 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30"
              >
                S
              </button>
              <button
                @click="runDay(day.id, false)"
                :disabled="runningDay !== null || runningAll"
                class="text-[8px] px-1 py-0.5 rounded bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 disabled:opacity-30"
              >
                ▶
              </button>
            </div>
          </div>

          <!-- Results Grid - Fixed columns -->
          <div class="flex-1 overflow-x-auto">
            <table class="w-full text-[11px] table-fixed">
              <colgroup>
                <col class="w-12" />
                <template v-for="lang in filteredLangs" :key="lang">
                  <col class="w-24" />
                  <col class="w-24" />
                </template>
                <col v-if="day.id !== 0" class="w-28" />
              </colgroup>
              <thead>
                <tr class="border-b border-white/5">
                  <th class="py-0.5 px-1 text-left text-white/30 font-normal">
                    Agent
                  </th>
                  <template v-for="lang in filteredLangs" :key="lang">
                    <th
                      class="py-0.5 px-1 text-center text-white/30 font-normal"
                    >
                      {{ lang.toUpperCase() }} P1
                    </th>
                    <th
                      class="py-0.5 px-1 text-center text-white/30 font-normal"
                    >
                      {{ lang.toUpperCase() }} P2
                    </th>
                  </template>
                  <th
                    v-if="day.id !== 0"
                    class="py-0.5 px-1 text-center text-white/30 font-normal"
                  >
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="agent in agents"
                  :key="agent"
                  class="border-b border-white/5 last:border-0 hover:bg-white/5"
                >
                  <td class="py-1 px-1">
                    <span
                      :class="`agent-${agent}`"
                      class="px-1 py-0.5 rounded text-[9px] font-bold uppercase"
                    >
                      {{ agent.slice(0, 3) }}
                    </span>
                  </td>
                  <template v-for="lang in filteredLangs" :key="lang">
                    <td
                      v-for="part in [1, 2] as const"
                      :key="part"
                      class="py-1 px-1"
                    >
                      <button
                        @click="runSingle(day.id, agent, part, lang)"
                        :disabled="runningDay !== null || runningAll"
                        class="w-full flex items-center justify-center gap-1 px-1 py-0.5 rounded transition-all hover:bg-white/10"
                        :class="{
                          'bg-green-500/15':
                            getCell(day.id, agent, lang, part).status ===
                            'success',
                          'bg-red-500/15':
                            getCell(day.id, agent, lang, part).status ===
                            'error',
                          'animate-pulse bg-yellow-500/20': isRunning(
                            agent,
                            day.id,
                            part,
                            lang
                          ),
                        }"
                      >
                        <span
                          v-if="getRank(day.id, agent, lang, part)"
                          class="text-[9px]"
                        >
                          {{ medal(getRank(day.id, agent, lang, part)) }}
                        </span>
                        <span
                          class="font-mono tabular-nums"
                          :class="
                            getRank(day.id, agent, lang, part) === 1
                              ? 'text-yellow-400 font-semibold'
                              : 'text-white/70'
                          "
                        >
                          {{
                            getCell(day.id, agent, lang, part).timeMs !== null
                              ? fmt(getCell(day.id, agent, lang, part).timeMs!)
                              : "—"
                          }}
                        </span>
                      </button>
                    </td>
                  </template>
                  <!-- Total -->
                  <td v-if="day.id !== 0" class="py-1 px-1">
                    <div
                      v-if="getDayTotal(day.id, agent) !== null"
                      class="flex items-center justify-center gap-1 px-1.5 py-0.5 rounded font-mono tabular-nums"
                      :class="{
                        'bg-yellow-500/20 text-yellow-400 font-semibold': getDayRank(day.id, agent) === 1,
                        'bg-gray-400/15 text-gray-300': getDayRank(day.id, agent) === 2,
                        'bg-amber-700/15 text-amber-500': getDayRank(day.id, agent) === 3,
                        'text-white/50': !getDayRank(day.id, agent) || getDayRank(day.id, agent)! > 3,
                      }"
                    >
                      <span class="text-[9px]">{{
                        medal(getDayRank(day.id, agent))
                      }}</span>
                      {{ fmtTotal(getDayTotal(day.id, agent)!) }}
                    </div>
                    <div v-else class="text-center text-white/20">—</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
