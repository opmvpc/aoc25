<script setup lang="ts">
import type { BenchmarkSession, Agent, Language } from "~/types";

const { data: benchmarks, refresh } = await useFetch<BenchmarkSession[]>("/api/benchmarks");

const agents: Agent[] = ["claude", "codex", "gemini"];
const languages: Language[] = ["ts", "c"];
const days = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Benchmark form
const form = reactive({
  agent: "claude" as Agent | "all",
  day: 0,
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
      // Benchmark all agents
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
      // Single agent
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

function formatTime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "-";
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
    <h1 class="text-2xl font-bold text-[#ffcc00] mb-8">📊 Benchmark Arena</h1>

    <!-- Run Benchmark Form -->
    <div class="card p-6 mb-8">
      <h2 class="text-lg font-bold text-[#00cc00] mb-4">🚀 Run New Benchmark</h2>

      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <!-- Agent -->
        <div>
          <label class="block text-sm text-[#666666] mb-1">Agent</label>
          <select
            v-model="form.agent"
            class="w-full bg-[#0f0f23] border border-[#333] rounded p-2 text-[#cccccc] focus:border-[#00cc00] focus:outline-none"
          >
            <option value="all">🏆 All Agents (Battle!)</option>
            <option v-for="a in agents" :key="a" :value="a">{{ a }}</option>
          </select>
        </div>

        <!-- Day -->
        <div>
          <label class="block text-sm text-[#666666] mb-1">Day</label>
          <select
            v-model="form.day"
            class="w-full bg-[#0f0f23] border border-[#333] rounded p-2 text-[#cccccc] focus:border-[#00cc00] focus:outline-none"
          >
            <option v-for="d in days" :key="d" :value="d">
              Day {{ d.toString().padStart(2, "0") }}{{ d === 0 ? " (Test)" : "" }}
            </option>
          </select>
        </div>

        <!-- Part -->
        <div>
          <label class="block text-sm text-[#666666] mb-1">Part</label>
          <select
            v-model="form.part"
            class="w-full bg-[#0f0f23] border border-[#333] rounded p-2 text-[#cccccc] focus:border-[#00cc00] focus:outline-none"
          >
            <option :value="1">Part 1</option>
            <option :value="2">Part 2</option>
          </select>
        </div>

        <!-- Language -->
        <div>
          <label class="block text-sm text-[#666666] mb-1">Language</label>
          <select
            v-model="form.language"
            class="w-full bg-[#0f0f23] border border-[#333] rounded p-2 text-[#cccccc] focus:border-[#00cc00] focus:outline-none"
          >
            <option v-for="l in languages" :key="l" :value="l">
              {{ l.toUpperCase() }}
            </option>
          </select>
        </div>

        <!-- Num Runs -->
        <div>
          <label class="block text-sm text-[#666666] mb-1">Runs</label>
          <input
            v-model.number="form.numRuns"
            type="number"
            min="10"
            max="1000"
            class="w-full bg-[#0f0f23] border border-[#333] rounded p-2 text-[#cccccc] focus:border-[#00cc00] focus:outline-none"
          />
        </div>
      </div>

      <button
        @click="runBenchmark"
        :disabled="running"
        class="px-6 py-3 bg-[#00cc00] text-[#0f0f23] rounded font-bold hover:bg-[#00ff00] disabled:opacity-50 transition-all"
        :class="{ 'pulse-running': running }"
      >
        {{
          running
            ? "⏳ Benchmarking..."
            : form.agent === "all"
              ? "🏆 Start Battle Royale!"
              : "🏁 Start Benchmark"
        }}
      </button>
    </div>

    <!-- Battle Result -->
    <div v-if="batchResult" class="card p-6 mb-8 glow-gold">
      <h2 class="text-lg font-bold text-[#ffcc00] mb-4">
        🏆 Battle Royale Results - Day {{ form.day }} Part {{ form.part }}
      </h2>

      <div class="space-y-4">
        <div
          v-for="(item, index) in batchResult.ranking"
          :key="item.agent"
          class="flex items-center justify-between p-4 rounded"
          :class="{
            'bg-[#2a2a1e] border border-[#ffcc00]': index === 0,
            'bg-[#1e1e2a] border border-[#9999cc]': index === 1,
            'bg-[#2a1e1e] border border-[#cc9966]': index === 2,
          }"
        >
          <div class="flex items-center gap-4">
            <span class="text-3xl">
              {{ index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉" }}
            </span>
            <span
              :class="`agent-${item.agent}`"
              class="px-3 py-1 rounded border text-lg font-bold"
            >
              {{ item.agent }}
            </span>
          </div>

          <div class="text-right">
            <div class="text-2xl font-bold text-[#00cc00]">
              {{ formatTime(item.avgTimeMs) }}
            </div>
            <div class="text-sm text-[#666666]">
              {{
                item.isCorrect === true
                  ? "✅ Correct"
                  : item.isCorrect === false
                    ? "❌ Wrong"
                    : "⏳ Unchecked"
              }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Single Agent Result -->
    <div v-if="result" class="card p-6 mb-8 glow-gold">
      <h2 class="text-lg font-bold text-[#ffcc00] mb-4">🏆 Latest Result</h2>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div class="text-center">
          <div class="text-3xl font-bold text-[#00cc00]">
            {{ formatTime(result.avg_time_ms) }}
          </div>
          <div class="text-sm text-[#666666]">Average</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-[#9999cc]">
            {{ formatTime(result.min_time_ms) }}
          </div>
          <div class="text-sm text-[#666666]">Min</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-[#9999cc]">
            {{ formatTime(result.max_time_ms) }}
          </div>
          <div class="text-sm text-[#666666]">Max</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-bold text-[#ffcc00]">
            {{ formatTime(result.p50_time_ms) }}
          </div>
          <div class="text-sm text-[#666666]">P50 (Median)</div>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#333]">
        <div class="text-center">
          <div class="text-xl text-[#cccccc]">
            {{ formatTime(result.p95_time_ms) }}
          </div>
          <div class="text-xs text-[#666666]">P95</div>
        </div>
        <div class="text-center">
          <div class="text-xl text-[#cccccc]">
            {{ formatTime(result.p99_time_ms) }}
          </div>
          <div class="text-xs text-[#666666]">P99</div>
        </div>
        <div class="text-center">
          <div class="text-xl text-[#cccccc]">
            ±{{ formatTime(result.std_dev_ms) }}
          </div>
          <div class="text-xs text-[#666666]">Std Dev</div>
        </div>
      </div>
    </div>

    <!-- History -->
    <div class="card p-6">
      <h2 class="text-lg font-bold text-[#ffcc00] mb-4">📜 Benchmark History</h2>

      <div
        v-if="!benchmarks?.length"
        class="text-[#666666] italic text-center py-8"
      >
        No benchmarks yet. Run your first benchmark above!
      </div>

      <table v-else class="aoc-table">
        <thead>
          <tr>
            <th>Agent</th>
            <th>Day</th>
            <th>Part</th>
            <th>Lang</th>
            <th>Runs</th>
            <th>Avg</th>
            <th>P50</th>
            <th>P95</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="b in benchmarks" :key="b.id">
            <td>
              <span
                :class="`agent-${b.agent}`"
                class="px-2 py-0.5 rounded border text-sm"
              >
                {{ b.agent }}
              </span>
            </td>
            <td>{{ b.day }}</td>
            <td>P{{ b.part }}</td>
            <td class="uppercase">{{ b.language }}</td>
            <td>{{ b.num_runs }}</td>
            <td class="text-[#00cc00] font-mono">
              {{ formatTime(b.avg_time_ms) }}
            </td>
            <td class="text-[#ffcc00] font-mono">
              {{ formatTime(b.p50_time_ms) }}
            </td>
            <td class="text-[#9999cc] font-mono">
              {{ formatTime(b.p95_time_ms) }}
            </td>
            <td>
              <span
                :class="
                  b.is_correct === true
                    ? 'text-[#00cc00]'
                    : b.is_correct === false
                      ? 'text-[#ff0000]'
                      : 'text-[#9999cc]'
                "
              >
                {{
                  b.is_correct === true
                    ? "✅"
                    : b.is_correct === false
                      ? "❌"
                      : "⏳"
                }}
              </span>
            </td>
            <td class="text-[#666666] text-sm">{{ formatDate(b.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
