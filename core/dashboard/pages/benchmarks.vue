<script setup lang="ts">
import type { BenchmarkSession, Agent, Language } from "~/types";

const { data: benchmarks, refresh } = await useFetch<BenchmarkSession[]>(
  "/api/benchmarks"
);

const agents: Agent[] = ["claude", "codex", "gemini"];
const languages: Language[] = ["ts", "c"];
const days = Array.from({ length: 13 }, (_, i) => i);

const form = reactive({
  agent: "all" as Agent | "all",
  day: 1,
  part: 1 as 1 | 2,
  language: "ts" as Language,
  numRuns: 100,
});

const running = ref(false);
const result = ref<BenchmarkSession | null>(null);
const batchResult = ref<{
  ranking: Array<{
    rank: number;
    agent: string;
    avgTimeMs: number;
    isCorrect: boolean | null;
  }>;
} | null>(null);

async function runBenchmark() {
  running.value = true;
  result.value = null;
  batchResult.value = null;

  try {
    if (form.agent === "all") {
      const res = await $fetch<{
        ranking: Array<{
          rank: number;
          agent: string;
          avgTimeMs: number;
          isCorrect: boolean | null;
        }>;
      }>("/api/benchmarks/batch", {
        method: "POST",
        body: {
          day: form.day,
          part: form.part,
          language: form.language,
          agents: ["claude", "codex", "gemini"],
          numRuns: form.numRuns,
        },
      });
      batchResult.value = res;
    } else {
      const res = await $fetch<BenchmarkSession>("/api/benchmarks", {
        method: "POST",
        body: {
          agent: form.agent,
          day: form.day,
          part: form.part,
          language: form.language,
          numRuns: form.numRuns,
        },
      });
      result.value = res;
    }
    await refresh();
  } catch (err) {
    console.error("Benchmark failed:", err);
  } finally {
    running.value = false;
  }
}

