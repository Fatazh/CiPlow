<script setup lang="ts">
import {
    EyeIcon,
    EyeOffIcon,
    TrendingUpIcon,
    TrendingDownIcon,
    WalletIcon,
} from "lucide-vue-next";

interface Wallet {
    id: string;
    name: string;
    type: string;
    balance: number;
    color: string;
    icon: string;
}

interface Props {
    total?: number;
    lastMonth?: number;
    changePercent?: number;
    isPositive?: boolean;
    period?: string;
    wallets?: Wallet[];
    loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    total: 0,
    lastMonth: 0,
    changePercent: 0,
    isPositive: true,
    period: "",
    wallets: () => [],
    loading: false,
});

const { formatIDR, formatCompact, isBalanceHidden, toggleBalanceHidden } = useCurrency();

const isVisible = computed(() => !isBalanceHidden.value);
const toggleVisibility = () => {
    toggleBalanceHidden();
};

const maskedAmount = "••••••••";

const displayBalance = computed(() =>
    isVisible.value ? formatIDR(props.total) : maskedAmount,
);

const changeLabel = computed(() => {
    const sign = props.isPositive ? "+" : "";
    return `${sign}${props.changePercent.toFixed(1)}%`;
});

const walletTypeLabel = (type: string): string => {
    const map: Record<string, string> = {
        BANK: "Bank",
        CASH: "Tunai",
        E_WALLET: "e-Wallet",
        INVESTMENT: "Investasi",
        OTHER: "Lainnya",
    };
    return map[type] ?? type;
};
</script>

<template>
    <div
        v-if="loading"
        class="card-gradient rounded-2xl p-5 animate-pulse"
        style="min-height: 200px"
    >
        <div class="space-y-3">
            <div class="h-3 w-28 bg-white/30 rounded-full" />
            <div class="h-9 w-48 bg-white/30 rounded-full" />
            <div class="h-4 w-20 bg-white/20 rounded-full" />
            <div class="flex gap-2 mt-4">
                <div class="h-7 w-24 bg-white/20 rounded-full" />
                <div class="h-7 w-20 bg-white/20 rounded-full" />
                <div class="h-7 w-20 bg-white/20 rounded-full" />
            </div>
        </div>
    </div>

    <div
        v-else
        class="card-gradient rounded-2xl overflow-hidden select-none relative group transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    >
        <div class="relative p-5">
            <div class="relative flex items-start justify-between mb-1">
                <div>
                    <p
                        class="text-[#40513B] dark:text-white text-xs font-medium tracking-wide uppercase"
                    >
                        Saldo Total
                    </p>
                    <p class="text-[#40513B]/90 dark:text-white/90 text-[11px] mt-0.5">
                        {{ period }}
                    </p>
                </div>

                <button
                    class="flex items-center justify-center w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-[#40513B]/80 dark:text-white/80 transition-all duration-200 active:scale-90 -mt-0.5"
                    :aria-label="
                        isVisible ? 'Sembunyikan saldo' : 'Tampilkan saldo'
                    "
                    @click="toggleVisibility"
                >
                    <EyeOffIcon v-if="isVisible" :size="16" :stroke-width="2" />
                    <EyeIcon v-else :size="16" :stroke-width="2" />
                </button>
            </div>

            <div class="relative mt-2 mb-3">
                <Transition
                    mode="out-in"
                    enter-active-class="transition-all duration-200 ease-out"
                    enter-from-class="opacity-0 translate-y-2"
                    enter-to-class="opacity-100 translate-y-0"
                    leave-active-class="transition-all duration-150 ease-in"
                    leave-from-class="opacity-100 translate-y-0"
                    leave-to-class="opacity-0 -translate-y-2"
                >
                    <p
                        :key="isVisible ? 'shown' : 'hidden'"
                        class="text-[#40513B] dark:text-white font-bold tracking-tight leading-none"
                        :class="
                            isVisible ? 'text-3xl' : 'text-2xl tracking-widest'
                        "
                    >
                        {{ displayBalance }}
                    </p>
                </Transition>
            </div>

            <div class="relative flex items-center gap-1.5 mb-4">
                <span
                    class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                    :class="
                        isPositive
                            ? 'bg-white/20 text-[#40513B] dark:text-white'
                            : 'bg-rose-400/30 text-rose-100'
                    "
                >
                    <TrendingUpIcon
                        v-if="isPositive"
                        :size="12"
                        :stroke-width="2.5"
                    />
                    <TrendingDownIcon v-else :size="12" :stroke-width="2.5" />
                    {{ changeLabel }}
                </span>

                <span class="text-[#40513B]/90 dark:text-white/90 text-[11px]"> vs bulan lalu </span>
            </div>

            <div class="relative w-full h-px bg-white/15 mb-4" />

            <div v-if="wallets.length > 0" class="relative">
                <p
                    class="text-[#40513B]/50 dark:text-white/50 text-[10px] uppercase tracking-wide font-medium mb-2"
                >
                    Dompet Saya
                </p>

                <div
                    class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5"
                >
                    <div
                        v-for="wallet in wallets"
                        :key="wallet.id"
                        class="flex items-center gap-1.5 flex-shrink-0 bg-white/15 hover:bg-white/25 rounded-full px-3 py-1.5 cursor-pointer transition-all duration-150 active:scale-95"
                    >
                        <span class="text-sm leading-none">{{
                            wallet.icon
                        }}</span>

                        <div class="flex flex-col">
                            <span
                                class="text-[#40513B]/70 dark:text-white/70 text-[9px] font-medium leading-none mb-0.5"
                            >
                                {{ wallet.name }}
                            </span>
                            <span
                                class="text-[#40513B] dark:text-white text-[11px] font-semibold leading-none"
                            >
                                <template v-if="isVisible">
                                    {{ formatCompact(wallet.balance) }}
                                </template>
                                <template v-else> •••• </template>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div
                v-else
                class="relative flex items-center gap-2 text-[#40513B]/50 dark:text-white/50 text-xs"
            >
                <WalletIcon :size="14" :stroke-width="1.8" />
                <span>Belum ada dompet</span>
            </div>
        </div>
    </div>
</template>
