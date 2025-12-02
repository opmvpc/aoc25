<script setup lang="ts">
import type { Day } from "~/types";

const { data: days, refresh } = await useFetch<Day[]>("/api/days");

const selectedDay = ref<number>(1);
const saving = ref(false);
const publishing = ref(false);
const message = ref<{ type: "success" | "error"; text: string } | null>(null);

// Form state
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

// Load selected day data
watch(selectedDay, (newDay) => {
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
}, { immediate: true });

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

    // Set answers separately
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
    message.value = { type: "success", text: `Day ${selectedDay.value} saved!` };
  } catch (err) {
    message.value = { type: "error", text: `Failed to save: ${err}` };
  } finally {
    saving.value = false;
  }
}

async function publishDay() {
  publishing.value = true;
  message.value = null;

  try {
    const result = await $fetch(`/api/publish/${selectedDay.value}`, {
      method: "POST",
    });

    await refresh();
    message.value = { type: "success", text: `Day ${selectedDay.value} published to all agents!` };
  } catch (err) {
    message.value = { type: "error", text: `Failed to publish: ${err}` };
  } finally {
    publishing.value = false;
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-[#ffcc00] mb-8">⚙️ Admin Panel</h1>

    <!-- Day Selector -->
    <div class="card p-6 mb-6">
      <label class="block text-sm text-[#666666] mb-2">Select Day</label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="n in 12"
          :key="n"
          @click="selectedDay = n"
          class="w-12 h-12 rounded border text-center transition-all"
          :class="selectedDay === n
            ? 'bg-[#00cc00] text-[#0f0f23] border-[#00cc00]'
            : 'bg-[#1a1a2e] text-[#cccccc] border-[#333] hover:border-[#00cc00]'"
        >
          {{ n.toString().padStart(2, "0") }}
        </button>
      </div>
    </div>

    <!-- Message -->
    <div
      v-if="message"
      class="card p-4 mb-6"
      :class="message.type === 'success' ? 'border-[#00cc00]' : 'border-[#ff0000]'"
    >
      <span :class="message.type === 'success' ? 'text-[#00cc00]' : 'text-[#ff0000]'">
        {{ message.type === 'success' ? '✅' : '❌' }} {{ message.text }}
      </span>
    </div>

    <!-- Edit Form -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Puzzles -->
      <div class="card p-6">
        <h2 class="text-lg font-bold text-[#00cc00] mb-4">📝 Puzzle Descriptions</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm text-[#666666] mb-1">Part 1 Description</label>
            <textarea
              v-model="form.puzzle1_md"
              rows="6"
              class="w-full bg-[#0f0f23] border border-[#333] rounded p-3 text-[#cccccc] focus:border-[#00cc00] focus:outline-none"
              placeholder="Paste puzzle description..."
            />
          </div>

          <div>
            <label class="block text-sm text-[#666666] mb-1">Part 2 Description</label>
            <textarea
              v-model="form.puzzle2_md"
              rows="6"
              class="w-full bg-[#0f0f23] border border-[#333] rounded p-3 text-[#cccccc] focus:border-[#00cc00] focus:outline-none"
              placeholder="Paste puzzle description..."
            />
          </div>
        </div>
      </div>

      <!-- Sample Input -->
      <div class="card p-6">
        <h2 class="text-lg font-bold text-[#00cc00] mb-4">🧪 Sample Input</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm text-[#666666] mb-1">Sample Input</label>
            <textarea
              v-model="form.sample_input"
              rows="8"
              class="w-full bg-[#0f0f23] border border-[#333] rounded p-3 text-[#cccccc] font-mono text-sm focus:border-[#00cc00] focus:outline-none"
              placeholder="Paste sample input..."
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-[#666666] mb-1">Expected P1</label>
              <input
                v-model="form.sample_expected_p1"
                type="text"
                class="w-full bg-[#0f0f23] border border-[#333] rounded p-2 text-[#ffcc00] font-mono focus:border-[#00cc00] focus:outline-none"
              />
            </div>
            <div>
              <label class="block text-sm text-[#666666] mb-1">Expected P2</label>
              <input
                v-model="form.sample_expected_p2"
                type="text"
                class="w-full bg-[#0f0f23] border border-[#333] rounded p-2 text-[#ffcc00] font-mono focus:border-[#00cc00] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Final Input -->
      <div class="card p-6">
        <h2 class="text-lg font-bold text-[#00cc00] mb-4">📄 Final Input</h2>

        <div>
          <label class="block text-sm text-[#666666] mb-1">Final Input</label>
          <textarea
            v-model="form.final_input"
            rows="10"
            class="w-full bg-[#0f0f23] border border-[#333] rounded p-3 text-[#cccccc] font-mono text-sm focus:border-[#00cc00] focus:outline-none"
            placeholder="Paste your puzzle input..."
          />
        </div>
      </div>

      <!-- Answers -->
      <div class="card p-6">
        <h2 class="text-lg font-bold text-[#00cc00] mb-4">🏆 Final Answers</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm text-[#666666] mb-1">Answer Part 1</label>
            <input
              v-model="form.answer_p1"
              type="text"
              class="w-full bg-[#0f0f23] border border-[#333] rounded p-3 text-[#ffcc00] font-mono text-lg focus:border-[#00cc00] focus:outline-none"
              placeholder="Enter verified answer..."
            />
          </div>

          <div>
            <label class="block text-sm text-[#666666] mb-1">Answer Part 2</label>
            <input
              v-model="form.answer_p2"
              type="text"
              class="w-full bg-[#0f0f23] border border-[#333] rounded p-3 text-[#ffcc00] font-mono text-lg focus:border-[#00cc00] focus:outline-none"
              placeholder="Enter verified answer..."
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-4 mt-6">
      <button
        @click="publishDay"
        :disabled="publishing"
        class="px-6 py-3 bg-[#1a1a2e] text-[#9999cc] rounded border border-[#9999cc] hover:bg-[#9999cc] hover:text-[#0f0f23] disabled:opacity-50 transition-all"
      >
        {{ publishing ? '📤 Publishing...' : '📤 Publish to Agents' }}
      </button>

      <button
        @click="saveDay"
        :disabled="saving"
        class="px-6 py-3 bg-[#00cc00] text-[#0f0f23] rounded font-bold hover:bg-[#00ff00] disabled:opacity-50 transition-all"
      >
        {{ saving ? '💾 Saving...' : '💾 Save Day' }}
      </button>
    </div>
  </div>
</template>
