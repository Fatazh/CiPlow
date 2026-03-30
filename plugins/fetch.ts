export default defineNuxtPlugin((nuxtApp) => {
  // Hanya gunakan $csrfFetch di sisi klien untuk menghindari masalah hidrasi pada SSR.
  // $csrfFetch secara otomatis menambahkan header x-csrf-token pada setiap request
  // POST, PUT, PATCH, dan DELETE.
  if (import.meta.client) {
    // Pastikan $csrfFetch tersedia sebelum menimpa global
    if (nuxtApp.$csrfFetch) {
      globalThis.$fetch = nuxtApp.$csrfFetch as typeof $fetch;
    }
  }
})
