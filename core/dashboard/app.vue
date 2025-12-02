<script setup lang="ts">
const navItems = [
  { label: "Dashboard", to: "/", icon: "i-heroicons-trophy" },
  {
    label: "Benchmarks",
    to: "/benchmarks",
    icon: "i-heroicons-chart-bar-square",
  },
  { label: "Debug", to: "/debug", icon: "i-heroicons-bug-ant" },
  { label: "Admin", to: "/admin", icon: "i-heroicons-cog-8-tooth" },
];

const route = useRoute();
</script>

<template>
  <UApp>
    <div class="min-h-screen flex flex-col">
      <!-- Glassmorphism Header -->
      <header class="sticky top-0 z-50 glass border-b border-white/10">
        <div class="container mx-auto px-6 py-4">
          <div class="flex items-center justify-between">
            <!-- Logo with glow -->
            <NuxtLink to="/" class="flex items-center gap-4 group">
              <div class="relative">
                <span
                  class="text-5xl transition-transform group-hover:scale-110 inline-block"
                  >🎄</span
                >
                <div
                  class="absolute -inset-2 bg-green-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <div>
                <h1
                  class="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 bg-clip-text text-transparent"
                >
                  AoC 2025 Battle Royale
                </h1>
                <p class="text-sm text-white/50 font-mono">
                  Claude Sonnet 4.5 vs GPT-5.1-codex-max vs Gemini 3 Pro
                </p>
              </div>
            </NuxtLink>

            <!-- Navigation pills -->
            <nav
              class="flex items-center gap-2 glass-subtle px-2 py-1.5 rounded-full"
            >
              <NuxtLink
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                class="px-5 py-2 rounded-full text-sm font-medium transition-all duration-300"
                :class="[
                  route.path === item.to
                    ? 'bg-gradient-to-r from-yellow-500/20 to-green-500/20 text-yellow-400 shadow-lg shadow-yellow-500/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5',
                ]"
              >
                <UIcon :name="item.icon" class="w-4 h-4 mr-2 inline-block" />
                {{ item.label }}
              </NuxtLink>
            </nav>

            <!-- Live indicator -->
            <div
              class="flex items-center gap-3 glass-subtle px-4 py-2 rounded-full"
            >
              <div class="flex items-center gap-2">
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span class="text-sm text-white/70">Live</span>
              </div>
              <div class="w-px h-4 bg-white/20" />
              <div class="flex items-center gap-1.5">
                <span class="star-gold text-xl">★</span>
                <span class="text-yellow-400 font-bold">0</span>
                <span class="text-white/30">/</span>
                <span class="text-white/50">72</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Main content with padding -->
      <main class="container mx-auto px-6 py-8 flex-1">
        <NuxtPage />
      </main>

      <!-- Minimal footer -->
      <footer class="border-t border-white/5 py-6 mt-auto">
        <div class="container mx-auto px-6">
          <div class="flex items-center justify-between text-sm text-white/40">
            <p class="flex items-center gap-2">
              <span>🏆</span>
              <span>Advent of Code 2025 Battle Royale</span>
            </p>
            <div class="flex items-center gap-6">
              <a
                href="https://adventofcode.com/2025"
                target="_blank"
                class="hover:text-yellow-400 transition-colors"
              >
                adventofcode.com
              </a>
              <a
                href="https://github.com"
                target="_blank"
                class="hover:text-white transition-colors"
              >
                <UIcon name="i-simple-icons-github" class="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </UApp>
</template>
