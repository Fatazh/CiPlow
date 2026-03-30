<script setup lang="ts">
import { useUserStore } from '~/stores/user'
import { ref, onMounted } from 'vue'

useHead({ title: "Mata Uang — CashPlow" });
const router = useRouter();
const userStore = useUserStore();

const show = ref(false);

onMounted(() => {
    setTimeout(() => {
        show.value = true;
    }, 50);
});

const close = () => {
    show.value = false;
    setTimeout(() => {
        router.back();
    }, 300);
};

const currencies = [
    { code: 'IDR', label: 'Rupiah (IDR)', symbol: 'Rp' },
    { code: 'USD', label: 'US Dollar (USD)', symbol: '$' },
    { code: 'EUR', label: 'Euro (EUR)', symbol: '€' },
    { code: 'SGD', label: 'Singapore Dollar (SGD)', symbol: 'S$' },
    { code: 'JPY', label: 'Japanese Yen (JPY)', symbol: '¥' },
    { code: 'MYR', label: 'Malaysian Ringgit (MYR)', symbol: 'RM' },
]

const selectCurrency = (code: string) => {
    userStore.setCurrency(code);
    close();
}
</script>

<template>
    <div>
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
                    v-if="show"
                    class="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm px-4 pb-8"
                    @click.self="close"
                >
                    <Transition
                        appear
                        enter-active-class="transition-all duration-300 cubic-bezier(0.34,1.56,0.64,1)"
                        enter-from-class="opacity-0 translate-y-8 scale-95"
                        enter-to-class="opacity-100 translate-y-0 scale-100"
                        leave-active-class="transition-all duration-200 ease-in"
                        leave-from-class="opacity-100 translate-y-0 scale-100"
                        leave-to-class="opacity-0 translate-y-4 scale-95"
                    >
                        <div
                            v-if="show"
                            class="w-full max-w-app bg-white dark:bg-surface-900 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
                        >
                            <!-- Header -->
                            <div class="flex items-center justify-between mb-6">
                                <button
                                    @click="close"
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
                                Mata Uang Utama
                            </h1>
                            <div class="w-10"></div>
                        </div>

                        <div class="space-y-4">
                            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Pilih mata uang utama untuk tampilan saldo dan analitik Anda.
                            </p>

                            <button
                                v-for="currency in currencies"
                                :key="currency.code"
                                @click="selectCurrency(currency.code)"
                                class="w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200"
                                :class="userStore.currency === currency.code ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'"
                            >
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center font-bold text-gray-700 dark:text-gray-200">
                                        {{ currency.symbol }}
                                    </div>
                                    <span class="font-semibold text-gray-800 dark:text-gray-100">{{ currency.label }}</span>
                                </div>
                                
                                <div v-if="userStore.currency === currency.code" class="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center">
                                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                                </div>
                            </button>
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
    </div>
</template>
