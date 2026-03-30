<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

useHead({ title: "Transaksi Berulang — CashPlow" });
const router = useRouter();

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

const { data, refresh, status } = useFetch<any>('/api/recurring-transactions', {
  key: 'recurring-transactions'
});

const isFormOpen = ref(false);
const form = ref({
  amount: 0,
  type: 'EXPENSE',
  description: '',
  interval: 'MONTHLY',
  startDate: new Date().toISOString().substring(0, 10),
  categoryId: '',
  walletFromId: '',
  walletToId: ''
});

// Mock categories & wallets for simplicity, a real app would fetch these.
const { data: walletsRaw } = useFetch<any>('/api/wallets');
const { data: categoriesRaw } = useFetch<any>('/api/categories');

const wallets = computed(() => walletsRaw.value?.data || []);
const categories = computed(() => {
  return (categoriesRaw.value?.data || []).filter((c: any) => c.type === form.value.type);
});

const submitForm = async () => {
  try {
    await $fetch('/api/recurring-transactions', {
      method: 'POST',
      body: {
        ...form.value,
        amount: Number(form.value.amount),
        startDate: new Date(form.value.startDate).toISOString(),
      }
    });
    isFormOpen.value = false;
    refresh();
  } catch (error: any) {
    alert(error.data?.message || 'Terjadi kesalahan');
  }
};
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
                <button @click="isFormOpen = true" class="w-10 h-10 flex items-center justify-center rounded-2xl bg-primary-50 text-primary-500">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14m-7-7h14"/></svg>
                </button>
              </div>

              <!-- List -->
              <div v-if="status === 'pending'" class="text-center py-8 text-gray-500">Memuat...</div>
              <div v-else-if="!data?.data?.length" class="text-center py-8 text-gray-500">
                Belum ada transaksi berulang.
              </div>
              <div v-else class="space-y-4">
                <div v-for="item in data.data" :key="item.id" class="p-4 border border-gray-100 dark:border-gray-800 rounded-2xl">
                  <div class="flex justify-between items-center mb-2">
                    <span class="font-bold text-gray-800 dark:text-gray-200">{{ item.description || 'Transaksi' }}</span>
                    <span :class="item.type === 'EXPENSE' ? 'text-rose-500' : 'text-primary-500'" class="font-bold">
                      {{ item.type === 'EXPENSE' ? '-' : '+' }}{{ item.amount.toLocaleString('id-ID') }}
                    </span>
                  </div>
                  <div class="text-xs text-gray-500 mb-1">Interval: <b>{{ item.interval }}</b> • Mulai: {{ new Date(item.nextDate).toLocaleDateString('id-ID') }}</div>
                  <div class="text-xs text-gray-500">Kategori: {{ item.category }}</div>
                  <div class="text-xs text-gray-500">Status: <span :class="item.isActive ? 'text-primary-500' : 'text-gray-400'">{{ item.isActive ? 'Aktif' : 'Tidak Aktif' }}</span></div>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>

    <!-- Create Form Modal -->
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
              <h2 class="text-lg font-bold mb-4">Buat Transaksi Berulang</h2>
              <form @submit.prevent="submitForm" class="space-y-4 text-sm">
                <div>
                  <label class="block mb-1 text-gray-500">Tipe</label>
                  <select v-model="form.type" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none">
                    <option value="EXPENSE">Pengeluaran</option>
                    <option value="INCOME">Pemasukan</option>
                  </select>
                </div>
                <div>
                  <label class="block mb-1 text-gray-500">Nominal</label>
                  <input type="number" v-model="form.amount" required class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none" />
                </div>
                <div>
                  <label class="block mb-1 text-gray-500">Deskripsi</label>
                  <input type="text" v-model="form.description" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none" />
                </div>
                <div>
                  <label class="block mb-1 text-gray-500">Interval</label>
                  <select v-model="form.interval" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none">
                    <option value="DAILY">Harian</option>
                    <option value="WEEKLY">Mingguan</option>
                    <option value="MONTHLY">Bulanan</option>
                    <option value="YEARLY">Tahunan</option>
                  </select>
                </div>
                <div>
                  <label class="block mb-1 text-gray-500">Tanggal Mulai</label>
                  <input type="date" v-model="form.startDate" required class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none" />
                </div>
                <div>
                  <label class="block mb-1 text-gray-500">Kategori</label>
                  <select v-model="form.categoryId" required class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none">
                    <option value="" disabled>Pilih Kategori</option>
                    <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                  </select>
                </div>
                <div v-if="form.type === 'EXPENSE'">
                  <label class="block mb-1 text-gray-500">Dompet Sumber</label>
                  <select v-model="form.walletFromId" required class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none">
                    <option value="" disabled>Pilih Dompet</option>
                    <option v-for="w in wallets" :key="w.id" :value="w.id">{{ w.name }}</option>
                  </select>
                </div>
                <div v-if="form.type === 'INCOME'">
                  <label class="block mb-1 text-gray-500">Dompet Tujuan</label>
                  <select v-model="form.walletToId" required class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none">
                    <option value="" disabled>Pilih Dompet</option>
                    <option v-for="w in wallets" :key="w.id" :value="w.id">{{ w.name }}</option>
                  </select>
                </div>

                <div class="flex gap-3 mt-6">
                  <button type="button" @click="isFormOpen = false" class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700">Batal</button>
                  <button type="submit" class="flex-1 py-3 rounded-xl bg-primary-500 text-white font-bold">Simpan</button>
                </div>
              </form>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>