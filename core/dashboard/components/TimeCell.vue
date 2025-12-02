<script setup lang="ts">
import type { Agent, Language } from "~/types";

const props = defineProps<{
  dayId: number;
  agent: Agent;
  language: Language;
  part: 1 | 2;
  status: "success" | "error" | "pending" | "none";
  timeMs: number | null;
  rank: number | null;
  isRunning: boolean;
}>();

const emit = defineEmits<{
  run: [];
}>();

const timeFormatted = computed(() => {
  if (props.timeMs === null) return null;
  if (props.timeMs < 1) return `${(props.timeMs * 1000).toFixed(0)}µs`;
  if (props.timeMs < 1000) return `${props.timeMs.toFixed(1)}ms`;
  return `${(props.timeMs / 1000).toFixed(2)}s`;
});

const isFastest = computed(() => props.rank === 1 && props.status === "success");

const statusIcon = computed(() => {
  if (props.isRunning) return '⏳';
  switch (props.status) {
    case 'success': return '✓';
    case 'error': return '✗';
    case 'pending': return '?';
    default: return '·';
  }
});

const rankEmoji = computed(() => {
  switch (props.rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return null;
  }
});
</script>

<template>
  <button
    @click="emit('run')"
    class="relative flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-300 min-w-[100px] min-h-[80px]"
    :class="{
      'bg-yellow-500/20 ring-2 ring-yellow-500/50 shadow-lg shadow-yellow-500/20': isFastest,
      'glass-subtle hover:bg-white/10': !isFastest,
      'opacity-50': isRunning,
    }"
  >
    <!-- Rank badge -->
    <div 
      v-if="rankEmoji && status === 'success'" 
      class="absolute -top-2 -right-2 text-lg"
    >
      {{ rankEmoji }}
    </div>

    <!-- Status icon -->
    <div 
      class="text-2xl mb-1"
      :class="{
        'animate-spin': isRunning,
        'status-success': status === 'success',
        'status-error': status === 'error',
        'status-pending': status === 'pending',
        'status-none': status === 'none',
      }"
    >
      {{ statusIcon }}
    </div>

    <!-- Time - BIGGER! -->
    <div 
      v-if="timeFormatted"
      class="font-mono font-bold"
      :class="isFastest ? 'text-lg time-winner' : 'text-sm text-white/60'"
    >
      {{ timeFormatted }}
    </div>
    <div v-else class="text-xs text-white/30">
      {{ language.toUpperCase() }}
    </div>
  </button>
</template>
