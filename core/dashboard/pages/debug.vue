<script setup lang="ts">
definePageMeta({
  title: "Debug Runner",
});

const agents = ["claude", "codex", "gemini"] as const;
const days = Array.from({ length: 13 }, (_, i) => i);
const parts = [1, 2] as const;
const languages = ["ts", "c"] as const;

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

function formatTime(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

const agentColors = {
  claude: "text-orange-400",
  codex: "text-green-400",
  gemini: "text-blue-400",
};

const agentEmojis = {
  claude: "🟠",
  codex: "🟢",
  gemini: "🔵",
};
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white p-8">
    <div class="max-w-6xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold mb-2">🔧 Debug Runner</h1>
        <p class="text-gray-400">Exécutez une solution et inspectez l'output brut</p>
      </div>

      <!-- Controls -->
      <div class="bg-gray-800 rounded-xl p-6 mb-8 shadow-xl">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <!-- Agent -->
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">Agent</label>
            <select
              v-model="selectedAgent"
              class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option v-for="agent in agents" :key="agent" :value="agent">
                {{ agentEmojis[agent] }} {{ agent }}
              </option>
            </select>
          </div>

          <!-- Day -->
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">Day</label>
            <select
              v-model="selectedDay"
              class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option v-for="day in days" :key="day" :value="day">
                Day {{ day }}
              </option>
            </select>
          </div>

          <!-- Part -->
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">Part</label>
            <select
              v-model="selectedPart"
              class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option v-for="part in parts" :key="part" :value="part">
                Part {{ part }}
              </option>
            </select>
          </div>

          <!-- Language -->
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">Language</label>
            <select
              v-model="selectedLanguage"
              class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ts">TypeScript</option>
              <option value="c">C</option>
            </select>
          </div>

          <!-- Sample Toggle -->
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">Input</label>
            <button
              @click="useSample = !useSample"
              :class="[
                'w-full px-4 py-2.5 rounded-lg font-medium transition-colors',
                useSample
                  ? 'bg-yellow-600 hover:bg-yellow-500 text-white'
                  : 'bg-purple-600 hover:bg-purple-500 text-white',
              ]"
            >
              {{ useSample ? "📋 Sample" : "📄 Final" }}
            </button>
          </div>

          <!-- Run Button -->
          <div>
            <label class="block text-sm font-medium text-gray-400 mb-2">&nbsp;</label>
            <button
              @click="runDebug"
              :disabled="isRunning"
              :class="[
                'w-full px-6 py-2.5 rounded-lg font-bold transition-all transform',
                isRunning
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 hover:scale-105',
              ]"
            >
              <span v-if="isRunning" class="flex items-center justify-center gap-2">
                <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running...
              </span>
              <span v-else>▶️ Run</span>
            </button>
          </div>
        </div>

        <!-- Quick preset buttons -->
        <div class="flex flex-wrap gap-2">
          <span class="text-gray-500 text-sm mr-2">Quick:</span>
          <button
            v-for="agent in agents"
            :key="agent"
            @click="selectedAgent = agent"
            :class="[
              'px-3 py-1 rounded-full text-sm font-medium transition-colors',
              selectedAgent === agent
                ? 'bg-gray-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600',
            ]"
          >
            {{ agentEmojis[agent] }} {{ agent }}
          </button>
          <span class="text-gray-600 mx-2">|</span>
          <button
            v-for="day in [0, 1, 2, 3]"
            :key="day"
            @click="selectedDay = day"
            :class="[
              'px-3 py-1 rounded-full text-sm font-medium transition-colors',
              selectedDay === day
                ? 'bg-gray-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600',
            ]"
          >
            Day {{ day }}
          </button>
        </div>
      </div>

      <!-- Result -->
      <div v-if="result" class="space-y-6">
        <!-- Summary Card -->
        <div
          :class="[
            'rounded-xl p-6 shadow-xl border-l-4',
            result.error || result.exitCode !== 0
              ? 'bg-red-900/30 border-red-500'
              : 'bg-green-900/30 border-green-500',
          ]"
        >
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-4">
              <span class="text-3xl">{{ agentEmojis[result.agent as keyof typeof agentEmojis] }}</span>
              <div>
                <h2 class="text-xl font-bold">
                  {{ result.agent }} • Day {{ result.day }} Part {{ result.part }}
                </h2>
                <p class="text-gray-400">
                  {{ result.language === "ts" ? "TypeScript" : "C" }} •
                  {{ result.useSample ? "Sample Input" : "Final Input" }}
                </p>
              </div>
            </div>
            <div class="text-right">
              <div
                :class="[
                  'text-2xl font-mono font-bold',
                  result.error || result.exitCode !== 0 ? 'text-red-400' : 'text-green-400',
                ]"
              >
                {{ result.error ? "ERROR" : result.exitCode === 0 ? "SUCCESS" : `Exit ${result.exitCode}` }}
              </div>
              <div class="text-gray-400">{{ formatTime(result.timeMs) }}</div>
            </div>
          </div>

          <!-- Command -->
          <div class="bg-gray-900/50 rounded-lg p-3 font-mono text-sm">
            <span class="text-gray-500">$</span>
            <span class="text-blue-400 ml-2">{{ result.command }}</span>
          </div>
        </div>

        <!-- Error -->
        <div v-if="result.error" class="bg-red-900/20 rounded-xl p-6 border border-red-800">
          <h3 class="text-lg font-bold text-red-400 mb-3">❌ Error</h3>
          <pre class="font-mono text-sm text-red-300 whitespace-pre-wrap">{{ result.error }}</pre>
        </div>

        <!-- Stdout -->
        <div class="bg-gray-800 rounded-xl p-6 shadow-xl">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-green-400">📤 stdout</h3>
            <span class="text-gray-500 text-sm">{{ result.stdout.length }} chars</span>
          </div>
          <pre
            v-if="result.stdout"
            class="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto whitespace-pre-wrap text-gray-300"
          >{{ result.stdout }}</pre>
          <p v-else class="text-gray-500 italic">No output</p>
        </div>

        <!-- Stderr -->
        <div class="bg-gray-800 rounded-xl p-6 shadow-xl">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-yellow-400">⚠️ stderr</h3>
            <span class="text-gray-500 text-sm">{{ result.stderr.length }} chars</span>
          </div>
          <pre
            v-if="result.stderr"
            class="bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto whitespace-pre-wrap text-yellow-200"
          >{{ result.stderr }}</pre>
          <p v-else class="text-gray-500 italic">No errors</p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-20 text-gray-500">
        <div class="text-6xl mb-4">🔍</div>
        <p class="text-xl">Sélectionnez une configuration et cliquez sur Run</p>
        <p class="text-sm mt-2">L'output brut sera affiché ici</p>
      </div>

      <!-- Back link -->
      <div class="mt-12 text-center">
        <NuxtLink to="/" class="text-blue-400 hover:text-blue-300 transition-colors">
          ← Retour au Dashboard
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
