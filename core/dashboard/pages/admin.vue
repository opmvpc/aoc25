<script setup lang="ts">
import type { Day } from "~/types";

const { data: days, refresh } = await useFetch<Day[]>("/api/days");

// Auto-select day based on current date (December = AoC month)
function getDefaultDay(): number {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed, so December = 11
  const day = now.getDate();

  // Only auto-select if we're in December
  if (month === 11) {
    return Math.min(day, 12); // Max is 12
  }
  return 1;
}

const selectedDay = ref<number>(getDefaultDay());
const saving = ref(false);
const publishing = ref(false);
const message = ref<{ type: "success" | "error"; text: string } | null>(null);

const form = reactive({
  puzzle1_md: "",
  puzzle2_md: "",
  sample_input: "",
  sample_expected_p1: "",
  sample_expected_p2: "",
  final_input: "",
  answer_p1: "",
  answer_p2: "",
});

watch(
  selectedDay,
  (newDay) => {
    const day = days.value?.find((d) => d.id === newDay);
    if (day) {
      form.puzzle1_md = day.puzzle1_md || "";
      form.puzzle2_md = day.puzzle2_md || "";
      form.sample_input = day.sample_input || "";
      form.sample_expected_p1 = day.sample_expected_p1 || "";
      form.sample_expected_p2 = day.sample_expected_p2 || "";
      form.final_input = day.final_input || "";
      form.answer_p1 = day.answer_p1 || "";
      form.answer_p2 = day.answer_p2 || "";
    }
  },
  { immediate: true }
);

async function saveDay() {
  saving.value = true;
  message.value = null;
  try {
    await $fetch(`/api/days/${selectedDay.value}`, {
      method: "POST",
      body: {
        puzzle1_md: form.puzzle1_md || null,
        puzzle2_md: form.puzzle2_md || null,
        sample_input: form.sample_input || null,
        sample_expected_p1: form.sample_expected_p1 || null,
        sample_expected_p2: form.sample_expected_p2 || null,
        final_input: form.final_input || null,
      },
    });
    if (form.answer_p1) {
      await $fetch(`/api/days/${selectedDay.value}/answer`, {
        method: "PATCH",
        body: { part: 1, answer: form.answer_p1 },
      });
    }
    if (form.answer_p2) {
      await $fetch(`/api/days/${selectedDay.value}/answer`, {
        method: "PATCH",
        body: { part: 2, answer: form.answer_p2 },
      });
    }
    await refresh();
    message.value = {
      type: "success",
      text: `Day ${selectedDay.value} saved!`,
    };
  } catch (err) {
    message.value = { type: "error", text: `Failed: ${err}` };
  } finally {
    saving.value = false;
  }
}

