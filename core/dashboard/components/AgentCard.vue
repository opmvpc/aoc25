<script setup lang="ts">
import type { Agent } from "~/types";

const props = defineProps<{
  agent: Agent;
  rank: number;
  wins: number;
  podiums: number;
  correct: number;
  totalTime: string;
  totalTimeMs: number;
  completeDays: number;
  modelName: string;
}>();

const rankEmoji = computed(() => {
  switch (props.rank) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return "";
  }
});

const podiumClass = computed(() => {
  switch (props.rank) {
    case 1:
      return "podium-1";
    case 2:
      return "podium-2";
    case 3:
      return "podium-3";
    default:
      return "glass";
  }
});
</script>

<template>
  <div
    class="relative rounded-2xl p-6 transition-all duration-500 hover:scale-[1.02]"
    :class="[podiumClass, `agent-card-${agent}`]"
  >
    <!-- Rank badge -->
    <div
      v-if="rank <= 3"
      class="absolute -top-4 -right-4 w-14 h-14 rounded-full flex items-center justify-center text-3xl"
      :class="{
        'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/50':
          rank === 1,
        'bg-gradient-to-br from-gray-300 to-gray-500 shadow-lg shadow-gray-400/30':
          rank === 2,
        'bg-gradient-to-br from-amber-600 to-amber-800 shadow-lg shadow-amber-600/30':
          rank === 3,
      }"
    >
      {{ rankEmoji }}
    </div>

    <!-- Agent info -->
    <div class="flex items-center gap-4 mb-6">
      <div
        class="w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold"
        :class="`agent-${agent}`"
      >
        {{ agent.charAt(0).toUpperCase() }}
      </div>
      <div>
        <h3 class="text-2xl font-bold capitalize text-white">{{ agent }}</h3>
        <p class="text-sm text-white/50 font-mono">{{ modelName }}</p>
      </div>
    </div>

    <!-- Main stat: Total Time (the key ranking metric) -->
    <div class="text-center py-6 border-y border-white/10 my-4">
      <div v-if="completeDays > 0">
        <div
          class="text-4xl font-black font-mono"
          :class="rank === 1 ? 'time-display-gold' : 'time-display'"
        >
          {{ totalTime }}
        </div>
        <div class="text-white/60 mt-2 flex items-center justify-center gap-2">
          <span class="text-2xl">⚡</span>
          <span class="text-lg font-medium">Total Time</span>
        </div>
        <div class="text-xs text-white/40 mt-1">
          {{ completeDays }} day{{ completeDays > 1 ? "s" : "" }} completed
        </div>
      </div>
      <div v-else class="text-white/40">
        <div class="text-2xl">—</div>
        <div class="text-sm mt-2">No complete days</div>
      </div>
    </div>

    <!-- Stats grid -->
    <div class="grid grid-cols-3 gap-4 mt-6">
      <div class="text-center glass-subtle p-3 rounded-xl">
        <div
          class="text-2xl font-bold text-yellow-400 flex items-center justify-center gap-1"
        >
          {{ wins }}
          <span class="text-lg">🏆</span>
        </div>
        <div class="text-xs text-white/50 mt-1">Day Wins</div>
      </div>
      <div class="text-center glass-subtle p-3 rounded-xl">
        <div class="text-2xl font-bold text-white/90">{{ podiums }}</div>
        <div class="text-xs text-white/50 mt-1">Podiums</div>
      </div>
      <div class="text-center glass-subtle p-3 rounded-xl">
        <div class="text-2xl font-bold text-green-400">{{ correct }}</div>
        <div class="text-xs text-white/50 mt-1">Correct</div>
      </div>
    </div>
  </div>
</template>
