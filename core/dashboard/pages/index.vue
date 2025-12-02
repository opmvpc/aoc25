<script setup lang="ts">
import type { DayWithRuns, Agent, Language } from "~/types";

const { data: days, pending, error, refresh } = await useFetch<DayWithRuns[]>("/api/days");

const agents: Agent[] = ["claude", "codex", "gemini"];
const languages: Language[] = ["ts", "c"];

// Running state
const runningDay = ref<number | null>(null);
const runningAgent = ref<string | null>(null);

function getStatus(
  day: DayWithRuns,
  agent: Agent,
  lang: Language,
  part: 1 | 2
): "success" | "error" | "pending" | "none" {
  const run = day.latestRuns?.[agent]?.[lang]?.[`part${part}`];
  if (!run) return "none";
  if (run.is_correct === true) return "success";
  if (run.is_correct === false) return "error";
  return "pending";
}

function getTime(
  day: DayWithRuns,
  agent: Agent,
  lang: Language,
  part: 1 | 2
): string | null {
  const run = day.latestRuns?.[agent]?.[lang]?.[`part${part}`];
  if (!run) return null;

  const ms = run.time_ms;
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function countStars(day: DayWithRuns): { gold: number; silver: number } {
  let gold = 0;
  let silver = 0;

  for (const agent of agents) {
    for (const lang of languages) {
      const p1 = getStatus(day, agent, lang, 1);
      const p2 = getStatus(day, agent, lang, 2);

      if (p1 === "success") gold++;
      if (p2 === "success") silver++;
    }
  }

  return { gold, silver };
}

const totalStars = computed(() => {
  if (!days.value) return { gold: 0, silver: 0 };

  return days.value.reduce(
    (acc, day) => {
      const stars = countStars(day);
      return {
        gold: acc.gold + stars.gold,
        silver: acc.silver + stars.silver,
      };
    },
    { gold: 0, silver: 0 }
  );
});

// Run single agent
async function runSolver(
  day: number,
  agent: Agent,
  part: 1 | 2,
  language: Language
) {
  runningAgent.value = `${agent}-${day}-${part}-${language}`;

  try {
    await $fetch("/api/runs", {
      method: "POST",
      body: { agent, day, part, language, useSample: false },
    });
    await refresh();
  } catch (e) {
    console.error("Run failed:", e);
  } finally {
    runningAgent.value = null;
  }
}

// Run all agents for a day
async function runAllForDay(day: number) {
  runningDay.value = day;

  try {
    await $fetch("/api/runs/batch", {
      method: "POST",
      body: {
        day,
        agents: ["claude", "codex", "gemini"],
        parts: [1, 2],
        languages: ["ts"],
        useSample: false,
      },
    });
    await refresh();
  } catch (e) {
    console.error("Batch run failed:", e);
  } finally {
    runningDay.value = null;
  }
}

// Check if a specific run is in progress
function isRunning(agent: string, day: number, part: number, lang: string) {
  return runningAgent.value === `${agent}-${day}-${part}-${lang}`;
}
</script>

<template>
  <div>
    <!-- Stats Header -->
    <div class="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="card p-6 text-center">
        <div class="text-4xl mb-2">🎄</div>
        <div class="text-2xl font-bold text-[#00cc00]">
          {{ days?.length || 0 }}
        </div>
        <div class="text-sm text-[#666666]">Days Available</div>
      </div>

      <div class="card p-6 text-center">
        <div class="text-4xl mb-2 star-gold">★</div>
        <div class="text-2xl font-bold text-[#ffcc00]">{{ totalStars.gold }}</div>
        <div class="text-sm text-[#666666]">Part 1 Solved</div>
      </div>

      <div class="card p-6 text-center">
        <div class="text-4xl mb-2 star-silver">★</div>
        <div class="text-2xl font-bold text-[#9999cc]">
          {{ totalStars.silver }}
        </div>
        <div class="text-sm text-[#666666]">Part 2 Solved</div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="text-center py-12">
      <div class="text-2xl animate-pulse">🎄 Loading...</div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="card p-6 text-center text-[#ff0000]">
      <div class="text-2xl mb-2">❌</div>
      <p>Failed to load days: {{ error.message }}</p>
      <button
        @click="refresh"
        class="mt-4 px-4 py-2 bg-[#1a1a2e] text-[#00cc00] rounded hover:bg-[#2a2a3e]"
      >
        Retry
      </button>
    </div>

    <!-- Days Grid -->
    <div v-else class="space-y-6">
      <h2 class="text-xl font-bold text-[#ffcc00] mb-4">📅 Battle Grid</h2>

      <div class="overflow-x-auto">
        <table class="aoc-table">
          <thead>
            <tr>
              <th>Day</th>
              <th
                v-for="agent in agents"
                :key="agent"
                colspan="2"
                class="text-center"
              >
                <span :class="`agent-${agent}`" class="px-2 py-1 rounded border">
                  {{ agent }}
                </span>
              </th>
              <th>Actions</th>
            </tr>
            <tr class="text-[#666666] text-sm">
              <th></th>
              <template v-for="agent in agents" :key="agent">
                <th class="text-center">TS</th>
                <th class="text-center">C</th>
              </template>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in days" :key="day.id">
              <td>
                <NuxtLink
                  :to="`/day/${day.id}`"
                  class="text-[#00cc00] hover:text-[#ffcc00] font-bold"
                >
                  Day {{ day.id.toString().padStart(2, "0") }}
                </NuxtLink>
                <span v-if="day.id === 0" class="ml-1 text-xs text-[#666666]">
                  (Test)
                </span>
                <span
                  v-if="day.published_at"
                  class="ml-2 text-xs text-[#666666]"
                  title="Published"
                >
                  📤
                </span>
              </td>

              <template v-for="agent in agents" :key="agent">
                <template v-for="lang in languages" :key="lang">
                  <td class="text-center">
                    <div class="flex items-center justify-center gap-1">
                      <!-- Part 1 -->
                      <button
                        @click="runSolver(day.id, agent, 1, lang)"
                        :disabled="!!runningAgent || runningDay === day.id"
                        :class="{
                          'text-[#00cc00]': getStatus(day, agent, lang, 1) === 'success',
                          'text-[#ff0000]': getStatus(day, agent, lang, 1) === 'error',
                          'text-[#9999cc]': getStatus(day, agent, lang, 1) === 'pending',
                          'text-[#333333]': getStatus(day, agent, lang, 1) === 'none',
                          'animate-spin': isRunning(agent, day.id, 1, lang),
                          'hover:scale-125 transition-transform cursor-pointer': !runningAgent && runningDay !== day.id,
                          'opacity-50': !!runningAgent || runningDay === day.id,
                        }"
                        :title="getTime(day, agent, lang, 1) || 'Click to run Part 1'"
                      >
                        {{
                          isRunning(agent, day.id, 1, lang) ? "⏳" :
                          getStatus(day, agent, lang, 1) === "success" ? "★" :
                          getStatus(day, agent, lang, 1) === "error" ? "✗" :
                          getStatus(day, agent, lang, 1) === "pending" ? "?" : "·"
                        }}
                      </button>

                      <!-- Part 2 -->
                      <button
                        @click="runSolver(day.id, agent, 2, lang)"
                        :disabled="!!runningAgent || runningDay === day.id"
                        :class="{
                          'text-[#ffcc00]': getStatus(day, agent, lang, 2) === 'success',
                          'text-[#ff0000]': getStatus(day, agent, lang, 2) === 'error',
                          'text-[#9999cc]': getStatus(day, agent, lang, 2) === 'pending',
                          'text-[#333333]': getStatus(day, agent, lang, 2) === 'none',
                          'animate-spin': isRunning(agent, day.id, 2, lang),
                          'hover:scale-125 transition-transform cursor-pointer': !runningAgent && runningDay !== day.id,
                          'opacity-50': !!runningAgent || runningDay === day.id,
                        }"
                        :title="getTime(day, agent, lang, 2) || 'Click to run Part 2'"
                      >
                        {{
                          isRunning(agent, day.id, 2, lang) ? "⏳" :
                          getStatus(day, agent, lang, 2) === "success" ? "★" :
                          getStatus(day, agent, lang, 2) === "error" ? "✗" :
                          getStatus(day, agent, lang, 2) === "pending" ? "?" : "·"
                        }}
                      </button>
                    </div>
                  </td>
                </template>
              </template>

              <!-- Run All Button -->
              <td class="text-center">
                <button
                  @click="runAllForDay(day.id)"
                  :disabled="!!runningAgent || runningDay !== null"
                  class="px-2 py-1 text-xs rounded transition-colors"
                  :class="{
                    'bg-[#1a1a2e] text-[#00cc00] hover:bg-[#2a2a3e]': runningDay !== day.id,
                    'bg-[#2a2a3e] text-[#ffcc00] animate-pulse': runningDay === day.id,
                    'opacity-50 cursor-not-allowed': !!runningAgent || (runningDay !== null && runningDay !== day.id),
                  }"
                >
                  {{ runningDay === day.id ? "Running..." : "▶ Run All" }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Legend -->
      <div
        class="flex items-center justify-center gap-6 text-sm text-[#666666] mt-4"
      >
        <span><span class="text-[#00cc00]">★</span> Part 1 OK</span>
        <span><span class="text-[#ffcc00]">★</span> Part 2 OK</span>
        <span><span class="text-[#ff0000]">✗</span> Wrong</span>
        <span><span class="text-[#9999cc]">?</span> Pending</span>
        <span><span class="text-[#333333]">·</span> Not run</span>
      </div>

      <!-- Quick Actions -->
      <div class="card p-4 mt-6">
        <h3 class="text-lg font-bold text-[#ffcc00] mb-3">⚡ Quick Actions</h3>
        <div class="flex flex-wrap gap-2">
          <NuxtLink
            to="/admin"
            class="px-4 py-2 bg-[#1a1a2e] text-[#00cc00] rounded hover:bg-[#2a2a3e]"
          >
            ⚙️ Admin Panel
          </NuxtLink>
          <NuxtLink
            to="/benchmarks"
            class="px-4 py-2 bg-[#1a1a2e] text-[#ffcc00] rounded hover:bg-[#2a2a3e]"
          >
            📊 Benchmarks
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
