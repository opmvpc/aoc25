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

// Fetch star count
const { data: stars, refresh: refreshStars } = await useFetch<{
  total: number;
  max: number;
  byAgent: Record<string, number>;
}>("/api/stars");

// Provide refresh function globally
provide("refreshStars", refreshStars);
</script>

<template>
  <UApp>
    <div class="min-h-screen flex flex-col">
      <!-- Header - Responsive avec breakpoints bien définis -->
      <header class="sticky top-0 z-50 glass border-b border-white/10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex items-center justify-between h-14 sm:h-16 lg:h-18">
            <!-- Logo - S'adapte à chaque taille -->
            <NuxtLink
              to="/"
              class="flex items-center gap-2 lg:gap-3 group shrink-0"
            >
              <div class="relative">
                <span
                  class="text-2xl sm:text-3xl lg:text-4xl transition-transform group-hover:scale-110 inline-block"
                  >🎄</span
                >
                <div
                  class="absolute -inset-2 bg-green-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <!-- Titre : caché sur très petit, court sur sm, complet sur lg -->
              <div class="hidden sm:block">
                <h1
                  class="text-base lg:text-xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 bg-clip-text text-transparent whitespace-nowrap"
                >
                  <span class="lg:hidden">AoC Battle</span>
                  <span class="hidden lg:inline">AoC 2025 Battle Royale</span>
                </h1>
                <p class="hidden xl:block text-xs text-white/50 font-mono">
                  Opus 4.5 vs GPT-5.1-codex vs Gemini 3
                </p>
              </div>
            </NuxtLink>

            <!-- Navigation Desktop - Visible à partir de md -->
            <nav class="hidden md:flex items-center">
              <div
                class="flex items-center gap-1 glass-subtle px-1.5 py-1 rounded-xl"
              >
                <NuxtLink
                  v-for="item in navItems"
                  :key="item.to"
                  :to="item.to"
                  class="flex items-center gap-1.5 px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-medium transition-all duration-200"
                  :class="[
                    route.path === item.to
                      ? 'bg-gradient-to-r from-yellow-500/20 to-green-500/20 text-yellow-400'
                      : 'text-white/60 hover:text-white hover:bg-white/5',
                  ]"
                >
                  <UIcon :name="item.icon" class="w-4 h-4" />
                  <span class="hidden lg:inline">{{ item.label }}</span>
                </NuxtLink>
              </div>
            </nav>

            <!-- Status / Stars - Toujours visible, adaptatif -->
            <div class="flex items-center gap-2 sm:gap-3">
              <!-- Live indicator - caché sur mobile -->
              <div
                class="hidden sm:flex items-center gap-2 glass-subtle px-2.5 py-1.5 rounded-lg"
              >
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span class="text-xs lg:text-sm text-white/70">Live</span>
              </div>

              <!-- Stars counter - toujours visible -->
              <div
                class="flex items-center gap-1.5 glass-subtle px-2.5 sm:px-3 py-1.5 rounded-lg"
              >
                <span class="star-gold text-base sm:text-lg lg:text-xl">★</span>
                <span class="text-yellow-400 font-bold text-xs sm:text-sm">{{
                  stars?.total ?? 0
                }}</span>
                <span class="text-white/30 text-xs sm:text-sm"
                  >/{{ stars?.max ?? 72 }}</span
                >
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Main content -->
      <main
        class="main-content max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 flex-1"
      >
        <NuxtPage />
      </main>

      <!-- Footer - visible sur tablette et desktop -->
      <footer
        class="hidden sm:block border-t border-white/5 py-4 lg:py-6 mt-auto"
      >
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            class="flex items-center justify-between text-xs lg:text-sm text-white/40"
          >
            <p class="flex items-center gap-2">
              <span>🏆</span>
              <span class="hidden lg:inline"
                >Advent of Code 2025 Battle Royale</span
              >
              <span class="lg:hidden">AoC 2025</span>
            </p>
            <div class="flex items-center gap-4 lg:gap-6">
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
                <UIcon
                  name="i-simple-icons-github"
                  class="w-4 h-4 lg:w-5 lg:h-5"
                />
              </a>
            </div>
          </div>
        </div>
      </footer>

      <!-- Mobile Bottom Navigation - Visible uniquement sur mobile -->
      <nav class="mobile-nav md:hidden">
        <div class="flex items-center justify-around px-2">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="mobile-nav-item"
            :class="{ active: route.path === item.to }"
          >
            <UIcon :name="item.icon" class="icon w-6 h-6" />
            <span class="label">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </nav>
    </div>
  </UApp>
</template>
