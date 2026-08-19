<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCurrency } from '~/composables/useCurrency'

const props = defineProps<{
    transactions: any[]
    month: number // 1 - 12
    year: number
}>()

const { formatIDR, formatCompact } = useCurrency()

const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

// Current Month Metrics
const currentMonthTransactions = computed(() => {
    return props.transactions.filter(tx => {
        const d = new Date(tx.date)
        return d.getMonth() + 1 === props.month && d.getFullYear() === props.year
    })
})

const totalIncome = computed(() => {
    return currentMonthTransactions.value
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + Number(t.amount), 0)
})

const totalExpense = computed(() => {
    return currentMonthTransactions.value
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Number(t.amount), 0)
})

const netSavings = computed(() => totalIncome.value - totalExpense.value)

const savingsRate = computed(() => {
    if (totalIncome.value <= 0) return 0
    return Math.max(0, Math.round((netSavings.value / totalIncome.value) * 100))
})

const activeDaysCount = computed(() => {
    const set = new Set<string>()
    for (const t of currentMonthTransactions.value) {
        set.add(t.date.split('T')[0])
    }
    return set.size
})

// Top category
const topCategory = computed(() => {
    const map = new Map<string, { name: string; icon: string; color: string; total: number }>()
    for (const t of currentMonthTransactions.value) {
        if (t.type !== 'EXPENSE') continue
        const catName = t.category?.name || 'Lainnya'
        const existing = map.get(catName) || {
            name: catName,
            icon: t.category?.icon || '📦',
            color: t.category?.color || '#10b981',
            total: 0
        }
        existing.total += Number(t.amount)
        map.set(catName, existing)
    }
    let highest: { name: string; icon: string; color: string; total: number } | null = null
    for (const entry of map.values()) {
        if (!highest || entry.total > highest.total) {
            highest = entry
        }
    }
    return highest
})

// Share or Copy
const copiedToast = ref(false)

const shareRecap = async () => {
    const text = `📊 *Rekap Keuangan CashPlow — ${monthNames[props.month - 1]} ${props.year}*\n\n` +
        `💰 Total Pemasukan: ${formatIDR(totalIncome.value)}\n` +
        `💸 Total Pengeluaran: ${formatIDR(totalExpense.value)}\n` +
        `📈 Net Tabungan: ${formatIDR(netSavings.value)} (${savingsRate.value}%)\n` +
        (topCategory.value ? `🛍️ Kategori Terbesar: ${topCategory.value.icon} ${topCategory.value.name} (${formatIDR(topCategory.value.total)})\n` : '') +
        `\n_Dikelola dengan CashPlow Budget Tracker_`

    if (navigator.share) {
        try {
            await navigator.share({
                title: `Rekap Finansial ${monthNames[props.month - 1]} ${props.year}`,
                text
            })
            return
        } catch {
            // fallback to clipboard
        }
    }

    await navigator.clipboard.writeText(text)
    copiedToast.value = true
    setTimeout(() => {
        copiedToast.value = false
    }, 3000)
}
</script>

<template>
    <div class="card rounded-3xl p-5 border border-primary-100 dark:border-slate-800 bg-gradient-to-br from-primary-500/10 via-surface-50 to-surface-50 dark:from-primary-950/30 dark:via-slate-900 dark:to-slate-900 shadow-card space-y-4 relative overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
                <div class="w-10 h-10 rounded-2xl bg-primary-500 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-primary-500/30">
                    📊
                </div>
                <div>
                    <h3 class="text-sm font-black text-gray-900 dark:text-white">
                        Rekap Finansial Bulanan
                    </h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                        {{ monthNames[month - 1] }} {{ year }}
                    </p>
                </div>
            </div>

            <button
                type="button"
                class="px-3 py-1.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all duration-150"
                @click="shareRecap"
            >
                <span>📤</span>
                <span>Bagikan</span>
            </button>
        </div>

        <!-- Metric Grid -->
        <div class="grid grid-cols-2 gap-3 pt-1">
            <!-- Pemasukan -->
            <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/60 space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Pemasukan</span>
                <div class="text-sm font-black text-emerald-600 dark:text-emerald-400 truncate">
                    {{ formatIDR(totalIncome) }}
                </div>
            </div>

            <!-- Pengeluaran -->
            <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/60 space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Pengeluaran</span>
                <div class="text-sm font-black text-rose-600 dark:text-rose-400 truncate">
                    {{ formatIDR(totalExpense) }}
                </div>
            </div>

            <!-- Net Tabungan -->
            <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/60 space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">Sisa / Tabungan</span>
                <div class="text-sm font-black text-gray-900 dark:text-white truncate">
                    {{ formatIDR(netSavings) }}
                </div>
                <div class="text-[10px] font-bold text-gray-400">
                    Rasio Tabungan: <span class="text-primary-500">{{ savingsRate }}%</span>
                </div>
            </div>

            <!-- Top Kategori -->
            <div class="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-slate-700/60 space-y-1">
                <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400">Kategori Terbesar</span>
                <div v-if="topCategory" class="flex items-center gap-1.5 truncate">
                    <span>{{ topCategory.icon }}</span>
                    <span class="text-xs font-black text-gray-900 dark:text-white truncate">{{ topCategory.name }}</span>
                </div>
                <div v-if="topCategory" class="text-[10px] text-gray-400 font-bold truncate">
                    {{ formatCompact(topCategory.total) }}
                </div>
                <div v-else class="text-xs text-gray-400">
                    -
                </div>
            </div>
        </div>

        <!-- Active Days & Tip -->
        <div class="px-3.5 py-2.5 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-between text-xs text-primary-900 dark:text-primary-200">
            <div class="flex items-center gap-2">
                <span>🗓️</span>
                <span class="font-bold">Aktif mencatat {{ activeDaysCount }} hari di bulan ini</span>
            </div>
            <span class="text-xs font-black text-primary-600 dark:text-primary-400">
                {{ activeDaysCount >= 20 ? '🌟 Konsisten!' : '👍 Hebat!' }}
            </span>
        </div>

        <!-- Copied Toast -->
        <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-2"
        >
            <div v-if="copiedToast" class="text-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
                ✓ Rangkuman teks disalin ke clipboard!
            </div>
        </Transition>
    </div>
</template>
