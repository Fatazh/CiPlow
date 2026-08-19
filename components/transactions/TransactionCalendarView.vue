<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCurrency } from '~/composables/useCurrency'

interface TransactionItem {
    id: string
    amount: number
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
    date: string
    description?: string
    notes?: string
    tags?: string[]
    receiptImage?: string | null
    category: {
        id: string
        name: string
        icon: string
        color: string
        type: string
    }
    walletFrom?: any
    walletTo?: any
}

const props = defineProps<{
    transactions: TransactionItem[]
    currentMonth: number // 1 - 12
    currentYear: number
}>()

const emit = defineEmits<{
    (e: 'select-date', dateStr: string | null): void
    (e: 'change-month', payload: { month: number; year: number }): void
}>()

const { formatCompact, formatIDR } = useCurrency()

const selectedDateStr = ref<string | null>(null)

// Day names in Indonesian
const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

// Month names
const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

// Previous / Next Month navigation
const prevMonth = () => {
    let m = props.currentMonth - 1
    let y = props.currentYear
    if (m < 1) {
        m = 12
        y--
    }
    selectedDateStr.value = null
    emit('change-month', { month: m, year: y })
}

const nextMonth = () => {
    let m = props.currentMonth + 1
    let y = props.currentYear
    if (m > 12) {
        m = 1
        y++
    }
    selectedDateStr.value = null
    emit('change-month', { month: m, year: y })
}

// Group transactions by date string "YYYY-MM-DD"
const dateSummaryMap = computed(() => {
    const map = new Map<string, { income: number; expense: number; count: number; items: TransactionItem[] }>()
    for (const tx of props.transactions) {
        const d = tx.date.split('T')[0]
        if (!map.has(d)) {
            map.set(d, { income: 0, expense: 0, count: 0, items: [] })
        }
        const entry = map.get(d)!
        entry.count++
        entry.items.push(tx)
        if (tx.type === 'INCOME') entry.income += tx.amount
        if (tx.type === 'EXPENSE') entry.expense += tx.amount
    }
    return map
})

// Build calendar matrix
interface CalendarCell {
    date: number
    dateStr: string
    isCurrentMonth: boolean
    isToday: boolean
    income: number
    expense: number
    count: number
}

