<script setup lang="ts">
// error.vue - Halaman Galat Global
const props = defineProps({
  error: Object
})
const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
    <div class="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-4xl mb-6">
      ⚠️
    </div>
    
    <h1 class="text-2xl font-black text-gray-900 mb-2">
      Oops! Terjadi Kesalahan
    </h1>
    
    <p class="text-gray-500 mb-8 max-w-xs mx-auto">
      {{ error?.message || 'Terjadi gangguan pada sistem.' }}
    </p>

    <button 
      @click="handleError"
      class="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl shadow-lg active:scale-95 transition-all"
    >
      Kembali ke Beranda
    </button>
  </div>
</template>