async function publishDay() {
  publishing.value = true;
  message.value = null;
  try {
    await $fetch(`/api/publish/${selectedDay.value}`, { method: "POST" });
    await refresh();
    message.value = {
      type: "success",
      text: `Day ${selectedDay.value} published!`,
    };
  } catch (err) {
    message.value = { type: "error", text: `Failed: ${err}` };
  } finally {
    publishing.value = false;
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div
      class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4"
    >
      <div class="flex flex-col sm:flex-row sm:items-center gap-4">
        <h1 class="text-xl font-black flex items-center gap-2">
          <span class="text-yellow-400">⚙️</span> Admin
        </h1>

        <!-- Day Selector - Responsive grid -->
        <div class="grid grid-cols-6 sm:flex sm:items-center gap-1">
          <button
            v-for="n in 12"
            :key="n"
            @click="selectedDay = n"
            class="w-full sm:w-8 h-8 rounded-lg text-xs font-bold transition-all"
            :class="
              selectedDay === n
                ? 'bg-yellow-500 text-black'
                : 'glass-subtle text-white/50 hover:text-white hover:bg-white/10'
            "
          >
            {{ n.toString().padStart(2, "0") }}
          </button>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          :loading="publishing"
          :disabled="publishing || saving"
          @click="publishDay"
        >
          📤 Publish
        </UButton>
        <UButton
          size="xs"
          color="primary"
          :loading="saving"
          :disabled="publishing || saving"
          @click="saveDay"
        >
          💾 Save
        </UButton>
        <NuxtLink
          to="/"
          class="text-xs text-white/30 hover:text-white ml-2 hidden md:inline"
          >← Back</NuxtLink
        >
      </div>
    </div>

    <!-- Message -->
    <UAlert
      v-if="message"
      class="mb-4"
      :color="message.type === 'success' ? 'success' : 'error'"
      :title="message.text"
      :ui="{ title: 'text-sm' }"
    />

    <!-- Grid Layout - Responsive -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Left Column: Puzzle Descriptions -->
      <div class="space-y-4">
        <!-- Part 1 Description -->
        <div class="glass rounded-xl p-4">
          <label class="text-xs text-white/40 mb-2 flex items-center gap-1">
            <span class="text-yellow-400">📝</span> Part 1 Description
          </label>
          <textarea
            v-model="form.puzzle1_md"
            rows="8"
            class="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs font-mono text-white/80 resize-none focus:border-yellow-500/50 focus:outline-none"
            placeholder="Paste Part 1 puzzle description..."
          />
        </div>

        <!-- Part 2 Description -->
        <div class="glass rounded-xl p-4">
          <label class="text-xs text-white/40 mb-2 flex items-center gap-1">
            <span class="text-yellow-400">📝</span> Part 2 Description
          </label>
          <textarea
            v-model="form.puzzle2_md"
            rows="8"
            class="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs font-mono text-white/80 resize-none focus:border-yellow-500/50 focus:outline-none"
            placeholder="Paste Part 2 puzzle description..."
          />
        </div>
      </div>

      <!-- Right Column: Inputs & Answers -->
      <div class="space-y-4">
        <!-- Sample Input -->
        <div class="glass rounded-xl p-4">
          <label class="text-xs text-white/40 mb-2 flex items-center gap-1">
            <span class="text-green-400">🧪</span> Sample Input
          </label>
          <textarea
            v-model="form.sample_input"
            rows="4"
            class="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs font-mono text-white/80 resize-none focus:border-green-500/50 focus:outline-none mb-3"
            placeholder="Paste sample input..."
          />
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] text-white/30 mb-1 block"
                >Expected P1</label
              >
              <input
                v-model="form.sample_expected_p1"
                class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-green-400 focus:border-green-500/50 focus:outline-none"
                placeholder="Answer..."
              />
            </div>
            <div>
              <label class="text-[10px] text-white/30 mb-1 block"
                >Expected P2</label
              >
              <input
                v-model="form.sample_expected_p2"
                class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-green-400 focus:border-green-500/50 focus:outline-none"
                placeholder="Answer..."
              />
            </div>
          </div>
        </div>

        <!-- Final Input -->
        <div class="glass rounded-xl p-4">
          <label class="text-xs text-white/40 mb-2 flex items-center gap-1">
            <span class="text-blue-400">📄</span> Final Input
          </label>
          <textarea
            v-model="form.final_input"
            rows="6"
            class="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs font-mono text-white/80 resize-none focus:border-blue-500/50 focus:outline-none"
            placeholder="Paste your puzzle input..."
          />
        </div>

        <!-- Answers -->
        <div class="glass rounded-xl p-4">
          <label class="text-xs text-white/40 mb-2 flex items-center gap-1">
            <span class="text-yellow-400">🏆</span> Verified Answers
          </label>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-[10px] text-white/30 mb-1 block">Part 1</label>
              <input
                v-model="form.answer_p1"
                class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-3 text-lg font-mono text-yellow-400 focus:border-yellow-500/50 focus:outline-none"
                placeholder="Answer..."
              />
            </div>
            <div>
              <label class="text-[10px] text-white/30 mb-1 block">Part 2</label>
              <input
                v-model="form.answer_p2"
                class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-3 text-lg font-mono text-yellow-400 focus:border-yellow-500/50 focus:outline-none"
                placeholder="Answer..."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
