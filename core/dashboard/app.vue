<script setup lang="ts">
const navItems = [
  { label: "Dashboard", to: "/", icon: "i-heroicons-home" },
  { label: "Benchmarks", to: "/benchmarks", icon: "i-heroicons-chart-bar" },
  { label: "Admin", to: "/admin", icon: "i-heroicons-cog-6-tooth" },
];
</script>

<template>
  <div class="min-h-screen bg-[#0f0f23]">
    <!-- Header -->
    <header class="border-b border-gray-700 bg-[#10101a]">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-3 group">
            <span class="text-3xl">🎄</span>
            <div>
              <h1 class="text-xl font-bold text-[#ffcc00] group-hover:text-white transition-colors">
                AoC 2025 Battle Royale
              </h1>
              <p class="text-xs text-[#666666]">Claude vs Codex vs Gemini</p>
            </div>
          </NuxtLink>

          <!-- Navigation -->
          <nav class="flex items-center gap-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="px-4 py-2 rounded-lg text-[#cccccc] hover:text-[#00cc00] hover:bg-[#1a1a2e] transition-all"
              active-class="!text-[#00cc00] bg-[#1a1a2e]"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>

          <!-- Stars counter -->
          <div class="flex items-center gap-2 text-lg">
            <span class="star-gold">★</span>
            <span class="text-[#ffcc00]">0</span>
            <span class="text-[#666666]">/</span>
            <span class="text-[#9999cc]">72</span>
          </div>
        </div>
      </div>
    </header>

    <!-- Main content -->
    <main class="container mx-auto px-4 py-8">
      <NuxtPage />
    </main>

    <!-- Footer -->
    <footer class="border-t border-gray-700 bg-[#10101a] py-6">
      <div class="container mx-auto px-4 text-center text-[#666666] text-sm">
        <p>
          🏆 Advent of Code 2025 Battle Royale
          <span class="mx-2">|</span>
          <a
            href="https://adventofcode.com/2025"
            target="_blank"
            class="aoc-link"
          >
            adventofcode.com
          </a>
        </p>
      </div>
    </footer>
  </div>
</template>
