<script setup lang="ts">
useHead({ title: "Edit Profil — CashPlow" });

const { user, updateUser } = useAuth();
const router = useRouter();

const form = reactive({
    name: user.value?.name ?? "",
    email: user.value?.email ?? "",
    avatar: user.value?.avatar ?? "", // Support current avatar or newly uploaded Base64
});

const loading = ref(false);
const error = ref("");
const fileInput = ref<HTMLInputElement | null>(null);

// ── Initials for avatar fallback ───────────────────────────────
const initials = computed(() =>
    (form.name || "Pengguna")
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() ?? "")
        .join(""),
);

// ── Handle file selection and convert to Base64 ───────────────
const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        error.value = "Ukuran gambar maksimal 2MB";
        return;
    }

    // Validate type
    if (!file.type.startsWith("image/")) {
        error.value = "Format file harus berupa gambar (JPG, PNG)";
        return;
    }

    error.value = "";

    const reader = new FileReader();
    reader.onload = (e) => {
        form.avatar = e.target?.result as string;
    };
    reader.readAsDataURL(file);
};

const triggerFileInput = () => {
    fileInput.value?.click();
};

// ── Save Profile ──────────────────────────────────────────────
const saveProfile = async () => {
    if (!form.name || !form.email) {
        error.value = "Nama dan email harus diisi";
        return;
    }

    try {
        loading.value = true;
        error.value = "";
        await updateUser({
            name: form.name,
            email: form.email,
            avatar: form.avatar,
        });
        router.push("/profile");
    } catch (err: any) {
        error.value = err.data?.message || "Gagal menyimpan profil";
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
                                Edit Profil
                            </h1>
                            <div class="w-10"></div>
                        </div>

                        <form @submit.prevent="saveProfile" class="space-y-5">
                            <!-- Error Alert -->
                            <Transition
                                enter-active-class="transition-all duration-200"
                                enter-from-class="opacity-0 -translate-y-2"
                                enter-to-class="opacity-100 translate-y-0"
                            >
                                <div
                                    v-if="error"
                                    class="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-500 text-xs font-semibold rounded-xl border border-rose-100 dark:border-rose-900/50"
                                >
                                    {{ error }}
                                </div>
                            </Transition>

                            <!-- Avatar Upload Section -->
                            <div
                                class="flex flex-col items-center justify-center py-2"
                            >
                                <div
                                    class="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-primary-50 dark:ring-primary-950/30 cursor-pointer group shadow-sm"
                                    @click="triggerFileInput"
                                >
                                    <img
                                        v-if="form.avatar"
                                        :src="form.avatar"
                                        class="w-full h-full object-cover"
                                        alt="Avatar preview"
                                    />
                                    <div
                                        v-else
                                        class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600 text-white text-3xl font-bold select-none"
                                    >
                                        {{ initials }}
                                    </div>

                                    <!-- Hover Overlay -->
                                    <div
                                        class="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    >
                                        <span class="text-white text-xl mb-1"
                                            >📷</span
                                        >
                                        <span
                                            class="text-white text-[10px] font-bold tracking-wide uppercase"
                                            >Ubah</span
                                        >
                                    </div>
                                </div>
                                <p
                                    class="text-[11px] text-gray-400 dark:text-gray-500 mt-3"
                                >
                                    Tap foto untuk mengganti avatar
                                </p>

                                <!-- Hidden File Input -->
                                <input
                                    ref="fileInput"
                                    type="file"
                                    accept="image/*"
                                    class="hidden"
                                    @change="handleFileSelect"
                                />
                            </div>

                            <div
                                class="h-px bg-gray-100 dark:bg-gray-800 my-2"
                            ></div>

                            <!-- Name Input -->
                            <div class="space-y-1.5">
                                <label
                                    class="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-1"
                                    >Nama Lengkap</label
                                >
                                <input
                                    v-model="form.name"
                                    type="text"
                                    placeholder="Masukkan nama"
                                    class="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                                />
                            </div>

                            <!-- Email Input -->
                            <div class="space-y-1.5">
                                <label
                                    class="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-1"
                                    >Alamat Email</label
                                >
                                <input
                                    v-model="form.email"
                                    type="email"
                                    placeholder="Masukkan email"
                                    class="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-primary-500 transition-all outline-none"
                                />
                            </div>

                            <!-- Save Button -->
                            <button
                                type="submit"
                                :disabled="loading"
                                class="w-full flex items-center justify-center py-4 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-bold shadow-lg shadow-primary-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 mt-6"
                            >
                                <span
                                    v-if="loading"
                                    class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                                ></span>
                                <span v-else>Simpan Perubahan</span>
                            </button>
                        </form>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>
