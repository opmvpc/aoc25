// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },

  modules: ["@nuxt/ui"],

  css: ["~/assets/css/main.css"],

  // App config
  app: {
    head: {
      title: "AoC 2025 Battle Royale",
      meta: [
        { name: "description", content: "Advent of Code 2025 - Claude vs Codex vs Gemini" },
      ],
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      ],
    },
  },

  // Runtime config for database path
  runtimeConfig: {
    dbPath: "./data/aoc25.db",
  },

  // Nitro config
  nitro: {
    esbuild: {
      options: {
        target: "esnext",
      },
    },
  },

  // TypeScript config
  typescript: {
    strict: true,
    typeCheck: false, // Disable to avoid vue-tsc dependency
  },
});