const calendarDays = computed(() => {
    const year = props.currentYear
    const month = props.currentMonth - 1 // 0-indexed

    const firstDayIndex = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const todayStr = new Date().toISOString().split('T')[0]

    const cells: CalendarCell[] = []

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i
        const prevMonthNum = month === 0 ? 12 : month
        const prevYearNum = month === 0 ? year - 1 : year
        const dateStr = `${prevYearNum}-${String(prevMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        cells.push({
            date: d,
            dateStr,
            isCurrentMonth: false,
            isToday: dateStr === todayStr,
            income: 0,
            expense: 0,
            count: 0
        })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const summary = dateSummaryMap.value.get(dateStr)
        cells.push({
            date: d,
            dateStr,
            isCurrentMonth: true,
            isToday: dateStr === todayStr,
            income: summary?.income || 0,
            expense: summary?.expense || 0,
            count: summary?.count || 0
        })
    }

    // Next month filler days (fill up to complete 35 or 42 grid cells)
    const remaining = (7 - (cells.length % 7)) % 7
    for (let d = 1; d <= remaining; d++) {
        const nextMonthNum = month === 11 ? 1 : month + 2
        const nextYearNum = month === 11 ? year + 1 : year
        const dateStr = `${nextYearNum}-${String(nextMonthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        cells.push({
            date: d,
            dateStr,
            isCurrentMonth: false,
            isToday: dateStr === todayStr,
            income: 0,
            expense: 0,
            count: 0
        })
    }

    return cells
})

const onSelectCell = (cell: CalendarCell) => {
    if (!cell.isCurrentMonth) return
    if (selectedDateStr.value === cell.dateStr) {
        selectedDateStr.value = null
        emit('select-date', null)
    } else {
        selectedDateStr.value = cell.dateStr
        emit('select-date', cell.dateStr)
    }
}

const selectedDayTransactions = computed(() => {
    if (!selectedDateStr.value) return []
    return dateSummaryMap.value.get(selectedDateStr.value)?.items || []
})
</script>

<template>
    <div class="space-y-4 animate-fade-in">
        <!-- Calendar Header -->
        <div class="card rounded-3xl p-5 shadow-card border border-gray-100 dark:border-slate-800 space-y-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="text-xl">📅</span>
                    <h3 class="text-base font-black text-gray-900 dark:text-white">
                        {{ monthNames[currentMonth - 1] }} {{ currentYear }}
                    </h3>
                </div>
                <div class="flex items-center gap-1 bg-gray-50 dark:bg-slate-800/80 p-1 rounded-xl border border-gray-100 dark:border-slate-700/60">
                    <button
                        type="button"
                        class="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors"
                        @click="prevMonth"
                    >
                        ◀
                    </button>
                    <button
                        type="button"
                        class="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-colors"
                        @click="nextMonth"
                    >
                        ▶
                    </button>
                </div>
            </div>

            <!-- Day Headers -->
            <div class="grid grid-cols-7 gap-1 text-center">
                <div
                    v-for="(day, idx) in dayNames"
                    :key="day"
                    class="text-[11px] font-bold py-1"
                    :class="idx === 0 ? 'text-rose-500' : 'text-gray-400 dark:text-slate-500'"
                >
                    {{ day }}
                </div>
            </div>

            <!-- Days Grid -->
            <div class="grid grid-cols-7 gap-1.5">
                <button
                    v-for="(cell, idx) in calendarDays"
                    :key="idx"
                    type="button"
                    class="min-h-[58px] p-1.5 rounded-2xl flex flex-col justify-between items-center transition-all duration-150 relative text-left"
                    :class="[
                        !cell.isCurrentMonth ? 'opacity-25 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-slate-800/60',
                        cell.isToday && !selectedDateStr ? 'ring-2 ring-primary-500/50 bg-primary-50/30 dark:bg-primary-950/20' : '',
                        selectedDateStr === cell.dateStr
                            ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                            : 'bg-white dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800'
                    ]"
                    @click="onSelectCell(cell)"
                >
                    <!-- Date number -->
                    <span
                        class="text-xs font-bold leading-none"
                        :class="[
                            selectedDateStr === cell.dateStr
                                ? 'text-white'
                                : cell.isToday
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-gray-700 dark:text-gray-200'
                        ]"
                    >
                        {{ cell.date }}
                    </span>

                    <!-- Indicators -->
                    <div class="w-full flex flex-col gap-0.5 items-center mt-1">
                        <div
                            v-if="cell.expense > 0"
                            class="w-full text-center text-[8px] font-black rounded px-0.5 truncate leading-tight"
                            :class="selectedDateStr === cell.dateStr ? 'bg-white/20 text-white' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'"
                        >
                            -{{ formatCompact(cell.expense) }}
                        </div>
                        <div
                            v-if="cell.income > 0"
                            class="w-full text-center text-[8px] font-black rounded px-0.5 truncate leading-tight"
                            :class="selectedDateStr === cell.dateStr ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'"
                        >
                            +{{ formatCompact(cell.income) }}
                        </div>
                    </div>
                </button>
            </div>
        </div>

        <!-- Selected Date Detail Box -->
        <div v-if="selectedDateStr" class="card rounded-3xl p-5 border border-primary-100 dark:border-primary-900/40 bg-gradient-to-br from-primary-50/50 via-white to-white dark:from-primary-950/20 dark:via-slate-900 dark:to-slate-900 space-y-4 animate-slide-up">
            <div class="flex items-center justify-between">
                <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">Transaksi Tanggal</span>
                    <h4 class="text-sm font-black text-gray-900 dark:text-white">
                        {{ new Date(selectedDateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) }}
                    </h4>
                </div>
                <button
                    type="button"
                    class="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    @click="selectedDateStr = null; emit('select-date', null)"
                >
                    Tutup ✕
                </button>
            </div>

            <div v-if="selectedDayTransactions.length === 0" class="py-6 text-center text-xs text-gray-400">
                Tidak ada transaksi pada tanggal ini.
            </div>

            <div v-else class="space-y-2.5">
                <div
                    v-for="tx in selectedDayTransactions"
                    :key="tx.id"
                    class="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/60 flex items-center justify-between shadow-sm"
                >
                    <div class="flex items-center gap-3 min-w-0">
                        <div
                            class="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                            :style="{ backgroundColor: tx.category.color + '20' }"
                        >
                            {{ tx.category.icon }}
                        </div>
                        <div class="min-w-0">
                            <p class="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {{ tx.description || tx.category.name }}
                            </p>
                            <div class="flex items-center gap-1.5 mt-0.5 text-[10px] text-gray-400">
                                <span>{{ tx.category.name }}</span>
                                <span v-if="tx.tags && tx.tags.length > 0" class="text-primary-500 font-bold">
                                    #{{ tx.tags.join(' #') }}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="text-right flex-shrink-0">
                        <span
                            class="text-xs font-black"
                            :class="tx.type === 'INCOME' ? 'text-emerald-500' : tx.type === 'EXPENSE' ? 'text-rose-500' : 'text-blue-500'"
                        >
                            {{ tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : '' }}{{ formatIDR(tx.amount) }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