function fmt(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  if (ms < 0.001) return `${Math.round(ms * 1000000)}ns`;
  if (ms < 1) return `${Math.round(ms * 1000)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const medal = (idx: number) => (idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉");
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-black flex items-center gap-2">
        <span class="text-yellow-400">📊</span> Benchmark Arena
      </h1>
      <NuxtLink to="/" class="text-xs text-white/30 hover:text-white"
        >← Back</NuxtLink
      >
    </div>

    <!-- Run Form -->
    <div class="glass rounded-xl p-4">
      <div class="flex items-end gap-3 flex-wrap">
        <!-- Agent -->
        <div class="flex-1 min-w-[150px]">
          <label class="block text-[10px] text-white/40 mb-1">Agent</label>
          <div class="flex gap-1">
            <button
              @click="form.agent = 'all'"
              class="px-2 py-1.5 rounded text-xs font-bold transition-all"
              :class="
                form.agent === 'all'
                  ? 'bg-yellow-500 text-black'
                  : 'glass-subtle text-white/40 hover:text-white'
              "
            >
              🏆 All
            </button>
            <button
              v-for="agent in agents"
              :key="agent"
              @click="form.agent = agent"
              class="px-2 py-1.5 rounded text-xs font-bold capitalize transition-all"
              :class="
                form.agent === agent
                  ? `agent-${agent}`
                  : 'glass-subtle text-white/40 hover:text-white'
              "
            >
              {{ agent.slice(0, 3) }}
            </button>
          </div>
        </div>

        <!-- Day -->
        <div class="w-24">
          <label class="block text-[10px] text-white/40 mb-1">Day</label>
          <select
            v-model="form.day"
            class="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none"
          >
            <option v-for="d in days" :key="d" :value="d">Day {{ d }}</option>
          </select>
        </div>

        <!-- Part -->
        <div class="w-20">
          <label class="block text-[10px] text-white/40 mb-1">Part</label>
          <div class="flex gap-1">
            <button
              v-for="p in [1, 2] as const"
              :key="p"
              @click="form.part = p"
              class="flex-1 px-2 py-1.5 rounded text-xs font-bold transition-all"
              :class="
                form.part === p
                  ? 'bg-white/20 text-white'
                  : 'glass-subtle text-white/40'
              "
            >
              P{{ p }}
            </button>
          </div>
        </div>

        <!-- Language -->
        <div class="w-20">
          <label class="block text-[10px] text-white/40 mb-1">Lang</label>
          <div class="flex gap-1">
            <button
              v-for="lang in languages"
              :key="lang"
              @click="form.language = lang"
              class="flex-1 px-2 py-1.5 rounded text-xs font-bold uppercase transition-all"
              :class="
                form.language === lang
                  ? 'bg-white/20 text-white'
                  : 'glass-subtle text-white/40'
              "
            >
              {{ lang }}
            </button>
          </div>
        </div>

        <!-- Runs -->
        <div class="w-20">
          <label class="block text-[10px] text-white/40 mb-1">Runs</label>
          <input
            v-model.number="form.numRuns"
            type="number"
            min="10"
            max="1000"
            class="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none"
          />
        </div>

        <!-- Run -->
        <UButton
          :color="form.agent === 'all' ? 'warning' : 'success'"
          :loading="running"
          :disabled="running"
          icon="i-heroicons-play"
          @click="runBenchmark"
        >
          {{ form.agent === "all" ? "Battle!" : "Run" }}
        </UButton>
      </div>
    </div>

    <!-- Battle Result -->
    <div
      v-if="batchResult"
      class="glass rounded-xl p-4 ring-1 ring-yellow-500/30"
    >
      <h2
        class="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2"
      >
        🏆 Battle Royale — Day {{ form.day }} P{{ form.part }}
        {{ form.language.toUpperCase() }}
      </h2>

      <div class="grid grid-cols-3 gap-3">
        <div
          v-for="(item, idx) in batchResult.ranking"
          :key="item.agent"
          class="glass-subtle rounded-lg p-3 text-center"
          :class="{
            'ring-1 ring-yellow-500/50': idx === 0,
            'ring-1 ring-gray-400/30': idx === 1,
            'ring-1 ring-amber-700/30': idx === 2,
          }"
        >
          <div class="text-2xl mb-1">{{ medal(idx) }}</div>
          <span
            :class="`agent-${item.agent}`"
            class="px-2 py-0.5 rounded text-xs font-bold capitalize"
          >
            {{ item.agent }}
          </span>
          <div
            class="text-xl font-mono font-bold mt-2"
            :class="idx === 0 ? 'text-yellow-400' : 'text-white'"
          >
            {{ fmt(item.avgTimeMs) }}
          </div>
          <div
            class="text-[10px] mt-1"
            :class="item.isCorrect ? 'text-green-400' : 'text-red-400'"
          >
            {{
              item.isCorrect === true
                ? "✓ Correct"
                : item.isCorrect === false
                ? "✗ Wrong"
                : "? Unchecked"
            }}
          </div>
        </div>
      </div>
    </div>

    <!-- Single Agent Result -->
    <div v-if="result" class="glass rounded-xl p-4 ring-1 ring-green-500/30">
      <h2 class="text-sm font-bold text-green-400 mb-3">📈 Benchmark Result</h2>

      <div class="grid grid-cols-4 gap-4 mb-4">
        <div class="text-center">
          <div class="text-2xl font-mono font-bold text-green-400">
            {{ fmt(result.avg_time_ms) }}
          </div>
          <div class="text-[10px] text-white/40">Average</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-mono font-bold text-yellow-400">
            {{ fmt(result.p50_time_ms) }}
          </div>
          <div class="text-[10px] text-white/40">Median (P50)</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-mono font-bold text-white/70">
            {{ fmt(result.min_time_ms) }}
          </div>
          <div class="text-[10px] text-white/40">Min</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-mono font-bold text-white/70">
            {{ fmt(result.max_time_ms) }}
          </div>
          <div class="text-[10px] text-white/40">Max</div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 pt-3 border-t border-white/10">
        <div class="text-center">
          <div class="text-lg font-mono text-white/60">
            {{ fmt(result.p95_time_ms) }}
          </div>
          <div class="text-[10px] text-white/30">P95</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-mono text-white/60">
            {{ fmt(result.p99_time_ms) }}
          </div>
          <div class="text-[10px] text-white/30">P99</div>
        </div>
        <div class="text-center">
          <div class="text-lg font-mono text-white/60">
            ±{{ fmt(result.std_dev_ms) }}
          </div>
          <div class="text-[10px] text-white/30">Std Dev</div>
        </div>
      </div>
    </div>

    <!-- History -->
    <div class="glass rounded-xl p-4">
      <h2 class="text-sm font-bold text-white/60 mb-3">📜 History</h2>

      <div
        v-if="!benchmarks?.length"
        class="text-white/30 text-sm text-center py-6"
      >
        No benchmarks yet
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="border-b border-white/10 text-white/40">
              <th class="py-2 px-2 text-left font-normal">Agent</th>
              <th class="py-2 px-2 text-center font-normal">Day</th>
              <th class="py-2 px-2 text-center font-normal">Part</th>
              <th class="py-2 px-2 text-center font-normal">Lang</th>
              <th class="py-2 px-2 text-center font-normal">Runs</th>
              <th class="py-2 px-2 text-right font-normal">Avg</th>
              <th class="py-2 px-2 text-right font-normal">P50</th>
              <th class="py-2 px-2 text-right font-normal">P95</th>
              <th class="py-2 px-2 text-center font-normal">✓</th>
              <th class="py-2 px-2 text-right font-normal">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="b in benchmarks"
              :key="b.id"
              class="border-b border-white/5 hover:bg-white/5"
            >
              <td class="py-1.5 px-2">
                <span
                  :class="`agent-${b.agent}`"
                  class="px-1.5 py-0.5 rounded text-[10px] font-bold capitalize"
                >
                  {{ b.agent.slice(0, 3) }}
                </span>
              </td>
              <td class="py-1.5 px-2 text-center text-white/60">{{ b.day }}</td>
              <td class="py-1.5 px-2 text-center text-white/60">
                P{{ b.part }}
              </td>
              <td class="py-1.5 px-2 text-center text-white/60 uppercase">
                {{ b.language }}
              </td>
              <td class="py-1.5 px-2 text-center text-white/40">
                {{ b.num_runs }}
              </td>
              <td class="py-1.5 px-2 text-right font-mono text-green-400">
                {{ fmt(b.avg_time_ms) }}
              </td>
              <td class="py-1.5 px-2 text-right font-mono text-yellow-400">
                {{ fmt(b.p50_time_ms) }}
              </td>
              <td class="py-1.5 px-2 text-right font-mono text-white/50">
                {{ fmt(b.p95_time_ms) }}
              </td>
              <td class="py-1.5 px-2 text-center">
                <span
                  :class="
                    b.is_correct === true
                      ? 'text-green-400'
                      : b.is_correct === false
                      ? 'text-red-400'
                      : 'text-white/30'
                  "
                >
                  {{
                    b.is_correct === true
                      ? "✓"
                      : b.is_correct === false
                      ? "✗"
                      : "?"
                  }}
                </span>
              </td>
              <td class="py-1.5 px-2 text-right text-white/30">
                {{ formatDate(b.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
