import { defineStore } from 'pinia'

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchCategories = async () => {
    loading.value = true
    try {
      const response = await $fetch<any>('/api/categories')
      categories.value = response.data || []
    } catch (e: any) {
      error.value = e.message || 'Gagal memuat kategori'
    } finally {
      loading.value = false
    }
  }

  const incomeCategories = computed(() => categories.value.filter(c => c.type === 'INCOME'))
  const expenseCategories = computed(() => categories.value.filter(c => c.type === 'EXPENSE'))

  return {
    categories,
    loading,
    error,
    fetchCategories,
    incomeCategories,
    expenseCategories
  }
})
