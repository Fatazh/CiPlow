<script setup lang="ts">
// pages/reset-password.vue — Reset Password page
definePageMeta({ layout: false });
useHead({ title: "Atur Ulang Password — CashPlow" });

const route = useRoute();
const router = useRouter();

const token = computed(() => route.query.token as string);
const password = ref("");
const confirmPassword = ref("");
const error = ref("");
const message = ref("");
const loading = ref(false);

const canSubmit = computed(
    () => password.value.length >= 6 && password.value === confirmPassword.value && !!token.value
);

const handleReset = async () => {
    if (!canSubmit.value || loading.value) return;
    error.value = "";
    loading.value = true;

    try {
        const res = await $fetch<any>("/api/auth/reset-password", {
            method: "POST",
            body: { 
                token: token.value,
                password: password.value
            },
        });
        message.value = res.message;
        // Redirect to login after 3 seconds
        setTimeout(() => {
            router.push("/login");
        }, 3000);
    } catch (err: any) {
        error.value = err?.data?.message ?? "Gagal mereset password. Token mungkin tidak valid.";
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
                    class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 bg-gradient-to-br from-emerald-400 to-blue-500 shadow-xl shadow-blue-500/30"
                >
                   <svg class="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.25-2.25"/></svg>
                </div>
                <h1
                    class="text-2xl font-extrabold text-gray-800 dark:text-gray-100"
                >
                    Reset Password
                </h1>
                <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Buat password baru yang aman
                </p>
            </div>

            <!-- Form Card -->
            <div
                class="bg-white dark:bg-surface-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-100 dark:border-gray-800 p-6"
            >
                <div v-if="!token" class="text-center py-4">
                    <p class="text-rose-500 font-semibold">Token tidak ditemukan.</p>
                    <NuxtLink to="/forgot-password" class="text-emerald-500 text-sm mt-2 block underline">Minta link baru</NuxtLink>
                </div>

                <!-- Feedback -->
                <div
                    v-if="error"
                    class="flex items-center gap-2 px-4 py-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400"
                >
                    <span class="text-xs font-semibold">{{ error }}</span>
                </div>

                <div
                    v-if="message"
                    class="flex flex-col gap-2 px-4 py-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-center"
                >
                    <span class="text-xs font-semibold">{{ message }}</span>
                    <span class="text-[10px]">Mengalihkan ke halaman login...</span>
                </div>

                <form v-if="token && !message" @submit.prevent="handleReset" class="space-y-4">
                    <div>
                        <label class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">Password Baru</label>
                        <input
                            v-model="password"
                            type="password"
                            class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200"
                            placeholder="Minimal 6 karakter"
                            required
                        />
                    </div>

                    <div>
                        <label class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block">Konfirmasi Password</label>
                        <input
                            v-model="confirmPassword"
                            type="password"
                            class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200"
                            placeholder="Ketik ulang password"
                            required
                        />
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
                        <span>{{ loading ? "Memproses..." : "Reset Password" }}</span>
                    </button>
                </form>
            </div>
        </div>
    </div>
</template>
