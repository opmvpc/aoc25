<script setup lang="ts">
const agents = ["claude", "codex", "gemini"] as const;
const days = Array.from({ length: 13 }, (_, i) => i);

const selectedAgent = ref<(typeof agents)[number]>("claude");
const selectedDay = ref(0);
const selectedPart = ref<1 | 2>(1);
const selectedLanguage = ref<"ts" | "c">("ts");
const useSample = ref(true);

const isRunning = ref(false);
const result = ref<{
  agent: string;
  day: number;
  part: number;
  language: string;
  useSample: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timeMs: number;
  error?: string;
  command: string;
} | null>(null);

async function runDebug() {
  isRunning.value = true;
  result.value = null;
  try {
    const response = await $fetch("/api/runs/debug", {
      method: "POST",
      body: {
        agent: selectedAgent.value,
        day: selectedDay.value,
        part: selectedPart.value,
        language: selectedLanguage.value,
        useSample: useSample.value,
      },
    });
    result.value = response;
  } catch (err: any) {
    result.value = {
      agent: selectedAgent.value,
      day: selectedDay.value,
      part: selectedPart.value,
      language: selectedLanguage.value,
      useSample: useSample.value,
      stdout: "",
      stderr: err.message || "Unknown error",
      exitCode: null,
      timeMs: 0,
      error: err.message,
      command: "",
    };
  } finally {
    isRunning.value = false;
  }
}

