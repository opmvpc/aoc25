<script setup lang="ts">
import type { Day, Run, Agent, Language } from "~/types";

const route = useRoute();
const dayId = computed(() => parseInt(route.params.id as string));

interface DayDetail extends Day {
  runs: Run[];
  benchmarks: unknown[];
}

const { data: day, pending, error, refresh } = await useFetch<DayDetail>(
  () => `/api/days/${dayId.value}`
);

const agents: Agent[] = ["claude", "codex", "gemini"];
const languages: Language[] = ["ts", "c"];

// Run solver
const runningKey = ref<string | null>(null);

async function runSolver(agent: Agent, part: 1 | 2, lang: Language, useSample = false) {
  const key = `${agent}-${part}-${lang}-${useSample}`;
  runningKey.value = key;

  try {
    await $fetch("/api/runs", {
      method: "POST",
      body: {
        agent,
        day: dayId.value,
        part,
        language: lang,
        useSample,
      },
    });

    await refresh();
  } catch (err) {
    console.error("Run failed:", err);
  } finally {
    runningKey.value = null;
  }
}

// Group runs by agent
const runsByAgent = computed(() => {
  if (!day.value?.runs) return {};

  const grouped: Record<string, Run[]> = {};
  for (const run of day.value.runs) {
    if (!grouped[run.agent]) grouped[run.agent] = [];
    grouped[run.agent]!.push(run);
  }
  return grouped;
});

function formatTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString();
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <NuxtLink to="/" class="text-[#666666] hover:text-[#00cc00]">
          ← Back
        </NuxtLink>
        <h1 class="text-2xl font-bold text-[#ffcc00]">
          🎄 Day {{ dayId.toString().padStart(2, "0") }}
        </h1>
      </div>

      <div v-if="day?.published_at" class="text-sm text-[#666666]">
        📤 Published {{ formatDate(day.published_at) }}
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="text-center py-12">
      <div class="text-2xl animate-pulse">🎄 Loading...</div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="card p-6 text-center text-[#ff0000]">
      <div class="text-2xl mb-2">❌</div>
      <p>Failed to load day: {{ error.message }}</p>
    </div>

    <!-- Content -->
    <div v-else-if="day" class="space-y-8">
      <!-- Puzzle Info -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card p-6">
          <h2 class="text-lg font-bold text-[#00cc00] mb-4">📝 Part 1</h2>
          <div v-if="day.puzzle1_md" class="prose prose-invert max-w-none text-sm">
            {{ day.puzzle1_md.substring(0, 500) }}{{ day.puzzle1_md.length > 500 ? '...' : '' }}
          </div>
          <div v-else class="text-[#666666] italic">No puzzle description yet</div>

          <div class="mt-4 pt-4 border-t border-[#333]">
            <span class="text-sm text-[#666666]">Expected: </span>
            <span class="text-[#ffcc00]">{{ day.answer_p1 || '?' }}</span>
          </div>
        </div>

        <div class="card p-6">
          <h2 class="text-lg font-bold text-[#00cc00] mb-4">📝 Part 2</h2>
          <div v-if="day.puzzle2_md" class="prose prose-invert max-w-none text-sm">
            {{ day.puzzle2_md.substring(0, 500) }}{{ day.puzzle2_md.length > 500 ? '...' : '' }}
          </div>
          <div v-else class="text-[#666666] italic">No puzzle description yet</div>

          <div class="mt-4 pt-4 border-t border-[#333]">
            <span class="text-sm text-[#666666]">Expected: </span>
            <span class="text-[#ffcc00]">{{ day.answer_p2 || '?' }}</span>
          </div>
        </div>
      </div>

      <!-- Run Solvers -->
      <div class="card p-6">
        <h2 class="text-lg font-bold text-[#ffcc00] mb-4">🚀 Run Solvers</h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="agent in agents" :key="agent" class="space-y-4">
            <h3 :class="`agent-${agent}`" class="px-3 py-1 rounded border text-center font-bold">
              {{ agent }}
            </h3>

            <div class="grid grid-cols-2 gap-2">
              <template v-for="lang in languages" :key="lang">
                <template v-for="part in [1, 2] as const" :key="part">
                  <button
                    @click="runSolver(agent, part, lang)"
                    :disabled="runningKey !== null"
                    class="px-3 py-2 text-sm bg-[#1a1a2e] text-[#cccccc] rounded border border-[#333] hover:border-[#00cc00] hover:text-[#00cc00] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    :class="{ 'pulse-running': runningKey === `${agent}-${part}-${lang}-false` }"
                  >
                    {{ lang.toUpperCase() }} P{{ part }}
                  </button>
                </template>
              </template>
            </div>

            <button
              @click="runSolver(agent, 1, 'ts', true)"
              :disabled="runningKey !== null"
              class="w-full px-3 py-1 text-xs bg-[#0f0f23] text-[#666666] rounded border border-[#333] hover:border-[#9999cc] hover:text-[#9999cc] disabled:opacity-50 transition-all"
            >
              Run Sample
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Runs -->
      <div class="card p-6">
        <h2 class="text-lg font-bold text-[#ffcc00] mb-4">📊 Recent Runs</h2>

        <div v-if="day.runs.length === 0" class="text-[#666666] italic text-center py-4">
          No runs yet
        </div>

        <table v-else class="aoc-table">
          <thead>
            <tr>
              <th>Agent</th>
              <th>Part</th>
              <th>Lang</th>
              <th>Answer</th>
              <th>Time</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="run in day.runs.slice(0, 20)" :key="run.id">
              <td>
                <span :class="`agent-${run.agent}`" class="px-2 py-0.5 rounded border text-sm">
                  {{ run.agent }}
                </span>
              </td>
              <td>Part {{ run.part }}</td>
              <td class="uppercase">{{ run.language }}</td>
              <td class="font-mono text-sm">
                {{ run.answer || '-' }}
                <span v-if="run.is_sample" class="text-xs text-[#666666]">(sample)</span>
              </td>
              <td>{{ formatTime(run.time_ms) }}</td>
              <td>
                <span
                  :class="{
                    'text-[#00cc00]': run.is_correct === true,
                    'text-[#ff0000]': run.is_correct === false,
                    'text-[#9999cc]': run.is_correct === null,
                  }"
                >
                  {{ run.is_correct === true ? '✅' : run.is_correct === false ? '❌' : '⏳' }}
                </span>
              </td>
              <td class="text-[#666666] text-sm">{{ formatDate(run.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
