// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: [
    "@nuxtjs/tailwindcss",
    "@nuxtjs/color-mode",
    "@vueuse/nuxt",
    "@vite-pwa/nuxt",
  ],

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
    storageKey: "pplow-color-mode",
  },

  tailwindcss: {
    cssPath: "~/assets/css/main.css",
    configPath: "~/tailwind.config.ts",
    exposeConfig: false,
    viewer: true,
  },

  css: ["~/assets/css/main.css"],

  app: {
    head: {
      title: "PPLow — Budget Tracker",
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
      ],
    },
  },

  // ── PWA Configuration ─────────────────────────────────────────
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "PPLow — Budget Tracker",
      short_name: "PPLow",
      description: "Aplikasi pencatatan keuangan pribadi",
      theme_color: "#10b981",
      background_color: "#f0fdf4",
      display: "standalone",
      orientation: "portrait",
      scope: "/",
      start_url: "/",
      lang: "id",
      categories: ["finance", "utilities"],
      icons: [
        {
          src: "/icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
    },
    workbox: {
      // Cache pages (navigations)
      navigateFallback: "/",
      navigateFallbackDenylist: [/^\/api\//],

      // Runtime caching strategies
      runtimeCaching: [
        // Google Fonts — cache first (long-lived)
        {
          urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "google-fonts-cache",
            expiration: {
              maxEntries: 20,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        // Static assets — stale while revalidate
        {
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "static-images-cache",
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            },
          },
        },
        // JS/CSS bundles — stale while revalidate
        {
          urlPattern: /\.(?:js|css)$/i,
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "static-resources-cache",
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
            },
          },
        },
        // API calls — network first with fallback
        {
          urlPattern: /^\/api\/.*/i,
          handler: "NetworkFirst",
          options: {
            cacheName: "api-cache",
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60, // 1 hour
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
            networkTimeoutSeconds: 5,
          },
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: true,
      suppressWarnings: true,
      type: "module",
    },
  },

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    public: {
      appName: "PPLow",
      defaultCurrency: "IDR",
      defaultLocale: "id-ID",
    },
  },
});
