<script setup lang="ts">
// pages/profile/recurring.vue — Full CRUD & Control Transaksi Berulang (v1.2.4)
import { ref, onMounted, computed, reactive } from 'vue';

useHead({ title: "Transaksi Berulang — CashPlow" });
const router = useRouter();
const { formatIDR } = useCurrency();

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

// ── Fetch Recurring Transactions ──────────────────────────────
const { data, refresh, status } = useFetch<any>('/api/recurring-transactions', {
  key: 'recurring-transactions'
});

// Master data
const { data: walletsRaw } = useFetch<any>('/api/wallets');
const { data: categoriesRaw } = useFetch<any>('/api/categories');

const wallets = computed(() => walletsRaw.value?.data || []);
const allCategories = computed(() => categoriesRaw.value?.data || []);

// ── Modal State ───────────────────────────────────────────────
const isFormOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<string | null>(null);
const submitting = ref(false);

const form = reactive({
  amount: 0,
  type: 'EXPENSE' as 'EXPENSE' | 'INCOME' | 'TRANSFER',
  description: '',
  notes: '',
  interval: 'MONTHLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
  startDate: new Date().toISOString().substring(0, 10),
  endDate: '',
  categoryId: '',
  walletFromId: '',
  walletToId: '',
  isActive: true
});

// Filter categories according to selected type
const filteredCategories = computed(() => {
  if (form.type === 'TRANSFER') {
    return allCategories.value.filter((c: any) => c.type === 'EXPENSE');
  }
  return allCategories.value.filter((c: any) => c.type === form.type);
});

// Toast notification
const toast = reactive({
  show: false,
  message: '',
  type: 'success' as 'success' | 'error',
});

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toast.message = message;
  toast.type = type;
  toast.show = true;
  setTimeout(() => {
    toast.show = false;
  }, 3500);
};

// ── Form Handlers ──────────────────────────────────────────────
const openCreateModal = () => {
  isEditMode.value = false;
  editingId.value = null;
  form.amount = 0;
  form.type = 'EXPENSE';
  form.description = '';
  form.notes = '';
  form.interval = 'MONTHLY';
  form.startDate = new Date().toISOString().substring(0, 10);
  form.endDate = '';
  form.categoryId = filteredCategories.value[0]?.id || '';
  form.walletFromId = wallets.value[0]?.id || '';
  form.walletToId = '';
  form.isActive = true;
  isFormOpen.value = true;
};

const openEditModal = (item: any) => {
  isEditMode.value = true;
  editingId.value = item.id;
  form.amount = item.amount;
  form.type = item.type;
  form.description = item.description || '';
  form.notes = item.notes || '';
  form.interval = item.interval;
  form.startDate = item.startDate ? item.startDate.substring(0, 10) : new Date().toISOString().substring(0, 10);
  form.endDate = item.endDate ? item.endDate.substring(0, 10) : '';
  form.categoryId = item.categoryId;
  form.walletFromId = item.walletFromId || '';
  form.walletToId = item.walletToId || '';
  form.isActive = item.isActive;
  isFormOpen.value = true;
};

const submitForm = async () => {
  if (form.amount <= 0) {
    showToast('Nominal harus lebih dari 0', 'error');
    return;
  }
  if (!form.categoryId) {
    showToast('Silakan pilih kategori', 'error');
    return;
  }

  submitting.value = true;
  try {
    const payload = {
      amount: Number(form.amount),
      type: form.type,
      description: form.description,
      notes: form.notes,
      interval: form.interval,
      startDate: new Date(form.startDate).toISOString(),
      endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      categoryId: form.categoryId,
      walletFromId: form.walletFromId || undefined,
      walletToId: form.walletToId || undefined,
      isActive: form.isActive,
    };

    if (isEditMode.value && editingId.value) {
      await $fetch(`/api/recurring-transactions/${editingId.value}`, {
        method: 'PUT',
        body: payload,
      });
      showToast('Jadwal transaksi berhasil diperbarui', 'success');
    } else {
      await $fetch('/api/recurring-transactions', {
        method: 'POST',
        body: payload,
      });
      showToast('Jadwal transaksi baru berhasil dibuat', 'success');
    }

    isFormOpen.value = false;
    await refresh();
  } catch (error: any) {
    showToast(error?.data?.message || 'Gagal menyimpan transaksi berulang', 'error');
  } finally {
    submitting.value = false;
  }
};

