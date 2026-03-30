<script setup lang="ts">
// pages/register.vue — Register page

definePageMeta({ layout: false });
useHead({ title: "Daftar — CashPlow" });

const { register } = useAuth();
const router = useRouter();

const form = reactive({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
});

const error = ref("");
const loading = ref(false);
const showPassword = ref(false);

const passwordMismatch = computed(
    () =>
        form.confirmPassword.length > 0 &&
        form.password !== form.confirmPassword,
);

const passwordMatch = computed(
    () =>
        form.confirmPassword.length > 0 &&
        form.password === form.confirmPassword &&
        form.password.length >= 6,
);

const canSubmit = computed(
    () =>
        form.name.trim().length > 0 &&
        form.email.trim().length > 0 &&
        form.password.length >= 6 &&
        form.password === form.confirmPassword,
);

const handleRegister = async () => {
    if (!canSubmit.value || loading.value) return;
    error.value = "";
    loading.value = true;

    try {
        await register(form.name, form.email, form.password);
        await router.push("/");
    } catch (err: any) {
        error.value = err?.data?.message ?? "Registrasi gagal. Coba lagi.";
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div
        class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 dark:from-surface-950 dark:via-surface-900 dark:to-surface-950 flex items-center justify-center px-4 py-8"
    >
        <div class="w-full max-w-sm">
            <!-- Logo & Title -->
            <div class="text-center mb-8">
                <div class="flex justify-center mb-8">
                    <img
                        src="/logo.png"
                        alt="Logo"
                        class="w-20 h-20 object-contain inset-shadow-sm"
                    />
                </div>
                <h1
                    class="text-2xl font-extrabold text-gray-800 dark:text-gray-100"
                >
                    Buat Akun Baru
                </h1>
                <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Mulai kelola keuanganmu hari ini
                </p>
            </div>

            <!-- Form Card -->
            <div
                class="bg-white dark:bg-surface-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/30 border border-gray-100 dark:border-gray-800 p-6"
            >
                <!-- Error -->
                <Transition
                    enter-active-class="transition-all duration-200"
                    enter-from-class="opacity-0 -translate-y-2"
                    enter-to-class="opacity-100 translate-y-0"
                >
                    <div
                        v-if="error"
                        class="flex items-center gap-2 px-4 py-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400"
                    >
                        <span class="text-sm">⚠️</span>
                        <span class="text-xs font-semibold">{{ error }}</span>
                    </div>
                </Transition>

                <form @submit.prevent="handleRegister" class="space-y-4">
                    <!-- Name -->
                    <div>
                        <label
                            class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block"
                        >
                            Nama Lengkap
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
                                <circle cx="12" cy="8" r="5" />
                                <path d="M20 21a8 8 0 0 0-16 0" />
                            </svg>
                            <input
                                v-model="form.name"
                                type="text"
                                class="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200"
                                placeholder="Budi Santoso"
                                autocomplete="name"
                            />
                        </div>
                    </div>

                    <!-- Email -->
                    <div>
                        <label
                            class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block"
                        >
                            Email
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
                                <rect
                                    width="20"
                                    height="16"
                                    x="2"
                                    y="4"
                                    rx="2"
                                />
                                <path
                                    d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"
                                />
                            </svg>
                            <input
                                v-model="form.email"
                                type="email"
                                class="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200"
                                placeholder="email@example.com"
                                autocomplete="email"
                            />
                        </div>
                    </div>

                    <!-- Password -->
                    <div>
                        <label
                            class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block"
                        >
                            Password
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
                                <rect
                                    width="18"
                                    height="11"
                                    x="3"
                                    y="11"
                                    rx="2"
                                    ry="2"
                                />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            <input
                                v-model="form.password"
                                :type="showPassword ? 'text' : 'password'"
                                class="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-50 dark:bg-surface-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition-all duration-200"
                                placeholder="Minimal 6 karakter"
                                autocomplete="new-password"
                            />
                            <button
                                type="button"
                                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                @click="showPassword = !showPassword"
                            >
                                <svg
                                    v-if="!showPassword"
                                    class="w-4 h-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path
                                        d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                                    />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                                <svg
                                    v-else
                                    class="w-4 h-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path
                                        d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"
                                    />
                                    <path
                                        d="M14.084 14.158a3 3 0 0 1-4.242-4.242"
                                    />
                                    <path
                                        d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"
                                    />
                                    <path d="m2 2 20 20" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Confirm Password -->
                    <div>
                        <label
                            class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block"
                        >
                            Konfirmasi Password
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
                                <path
                                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"
                                />
                                <path d="m9 12 2 2 4-4" />
                            </svg>
                            <input
                                v-model="form.confirmPassword"
                                type="password"
                                class="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-surface-800 text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none transition-all duration-200"
                                :class="
                                    passwordMismatch
                                        ? 'border-2 border-rose-400 hover:border-rose-500 focus:ring-2 focus:ring-rose-400/50'
                                        : 'border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400'
                                "
                                placeholder="Ketik ulang password"
                                autocomplete="new-password"
                            />
                        </div>
                        <p
                            v-if="passwordMismatch"
                            class="text-[11px] text-rose-500 mt-1 font-semibold"
                        >
                            ⚠️ Password tidak sama
                        </p>
                        <p
                            v-if="passwordMatch"
                            class="text-[11px] text-emerald-500 mt-1 font-semibold flex items-center gap-1"
                        >
                            <svg
                                class="w-3 h-3"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="3"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            >
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Password cocok
                        </p>
                    </div>

                    <!-- Submit -->
                    <button
                        type="submit"
                        :disabled="!canSubmit || loading"
                        class="w-full py-3.5 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-blue-500 to-emerald-500 shadow-lg shadow-emerald-500/30 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <svg
                            v-if="loading"
                            class="w-4 h-4 animate-spin"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <circle
                                class="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                stroke-width="4"
                            />
                            <path
                                class="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                        </svg>
                        <span>{{
                            loading ? "Memproses..." : "Daftar Sekarang"
                        }}</span>
                    </button>
                </form>
            </div>

            <!-- Login link -->
            <p
                class="text-center text-sm text-gray-400 dark:text-gray-500 mt-6"
            >
                Sudah punya akun?
                <NuxtLink
                    to="/login"
                    class="font-semibold text-emerald-500 hover:text-emerald-600 transition-colors"
                >
                    Masuk di sini
                </NuxtLink>
            </p>

            <p
                class="text-center text-[11px] text-gray-300 dark:text-gray-700 mt-8"
            >
                CashPlow v1.0 — Personal Budget Tracker
            </p>
        </div>
    </div>
</template>
