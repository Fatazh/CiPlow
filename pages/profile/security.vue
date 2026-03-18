<script setup lang="ts">
// pages/profile/security.vue — Security & Password modal

useHead({ title: "Keamanan — CashPlow" });
const router = useRouter();

const form = reactive({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
});

const showPassword = reactive({
    current: false,
    new: false,
    confirm: false,
});

const loading = ref(false);
const error = ref("");
const success = ref(false);

const canSubmit = computed(
    () =>
        form.currentPassword.length > 0 &&
        form.newPassword.length >= 6 &&
        form.newPassword === form.confirmPassword,
);

const handleUpdatePassword = async () => {
    if (!canSubmit.value || loading.value) return;

    loading.value = true;
    error.value = "";
    success.value = false;

    try {
        await $fetch("/api/auth/password", {
            method: "PUT",
            body: form,
        });

        success.value = true;
        // Clear form
        form.currentPassword = "";
        form.newPassword = "";
        form.confirmPassword = "";

        // Close after a short delay
        setTimeout(() => {
            router.back();
        }, 2000);
    } catch (err: any) {
        error.value = err.data?.message || "Gagal mengubah password";
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <div
                class="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm px-4 pb-8"
                @click.self="router.back()"
            >
                <Transition
                    enter-active-class="transition-all duration-300 cubic-bezier(0.34,1.56,0.64,1)"
                    enter-from-class="opacity-0 translate-y-8 scale-95"
                    enter-to-class="opacity-100 translate-y-0 scale-100"
                    leave-active-class="transition-all duration-200 ease-in"
                    leave-from-class="opacity-100 translate-y-0 scale-100"
                    leave-to-class="opacity-0 translate-y-4 scale-95"
                >
                    <div
                        class="w-full max-w-app bg-white dark:bg-surface-900 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
                    >
                        <!-- Header -->
                        <div class="flex items-center justify-between mb-6">
                            <button
                                @click="router.back()"
                                class="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                            >
                                <svg
                                    class="w-5 h-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2.5"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <path d="M18 6 6 18M6 6l12 12" />
                                </svg>
                            </button>
                            <h1
                                class="text-lg font-bold text-gray-800 dark:text-gray-100"
                            >
                                Keamanan & Password
                            </h1>
                            <div class="w-10"></div>
                        </div>

                        <!-- Success Alert -->
                        <div
                            v-if="success"
                            class="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-sm font-bold rounded-2xl border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-3 animate-bounce"
                        >
                            <span>✅</span>
                            <span>Password berhasil diubah!</span>
                        </div>

                        <form
                            @submit.prevent="handleUpdatePassword"
                            class="space-y-5"
                        >
                            <!-- Error Alert -->
                            <div
                                v-if="error"
                                class="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-500 text-xs font-semibold rounded-xl border border-rose-100 dark:border-rose-900/50"
                            >
                                {{ error }}
                            </div>

                            <!-- Current Password -->
                            <div class="space-y-1.5">
                                <label
                                    class="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-1"
                                    >Password Saat Ini</label
                                >
                                <div class="relative">
                                    <input
                                        v-model="form.currentPassword"
                                        :type="
                                            showPassword.current
                                                ? 'text'
                                                : 'password'
                                        "
                                        placeholder="Masukkan password lama"
                                        class="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 pr-12 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                                    />
                                    <button
                                        type="button"
                                        @click="
                                            showPassword.current =
                                                !showPassword.current
                                        "
                                        class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {{ showPassword.current ? "🙈" : "👁️" }}
                                    </button>
                                </div>
                            </div>

                            <div
                                class="h-px bg-gray-100 dark:bg-gray-800 my-1"
                            ></div>

                            <!-- New Password -->
                            <div class="space-y-1.5">
                                <label
                                    class="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-1"
                                    >Password Baru</label
                                >
                                <div class="relative">
                                    <input
                                        v-model="form.newPassword"
                                        :type="
                                            showPassword.new
                                                ? 'text'
                                                : 'password'
                                        "
                                        placeholder="Minimal 6 karakter"
                                        class="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 pr-12 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                                    />
                                    <button
                                        type="button"
                                        @click="
                                            showPassword.new = !showPassword.new
                                        "
                                        class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {{ showPassword.new ? "🙈" : "👁️" }}
                                    </button>
                                </div>
                            </div>

                            <!-- Confirm Password -->
                            <div class="space-y-1.5">
                                <label
                                    class="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-1"
                                    >Konfirmasi Password Baru</label
                                >
                                <div class="relative">
                                    <input
                                        v-model="form.confirmPassword"
                                        :type="
                                            showPassword.confirm
                                                ? 'text'
                                                : 'password'
                                        "
                                        placeholder="Ulangi password baru"
                                        class="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 pr-12 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                                        :class="
                                            form.confirmPassword &&
                                            form.newPassword !==
                                                form.confirmPassword
                                                ? 'ring-2 ring-rose-400'
                                                : ''
                                        "
                                    />
                                    <button
                                        type="button"
                                        @click="
                                            showPassword.confirm =
                                                !showPassword.confirm
                                        "
                                        class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {{ showPassword.confirm ? "🙈" : "👁️" }}
                                    </button>
                                </div>
                                <p
                                    v-if="
                                        form.confirmPassword &&
                                        form.newPassword !==
                                            form.confirmPassword
                                    "
                                    class="text-[10px] text-rose-500 ml-1"
                                >
                                    Password tidak cocok
                                </p>
                            </div>

                            <!-- Save Button -->
                            <button
                                type="submit"
                                :disabled="loading || !canSubmit"
                                class="w-full flex items-center justify-center py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold shadow-lg shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 mt-6"
                            >
                                <span
                                    v-if="loading"
                                    class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"
                                ></span>
                                <span>Ubah Password</span>
                            </button>
                        </form>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>