// Toggle Pause / Resume
const toggleActive = async (item: any) => {
  try {
    const res: any = await $fetch(`/api/recurring-transactions/${item.id}/toggle`, {
      method: 'PATCH',
    });
    item.isActive = res.data.isActive;
    showToast(res.message || 'Status transaksi berulang berhasil diubah', 'success');
  } catch (error: any) {
    showToast(error?.data?.message || 'Gagal mengubah status', 'error');
  }
};

// Delete
const deleteItem = async (item: any) => {
  if (!confirm(`Hapus jadwal transaksi "${item.description || item.category}"?`)) return;

  try {
    await $fetch(`/api/recurring-transactions/${item.id}`, {
      method: 'DELETE',
    });
    showToast('Jadwal transaksi berhasil dihapus', 'success');
    await refresh();
  } catch (error: any) {
    showToast(error?.data?.message || 'Gagal menghapus transaksi', 'error');
  }
};

const getIntervalLabel = (interval: string) => {
  switch (interval) {
    case 'DAILY': return 'Harian';
    case 'WEEKLY': return 'Mingguan';
    case 'MONTHLY': return 'Bulanan';
    case 'YEARLY': return 'Tahunan';
    default: return interval;
  }
};
</script>

<template>
  <div>
    <!-- Toast notification -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4"
    >
      <div
        v-if="toast.show"
        class="fixed top-5 inset-x-0 z-[150] flex justify-center px-4 pointer-events-none"
      >
        <div
          class="px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-sm font-semibold pointer-events-auto"
          :class="toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'"
        >
          <span>{{ toast.type === 'success' ? '✓' : '⚠️' }}</span>
          <span>{{ toast.message }}</span>
        </div>
      </div>
    </Transition>

    <Teleport to="body">
      <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
      >
        <div v-if="show" class="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm px-4 pb-8" @click.self="close">
          <Transition
              appear
              enter-active-class="transition-all duration-300 cubic-bezier(0.34,1.56,0.64,1)"
              enter-from-class="opacity-0 translate-y-8 scale-95"
              enter-to-class="opacity-100 translate-y-0 scale-100"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100 translate-y-0 scale-100"
              leave-to-class="opacity-0 translate-y-4 scale-95"
          >
            <div v-if="show" class="w-full max-w-app bg-white dark:bg-surface-900 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <!-- Header -->
              <div class="flex items-center justify-between mb-6">
                <button @click="close" class="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
                <h1 class="text-lg font-bold text-gray-800 dark:text-gray-100">Transaksi Berulang</h1>
                <button
                  @click="openCreateModal"
                  class="w-10 h-10 flex items-center justify-center rounded-2xl bg-primary-500 text-white shadow-md shadow-primary-500/20 active:scale-95 transition-all"
                  title="Tambah Jadwal Baru"
                >
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14m-7-7h14"/></svg>
                </button>
              </div>

              <!-- List -->
              <div v-if="status === 'pending'" class="text-center py-10 space-y-3">
                <div class="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p class="text-xs text-gray-400 font-medium">Memuat jadwal otomatis...</p>
              </div>

              <div v-else-if="!data?.data?.length" class="text-center py-12 px-4 space-y-3">
                <div class="w-16 h-16 rounded-3xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center text-3xl mx-auto">🔄</div>
                <h3 class="text-base font-bold text-gray-800 dark:text-gray-200">Belum Ada Transaksi Berulang</h3>
                <p class="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                  Catat tagihan langganan (Netflix, Wi-Fi, BPJS) atau gaji rutin agar otomatis tercatat sesuai jadwal.
                </p>
                <button
                  @click="openCreateModal"
                  class="mt-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white text-xs font-bold shadow-lg shadow-primary-500/30 active:scale-95 transition-all inline-flex items-center gap-1.5"
                >
                  <span>+ Buat Jadwal Baru</span>
                </button>
              </div>

              <div v-else class="space-y-3.5">
                <div
                  v-for="item in data.data"
                  :key="item.id"
                  class="p-4 border border-gray-100 dark:border-gray-800 rounded-3xl bg-gray-50/50 dark:bg-gray-800/30 hover:border-gray-200 dark:hover:border-gray-700 transition-all relative overflow-hidden"
                  :class="{ 'opacity-60': !item.isActive }"
                >
                  <!-- Card Top -->
                  <div class="flex items-start justify-between gap-3 mb-2.5">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                        :style="{ backgroundColor: (item.categoryColor || '#10b981') + '20', color: item.categoryColor || '#10b981' }"
                      >
                        {{ item.type === 'INCOME' ? '💰' : item.type === 'TRANSFER' ? '🔄' : '💸' }}
                      </div>
                      <div>
                        <h4 class="font-bold text-sm text-gray-800 dark:text-gray-100 leading-tight">
                          {{ item.description || item.category }}
                        </h4>
                        <p class="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                          <span>{{ item.category }}</span>
                          <span>•</span>
                          <span>{{ item.walletFrom || item.walletTo || 'Semua Dompet' }}</span>
                        </p>
                      </div>
                    </div>

                    <!-- Nominal -->
                    <div class="text-right">
                      <span
                        class="font-black text-sm"
                        :class="item.type === 'EXPENSE' ? 'text-rose-500' : item.type === 'INCOME' ? 'text-emerald-500' : 'text-blue-500'"
                      >
                        {{ item.type === 'EXPENSE' ? '-' : item.type === 'INCOME' ? '+' : '' }}{{ formatIDR(item.amount) }}
                      </span>
                      <div class="mt-1">
                        <span
                          class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          :class="item.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400'"
                        >
                          {{ item.isActive ? 'Aktif' : 'Dijeda' }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Interval & Next Schedule Info -->
                  <div class="mt-3 pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-[11px]">
                      <span class="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 font-semibold text-gray-700 dark:text-gray-300">
                        🔄 {{ getIntervalLabel(item.interval) }}
                      </span>
                      <span>Next: <b>{{ new Date(item.nextDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) }}</b></span>
                    </div>

                    <!-- Action buttons -->
                    <div class="flex items-center gap-1.5">
                      <!-- Toggle Pause/Resume -->
                      <button
                        @click="toggleActive(item)"
                        class="p-2 rounded-xl text-xs font-semibold transition-colors"
                        :class="item.isActive ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'"
                        :title="item.isActive ? 'Jeda Jadwal' : 'Aktifkan Jadwal'"
                      >
                        {{ item.isActive ? '⏸️' : '▶️' }}
                      </button>

                      <!-- Edit Button -->
                      <button
                        @click="openEditModal(item)"
                        class="p-2 rounded-xl text-gray-500 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/40 transition-colors"
                        title="Ubah Jadwal"
                      >
                        ✏️
                      </button>

                      <!-- Delete Button -->
                      <button
                        @click="deleteItem(item)"
                        class="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Hapus Jadwal"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Create / Edit Form Modal -->
    <Teleport to="body">
      <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
      >
        <div v-if="isFormOpen" class="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 backdrop-blur-sm px-4 pb-8" @click.self="isFormOpen = false">
          <Transition
              appear
              enter-active-class="transition-all duration-300 cubic-bezier(0.34,1.56,0.64,1)"
              enter-from-class="opacity-0 translate-y-8 scale-95"
              enter-to-class="opacity-100 translate-y-0 scale-100"
              leave-active-class="transition-all duration-200 ease-in"
              leave-from-class="opacity-100 translate-y-0 scale-100"
              leave-to-class="opacity-0 translate-y-4 scale-95"
          >
            <div v-if="isFormOpen" class="w-full max-w-app bg-white dark:bg-surface-900 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
              <div class="flex items-center justify-between mb-5">
                <h2 class="text-base font-bold text-gray-800 dark:text-gray-100">
                  {{ isEditMode ? 'Ubah Transaksi Berulang' : 'Buat Transaksi Berulang' }}
                </h2>
                <button
                  type="button"
                  @click="isFormOpen = false"
                  class="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500"
                >
                  ✕
                </button>
              </div>

              <form @submit.prevent="submitForm" class="space-y-4 text-sm">
                <!-- Tipe Transaksi -->
                <div>
                  <label class="block mb-1 text-xs font-semibold text-gray-500">Tipe Transaksi</label>
                  <div class="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      @click="form.type = 'EXPENSE'"
                      class="py-2.5 rounded-xl font-bold text-xs border transition-all"
                      :class="form.type === 'EXPENSE' ? 'bg-rose-50 border-rose-500 text-rose-600 dark:bg-rose-950/40' : 'border-gray-200 dark:border-gray-800 text-gray-500'"
                    >
                      💸 Pengeluaran
                    </button>
                    <button
                      type="button"
                      @click="form.type = 'INCOME'"
                      class="py-2.5 rounded-xl font-bold text-xs border transition-all"
                      :class="form.type === 'INCOME' ? 'bg-emerald-50 border-emerald-500 text-emerald-600 dark:bg-emerald-950/40' : 'border-gray-200 dark:border-gray-800 text-gray-500'"
                    >
                      💰 Pemasukan
                    </button>
                    <button
                      type="button"
                      @click="form.type = 'TRANSFER'"
                      class="py-2.5 rounded-xl font-bold text-xs border transition-all"
                      :class="form.type === 'TRANSFER' ? 'bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-950/40' : 'border-gray-200 dark:border-gray-800 text-gray-500'"
                    >
                      🔄 Transfer
                    </button>
                  </div>
                </div>

                <!-- Nominal -->
                <div>
                  <label class="block mb-1 text-xs font-semibold text-gray-500">Nominal (Rp)</label>
                  <input
                    type="number"
                    v-model="form.amount"
                    required
                    min="1"
                    placeholder="Contoh: 150000"
                    class="w-full p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 font-bold focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>

                <!-- Deskripsi / Nama Tagihan -->
                <div>
                  <label class="block mb-1 text-xs font-semibold text-gray-500">Keterangan / Nama Tagihan</label>
                  <input
                    type="text"
                    v-model="form.description"
                    required
                    placeholder="Misal: Langganan Netflix, WiFi Rumah, Gaji Bulanan"
                    class="w-full p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>

                <!-- Interval & Tanggal Mulai -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block mb-1 text-xs font-semibold text-gray-500">Interval Rutin</label>
                    <select
                      v-model="form.interval"
                      class="w-full p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
                    >
                      <option value="DAILY">Harian</option>
                      <option value="WEEKLY">Mingguan</option>
                      <option value="MONTHLY">Bulanan</option>
                      <option value="YEARLY">Tahunan</option>
                    </select>
                  </div>

                  <div>
                    <label class="block mb-1 text-xs font-semibold text-gray-500">Mulai Tanggal</label>
                    <input
                      type="date"
                      v-model="form.startDate"
                      required
                      class="w-full p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>
                </div>

                <!-- Kategori -->
                <div>
                  <label class="block mb-1 text-xs font-semibold text-gray-500">Kategori</label>
                  <select
                    v-model="form.categoryId"
                    required
                    class="w-full p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
                  >
                    <option value="" disabled>Pilih Kategori</option>
                    <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">
                      {{ cat.name }}
                    </option>
                  </select>
                </div>

                <!-- Dompet Sumber (EXPENSE & TRANSFER) -->
                <div v-if="form.type === 'EXPENSE' || form.type === 'TRANSFER'">
                  <label class="block mb-1 text-xs font-semibold text-gray-500">Dompet Sumber</label>
                  <select
                    v-model="form.walletFromId"
                    required
                    class="w-full p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
                  >
                    <option value="" disabled>Pilih Dompet</option>
                    <option v-for="w in wallets" :key="w.id" :value="w.id">
                      {{ w.name }} (Saldo: {{ formatIDR(w.balance) }})
                    </option>
                  </select>
                </div>

                <!-- Dompet Tujuan (INCOME & TRANSFER) -->
                <div v-if="form.type === 'INCOME' || form.type === 'TRANSFER'">
                  <label class="block mb-1 text-xs font-semibold text-gray-500">Dompet Tujuan</label>
                  <select
                    v-model="form.walletToId"
                    required
                    class="w-full p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:outline-none font-medium"
                  >
                    <option value="" disabled>Pilih Dompet</option>
                    <option v-for="w in wallets" :key="w.id" :value="w.id">
                      {{ w.name }} (Saldo: {{ formatIDR(w.balance) }})
                    </option>
                  </select>
                </div>

                <!-- Status Aktif Toggle -->
                <div class="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <div>
                    <span class="text-xs font-bold text-gray-800 dark:text-gray-200 block">Jadwal Aktif</span>
                    <span class="text-[11px] text-gray-400 block">Transaksi akan dieksekusi otomatis pada tanggal jatuh tempo</span>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="form.isActive" class="sr-only peer" />
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                <div class="flex gap-3 pt-3">
                  <button
                    type="button"
                    @click="isFormOpen = false"
                    class="flex-1 py-3.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    :disabled="submitting"
                    class="flex-1 py-3.5 rounded-2xl bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/30 hover:bg-primary-600 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {{ submitting ? 'Menyimpan...' : (isEditMode ? 'Simpan Perubahan' : 'Buat Jadwal') }}
                  </button>
                </div>
              </form>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>