<script setup lang="ts">
// pages/profile/security.vue — Security & Password Settings
import { ref, reactive, computed, onMounted } from 'vue';

useHead({ title: "Keamanan Akun — CashPlow" });
const router = useRouter();
const { user } = useAuth();

// ── Password Form ─────────────────────────────────────────────
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

// Password strength calculation
const passwordStrength = computed(() => {
    const p = form.newPassword;
    if (!p) return { score: 0, label: '', color: 'bg-gray-200' };
    
    let score = 0;
    if (p.length >= 6) score += 1;
    if (/[0-9]/.test(p) && /[a-zA-Z]/.test(p)) score += 1;
    if (/[^A-Za-z0-9]/.test(p)) score += 1;
    
    if (score === 1) return { score, label: 'Lemah', color: 'bg-rose-500' };
    if (score === 2) return { score, label: 'Sedang', color: 'bg-amber-500' };
    if (score === 3) return { score, label: 'Kuat', color: 'bg-emerald-500' };
    
    return { score: 0, label: 'Terlalu Pendek', color: 'bg-gray-300' };
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

const passwordMatch = computed(
    () =>
        form.confirmPassword.length > 0 &&
        form.newPassword === form.confirmPassword &&
        form.newPassword.length >= 6
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
        form.currentPassword = "";
        form.newPassword = "";
        form.confirmPassword = "";

        setTimeout(() => {
            window.location.href = "/login";
        }, 1200);
    } catch (err: any) {
        error.value = err.data?.message || "Gagal mengubah password";
    } finally {
        loading.value = false;
    }
};

// Ensure user is logged in to access security
onMounted(() => {
    if (!user.value) {
        router.replace('/login');
    }
});
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
                                Keamanan Akun
                            </h1>
                            <div class="w-10"></div>
                        </div>

                        <div class="space-y-6">
                            <!-- ── SECTION: Change Password ───────────────────────────── -->
                            <div class="space-y-4">
                                <h3 class="text-sm font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                    <span>🔑</span> Ubah Password Akun
                                </h3>

                                <form @submit.prevent="handleUpdatePassword" class="space-y-4">
                                    <div v-if="success" class="p-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl">Password berhasil diubah. Mengalihkan ke halaman login...</div>
                                    <div v-if="error" class="p-3 bg-rose-50 text-rose-500 text-xs font-bold rounded-xl">{{ error }}</div>

                                    <div class="space-y-1">
                                        <label class="text-[10px] font-bold text-gray-400 uppercase ml-1">Password Saat Ini</label>
                                        <div class="relative">
                                            <input v-model="form.currentPassword" :type="showPassword.current ? 'text' : 'password'" 
                                                   class="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary-500 transition-all outline-none" />
                                            <button type="button" @click="showPassword.current = !showPassword.current" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                                {{ showPassword.current ? '👁️' : '👁️‍🗨️' }}
                                            </button>
                                        </div>
                                    </div>
                                    <div class="space-y-1">
                                        <label class="text-[10px] font-bold text-gray-400 uppercase ml-1">Password Baru</label>
                                        <div class="relative">
                                            <input v-model="form.newPassword" :type="showPassword.new ? 'text' : 'password'" 
                                                   class="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary-500 transition-all outline-none" placeholder="Min. 6 karakter" />
                                            <button type="button" @click="showPassword.new = !showPassword.new" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                                {{ showPassword.new ? '👁️' : '👁️‍🗨️' }}
                                            </button>
                                        </div>
                                        
                                        <!-- Password Strength Meter -->
                                        <div v-if="form.newPassword" class="mt-2 space-y-1.5 px-1">
                                            <div class="flex justify-between items-center">
                                                <span class="text-[9px] font-bold uppercase tracking-wider text-gray-400">Keamanan:</span>
                                                <span class="text-[9px] font-black uppercase tracking-wider" :class="passwordStrength.color.replace('bg-', 'text-')">
                                                    {{ passwordStrength.label }}
                                                </span>
                                            </div>
                                            <div class="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex gap-0.5">
                                                <div v-for="i in 3" :key="i" class="h-full flex-1 transition-all duration-500"
                                                    :class="i <= passwordStrength.score ? passwordStrength.color : 'bg-gray-200 dark:bg-gray-700/50'">
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="space-y-1">
                                        <label class="text-[10px] font-bold text-gray-400 uppercase ml-1">Konfirmasi Password Baru</label>
                                        <div class="relative">
                                            <input v-model="form.confirmPassword" :type="showPassword.confirm ? 'text' : 'password'" 
                                                   class="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary-500 transition-all outline-none" />
                                            <button type="button" @click="showPassword.confirm = !showPassword.confirm" class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                                {{ showPassword.confirm ? '👁️' : '👁️‍🗨️' }}
                                            </button>
                                        </div>
                                        <p
                                            v-if="form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword"
                                            class="text-[10px] text-rose-500 mt-1 font-bold flex items-center gap-1"
                                        >
                                            ⚠️ Password tidak sama
                                        </p>
                                        <p
                                            v-if="passwordMatch"
                                            class="text-[10px] text-emerald-500 mt-1 font-bold flex items-center gap-1"
                                        >
                                            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            Password cocok
                                        </p>
                                    </div>

                                    <button type="submit" :disabled="loading || !canSubmit" class="w-full py-4 rounded-2xl bg-primary-500 text-white text-sm font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-primary-500/20">
                                        {{ loading ? 'Memproses...' : 'Perbarui Password' }}
                                    </button>
                                </form>
                            </div>

                            <!-- Security Info -->
                            <div class="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30">
                                <p class="text-[10px] text-emerald-600 dark:text-emerald-400 leading-relaxed">
                                    <strong>Keamanan Akun:</strong> Pastikan Anda menggunakan kata sandi unik yang tidak digunakan di situs web lain untuk menjaga keamanan data keuangan Anda.
                                </p>
                            </div>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>
