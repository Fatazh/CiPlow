// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxtjs/color-mode",
    "@vueuse/nuxt",
    "@pinia/nuxt",
    "nuxt-csurf",
  ],

  csurf: {
    methodsToProtect: ['POST', 'PUT', 'PATCH', 'DELETE'],
  },

  components: [
    {
      path: "~/components",
      pathPrefix: false,
    },
  ],

  colorMode: {
    classSuffix: "",
    preference: "system",
    fallback: "light",
    storageKey: "CashPlow-color-mode",
  },

  tailwindcss: {
    // cssPath: "~/assets/css/main.css",
    configPath: "~/tailwind.config.ts",
    exposeConfig: false,
    viewer: true,
  },

  css: ["~/assets/css/main.css"],

  app: {
    head: {
      title: "CashPlow — Budget Tracker",
      htmlAttrs: {
        lang: "id",
      },
      meta: [
        { charset: "utf-8" },
        {
          name: "viewport",
          content:
            "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
        },
        {
          name: "description",
          content: "Aplikasi pencatatan keuangan pribadi",
        },
        { name: "theme-color", content: "#10b981" },
        { name: "mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      ],
      link: [
        {
          rel: "preconnect",
          href: "https://fonts.googleapis.com",
        },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap",
        },
        {
          rel: "apple-touch-icon",
          href: "/icon-512x512.png",
        },
      ],
    },
  },



  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    cronSecret: process.env.CRON_SECRET,
    public: {
      appName: "CashPlow",
      defaultCurrency: "IDR",
      defaultLocale: "id-ID",
    },
  },

  vite: {
    optimizeDeps: {
      include: ["lucide-vue-next", "vue-chartjs", "chart.js"],
    },
  },
});
