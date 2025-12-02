<script setup lang="ts">
import type { Day } from "~/types";

const { data: days, refresh } = await useFetch<Day[]>("/api/days");

const selectedDay = ref<number>(1);
const saving = ref(false);
const publishing = ref(false);
const message = ref<{ type: "success" | "error"; text: string } | null>(null);

// Tabs for organization
const activeTab = ref<"puzzle" | "sample" | "final">("puzzle");

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

const tabs = [
  { id: "puzzle", label: "📝 Puzzle", icon: "i-heroicons-document-text" },
  { id: "sample", label: "🧪 Sample", icon: "i-heroicons-beaker" },
  {
    id: "final",
    label: "📄 Input & Answers",
    icon: "i-heroicons-document-check",
  },
] as const;
</script>

<template>
  <div class="h-full flex flex-col max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-4">
        <h1 class="text-xl font-black flex items-center gap-2">
          <span class="text-yellow-400">⚙️</span> Admin
        </h1>

        <!-- Day Selector inline -->
        <div class="flex items-center gap-1">
          <button
            v-for="n in 12"
            :key="n"
            @click="selectedDay = n"
            class="w-8 h-8 rounded text-xs font-bold transition-all"
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
        <NuxtLink to="/" class="text-xs text-white/30 hover:text-white ml-2"
          >← Back</NuxtLink
        >
      </div>
    </div>

    <!-- Message -->
    <UAlert
      v-if="message"
      class="mb-3"
      :color="message.type === 'success' ? 'success' : 'error'"
      :title="message.text"
      :ui="{ title: 'text-sm' }"
    />

    <!-- Tabs -->
    <div class="flex gap-1 mb-3">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        :class="
          activeTab === tab.id
            ? 'bg-yellow-500 text-black'
            : 'glass-subtle text-white/50 hover:text-white'
        "
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 min-h-0">
      <!-- Puzzle Tab -->
      <div v-if="activeTab === 'puzzle'" class="h-full grid grid-cols-2 gap-3">
        <div class="glass rounded-xl p-3 flex flex-col">
          <label class="text-[10px] text-white/40 mb-1 flex items-center gap-1">
            <span class="text-yellow-400">P1</span> Description
          </label>
          <textarea
            v-model="form.puzzle1_md"
            class="flex-1 w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs font-mono text-white/80 resize-none focus:border-yellow-500/50 focus:outline-none"
            placeholder="Paste Part 1 puzzle description..."
          />
        </div>
        <div class="glass rounded-xl p-3 flex flex-col">
          <label class="text-[10px] text-white/40 mb-1 flex items-center gap-1">
            <span class="text-yellow-400">P2</span> Description
          </label>
          <textarea
            v-model="form.puzzle2_md"
            class="flex-1 w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs font-mono text-white/80 resize-none focus:border-yellow-500/50 focus:outline-none"
            placeholder="Paste Part 2 puzzle description..."
          />
        </div>
      </div>

      <!-- Sample Tab -->
      <div
        v-else-if="activeTab === 'sample'"
        class="h-full flex flex-col gap-3"
      >
        <div class="flex-1 glass rounded-xl p-3 flex flex-col">
          <label class="text-[10px] text-white/40 mb-1">Sample Input</label>
          <textarea
            v-model="form.sample_input"
            class="flex-1 w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs font-mono text-white/80 resize-none focus:border-green-500/50 focus:outline-none"
            placeholder="Paste sample input..."
          />
        </div>
        <div class="glass rounded-xl p-3">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-[10px] text-white/40 mb-1 block"
                >Expected Part 1</label
              >
              <input
                v-model="form.sample_expected_p1"
                class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-green-400 focus:border-green-500/50 focus:outline-none"
                placeholder="Expected answer..."
              />
            </div>
            <div>
              <label class="text-[10px] text-white/40 mb-1 block"
                >Expected Part 2</label
              >
              <input
                v-model="form.sample_expected_p2"
                class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-green-400 focus:border-green-500/50 focus:outline-none"
                placeholder="Expected answer..."
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Final Input & Answers Tab -->
      <div
        v-else-if="activeTab === 'final'"
        class="h-full grid grid-cols-3 gap-3"
      >
        <div class="col-span-2 glass rounded-xl p-3 flex flex-col">
          <label class="text-[10px] text-white/40 mb-1">Final Input</label>
          <textarea
            v-model="form.final_input"
            class="flex-1 w-full bg-black/30 border border-white/10 rounded-lg p-3 text-xs font-mono text-white/80 resize-none focus:border-blue-500/50 focus:outline-none"
            placeholder="Paste your puzzle input..."
          />
        </div>
        <div class="glass rounded-xl p-3 flex flex-col gap-4">
          <div class="flex-1">
            <label class="text-[10px] text-white/40 mb-1 block"
              >🏆 Answer Part 1</label
            >
            <input
              v-model="form.answer_p1"
              class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-3 text-lg font-mono text-yellow-400 focus:border-yellow-500/50 focus:outline-none"
              placeholder="Verified answer..."
            />
          </div>
          <div class="flex-1">
            <label class="text-[10px] text-white/40 mb-1 block"
              >🏆 Answer Part 2</label
            >
            <input
              v-model="form.answer_p2"
              class="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-3 text-lg font-mono text-yellow-400 focus:border-yellow-500/50 focus:outline-none"
              placeholder="Verified answer..."
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.h-full {
  height: calc(100vh - 120px);
}
</style>
