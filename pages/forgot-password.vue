<script setup lang="ts">
// pages/forgot-password.vue — Forgot Password page
definePageMeta({ layout: false });
useHead({ title: "Lupa Password — CashPlow" });

const email = ref("");
const error = ref("");
const message = ref("");
const loading = ref(false);

const canSubmit = computed(() => email.value.trim().length > 0);

const handleRequest = async () => {
    if (!canSubmit.value || loading.value) return;
    error.value = "";
    message.value = "";
    loading.value = true;

    try {
        const res = await $fetch<any>("/api/auth/forgot-password", {
            method: "POST",
            body: { email: email.value },
        });
        message.value = res.message;
    } catch (err: any) {
        error.value = err?.data?.message ?? "Gagal mengirim permintaan. Coba lagi.";
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div
        class="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 flex items-center justify-center px-4"
    >
        <div class="w-full max-w-sm">
            <!-- Logo & Title -->
            <div class="text-center mb-8">
                <div
                    class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-gradient-to-br from-orange-400 to-rose-500 shadow-xl shadow-rose-500/30"
                >
                   <svg class="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.25-2.25"/></svg>
                </div>
                <h1
                    class="text-2xl font-extrabold text-gray-800 dark:text-gray-100"
                >
                    Lupa Password?
                </h1>
                <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Masukkan email kamu untuk mereset password
                </p>
            </div>

            <!-- Form Card -->
            <div
                class="bg-white dark:bg-surface-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-100 dark:border-gray-800 p-6"
            >
                <!-- Feedback -->
                <div
                    v-if="error"
                    class="flex items-center gap-2 px-4 py-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400"
                >
                    <span class="text-xs font-semibold">{{ error }}</span>
                </div>

                <div
                    v-if="message"
                    class="flex flex-col gap-2 px-4 py-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400"
                >
                    <span class="text-xs font-semibold text-center">{{ message }}</span>
                </div>

                <form v-if="!message" @submit.prevent="handleRequest" class="space-y-4">
                    <div>
                        <label
                            class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block"
                        >
                            Email Terdaftar
                        </label>
                        <div class="relative">
                            <svg
                                class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <rect width="20" height="16" x="2" y="4" rx="2" />
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                            </svg>
                            <input
                                v-model="email"
                                type="email"
                                class="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200"
                                placeholder="email@example.com"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        :disabled="!canSubmit || loading"
                        class="w-full py-3.5 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <svg v-if="loading" class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>{{ loading ? "Mengirim..." : "Kirim Instruksi" }}</span>
                    </button>
                </form>

                <div class="mt-4 text-center">
                    <NuxtLink
                        to="/login"
                        class="text-xs font-semibold text-emerald-500 hover:text-emerald-600 transition-colors"
                    >
                        Kembali ke Login
                    </NuxtLink>
                </div>
            </div>
        </div>
    </div>
</template>