function fmt(ms: number): string {
  if (ms < 0.001) return `${Math.round(ms * 1000000)}ns`;
  if (ms < 1) return `${Math.round(ms * 1000)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
</script>

<template>
  <div class="max-w-5xl mx-auto space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-black flex items-center gap-2">
        <span class="text-yellow-400">🔧</span> Debug Runner
      </h1>
      <NuxtLink to="/" class="text-xs text-white/30 hover:text-white"
        >← Back</NuxtLink
      >
    </div>

    <!-- Controls -->
    <div class="glass rounded-xl p-4">
      <div class="flex items-end gap-3 flex-wrap">
        <!-- Agent -->
        <div class="flex-1 min-w-[120px]">
          <label class="block text-[10px] text-white/40 mb-1">Agent</label>
          <div class="flex gap-1">
            <button
              v-for="agent in agents"
              :key="agent"
              @click="selectedAgent = agent"
              class="flex-1 px-2 py-1.5 rounded text-xs font-bold capitalize transition-all"
              :class="
                selectedAgent === agent
                  ? `agent-${agent}`
                  : 'glass-subtle text-white/40 hover:text-white'
              "
            >
              {{ agent }}
            </button>
          </div>
        </div>

        <!-- Day -->
        <div class="w-24">
          <label class="block text-[10px] text-white/40 mb-1">Day</label>
          <select
            v-model="selectedDay"
            class="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:border-yellow-500/50 focus:outline-none"
          >
            <option v-for="d in days" :key="d" :value="d">Day {{ d }}</option>
          </select>
        </div>

        <!-- Part -->
        <div class="w-24">
          <label class="block text-[10px] text-white/40 mb-1">Part</label>
          <div class="flex gap-1">
            <button
              v-for="p in [1, 2] as const"
              :key="p"
              @click="selectedPart = p"
              class="flex-1 px-2 py-1.5 rounded text-xs font-bold transition-all"
              :class="
                selectedPart === p
                  ? 'bg-white/20 text-white'
                  : 'glass-subtle text-white/40 hover:text-white'
              "
            >
              P{{ p }}
            </button>
          </div>
        </div>

        <!-- Language -->
        <div class="w-24">
          <label class="block text-[10px] text-white/40 mb-1">Language</label>
          <div class="flex gap-1">
            <button
              v-for="lang in ['ts', 'c'] as const"
              :key="lang"
              @click="selectedLanguage = lang"
              class="flex-1 px-2 py-1.5 rounded text-xs font-bold uppercase transition-all"
              :class="
                selectedLanguage === lang
                  ? 'bg-white/20 text-white'
                  : 'glass-subtle text-white/40 hover:text-white'
              "
            >
              {{ lang }}
            </button>
          </div>
        </div>

        <!-- Input Type Switch -->
        <div class="w-32">
          <label class="block text-[10px] text-white/40 mb-1">Input Type</label>
          <div class="flex rounded-lg overflow-hidden border border-white/10">
            <button
              @click="useSample = true"
              class="flex-1 px-2 py-1.5 text-xs font-bold transition-all"
              :class="
                useSample
                  ? 'bg-amber-500 text-black'
                  : 'bg-black/30 text-white/40 hover:text-white'
              "
            >
              🧪 Sample
            </button>
            <button
              @click="useSample = false"
              class="flex-1 px-2 py-1.5 text-xs font-bold transition-all"
              :class="
                !useSample
                  ? 'bg-blue-500 text-white'
                  : 'bg-black/30 text-white/40 hover:text-white'
              "
            >
              📄 Final
            </button>
          </div>
        </div>

        <!-- Run -->
        <UButton
          color="success"
          :loading="isRunning"
          :disabled="isRunning"
          icon="i-heroicons-play"
          @click="runDebug"
        >
          Run
        </UButton>
      </div>
    </div>

    <!-- Result -->
    <div v-if="result" class="space-y-3">
      <!-- Summary -->
      <div
        class="glass rounded-xl p-4 border-l-4"
        :class="
          result.error || result.exitCode !== 0
            ? 'border-red-500'
            : 'border-green-500'
        "
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span
              :class="`agent-${result.agent}`"
              class="px-2 py-1 rounded text-xs font-bold capitalize"
            >
              {{ result.agent }}
            </span>
            <span class="text-white/60 text-sm">
              Day {{ result.day }} · P{{ result.part }} ·
              {{ result.language.toUpperCase() }} ·
              <span
                :class="result.useSample ? 'text-amber-400' : 'text-blue-400'"
              >
                {{ result.useSample ? "Sample" : "Final" }}
              </span>
            </span>
          </div>
          <div class="text-right">
            <div
              class="text-lg font-mono font-bold"
              :class="
                result.error || result.exitCode !== 0
                  ? 'text-red-400'
                  : 'text-green-400'
              "
            >
              {{
                result.error
                  ? "ERROR"
                  : result.exitCode === 0
                  ? "OK"
                  : `Exit ${result.exitCode}`
              }}
            </div>
            <div class="text-xs text-white/40 font-mono">
              {{ fmt(result.timeMs) }}
            </div>
          </div>
        </div>

        <!-- Command -->
        <div
          class="mt-3 p-2 rounded bg-black/30 font-mono text-[11px] text-white/60 overflow-x-auto"
        >
          <span class="text-white/30">$</span> {{ result.command }}
        </div>
      </div>

      <!-- Error -->
      <div
        v-if="result.error"
        class="glass rounded-xl p-4 border border-red-500/30"
      >
        <h3 class="text-sm font-bold text-red-400 mb-2">❌ Error</h3>
        <pre class="text-xs text-red-300 font-mono whitespace-pre-wrap">{{
          result.error
        }}</pre>
      </div>

      <!-- Stdout -->
      <div class="glass rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-bold text-green-400">📤 stdout</h3>
          <span class="text-[10px] text-white/30"
            >{{ result.stdout.length }} chars</span
          >
        </div>
        <pre
          v-if="result.stdout"
          class="p-3 rounded bg-black/30 font-mono text-xs text-white/80 overflow-x-auto whitespace-pre-wrap max-h-60"
          >{{ result.stdout }}</pre
        >
        <p v-else class="text-white/30 text-xs italic">No output</p>
      </div>

      <!-- Stderr -->
      <div class="glass rounded-xl p-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-bold text-yellow-400">⚠️ stderr</h3>
          <span class="text-[10px] text-white/30"
            >{{ result.stderr.length }} chars</span
          >
        </div>
        <pre
          v-if="result.stderr"
          class="p-3 rounded bg-black/30 font-mono text-xs text-yellow-200/80 overflow-x-auto whitespace-pre-wrap max-h-60"
          >{{ result.stderr }}</pre
        >
        <p v-else class="text-white/30 text-xs italic">No errors</p>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="glass rounded-xl p-12 text-center">
      <div class="text-4xl mb-3">🔍</div>
      <p class="text-white/40 text-sm">Select a configuration and click Run</p>
    </div>
  </div>
</template>
