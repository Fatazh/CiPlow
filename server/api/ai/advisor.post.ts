// server/api/ai/advisor.post.ts
// AI Financial Advisor powered by Google Gemini

import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

const advisorQuerySchema = z.object({
  topic: z.enum(['OVERVIEW', 'EXPENSE_OPTIMIZATION', 'SAVINGS_STRATEGY', 'DEBT_MANAGEMENT']).default('OVERVIEW'),
  customPrompt: z.string().optional().nullable(),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: 'GEMINI_API_KEY belum dikonfigurasi di file server (.env)',
    })
  }

  const result = await readValidatedBody(event, (body) => advisorQuerySchema.safeParse(body))
  const { topic, customPrompt } = result.success ? result.data : { topic: 'OVERVIEW', customPrompt: null }

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const startOfMonth = new Date(currentYear, currentMonth - 1, 1)
  const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59)

  // Fetch actual user financial data
  const [transactions, budgets, savingsGoals, debts, wallets] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        userId: user.id,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { category: true },
      orderBy: { date: 'desc' },
    }),
    prisma.budget.findMany({
      where: { userId: user.id, month: currentMonth, year: currentYear },
      include: { category: true },
    }),
    prisma.savingsGoal.findMany({
      where: { userId: user.id },
    }),
    prisma.debt.findMany({
      where: { userId: user.id },
    }),
    prisma.wallet.findMany({
      where: { userId: user.id },
    }),
  ])

  // Summarize numbers
  let totalIncome = 0
  let totalExpense = 0
  const categorySpendMap: Record<string, number> = {}

  for (const tx of transactions) {
    const amt = Number(tx.amount)
    if (tx.type === 'INCOME') {
      totalIncome += amt
    } else if (tx.type === 'EXPENSE') {
      totalExpense += amt
      const cat = tx.category.name
      categorySpendMap[cat] = (categorySpendMap[cat] || 0) + amt
    }
  }

  const netSavings = totalIncome - totalExpense
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0

  const topCategories = Object.entries(categorySpendMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, amt]) => `${cat}: Rp ${amt.toLocaleString('id-ID')}`)

  const totalWalletBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0)
  const totalDebtsUnpaid = debts
    .filter((d) => d.type === 'BORROW' && d.status !== 'PAID')
    .reduce((sum, d) => sum + (Number(d.totalAmount) - Number(d.paidAmount)), 0)
  const totalReceivablesUnpaid = debts
    .filter((d) => d.type === 'LEND' && d.status !== 'PAID')
    .reduce((sum, d) => sum + (Number(d.totalAmount) - Number(d.paidAmount)), 0)

  // Construct context for Gemini
  const financialContext = `
Data Keuangan Pengguna (${user.name}) untuk Bulan ${currentMonth}/${currentYear}:
- Total Saldo di Seluruh Dompet: Rp ${totalWalletBalance.toLocaleString('id-ID')}
- Total Pemasukan Bulan Ini: Rp ${totalIncome.toLocaleString('id-ID')}
- Total Pengeluaran Bulan Ini: Rp ${totalExpense.toLocaleString('id-ID')}
- Arus Kas Bersih (Net Cashflow): Rp ${netSavings.toLocaleString('id-ID')}
- Rasio Tabungan (Savings Rate): ${savingsRate}%
- Top 5 Pengeluaran Kategori: ${topCategories.length ? topCategories.join(', ') : 'Belum ada data'}
- Anggaran Aktif: ${budgets.map((b) => `${b.category.name} (Terpakai Rp ${Number(b.spent).toLocaleString('id-ID')} dari limit Rp ${Number(b.amount).toLocaleString('id-ID')})`).join(', ') || 'Belum diatur'}
- Target Tabungan: ${savingsGoals.map((s) => `${s.name} (Terkumpul Rp ${Number(s.currentAmount).toLocaleString('id-ID')} / Target Rp ${Number(s.targetAmount).toLocaleString('id-ID')})`).join(', ') || 'Belum ada target'}
- Sisa Hutang yang Harus Dibayar: Rp ${totalDebtsUnpaid.toLocaleString('id-ID')}
- Sisa Piutang yang Harus Ditagih: Rp ${totalReceivablesUnpaid.toLocaleString('id-ID')}
`

  let focusInstruction = ''
  if (topic === 'EXPENSE_OPTIMIZATION') {
    focusInstruction = 'Fokuskan analisis pada cara memangkas pengeluaran di kategori terbesar dan pengeluaran impulsif.'
  } else if (topic === 'SAVINGS_STRATEGY') {
    focusInstruction = 'Fokuskan saran pada strategi mempercepat pencapaian target tabungan dan mengalokasikan arus kas surplus.'
  } else if (topic === 'DEBT_MANAGEMENT') {
    focusInstruction = 'Fokuskan rekomendasi pada strategi pelunasan hutang (metode snowball/avalanche) dan penagihan piutang aktif.'
  } else {
    focusInstruction = 'Berikan evaluasi menyeluruh mengenai kesehatan finansial, skor kesehatan (1-100), poin kelebihan, dan 3 langkah aksi konkret minggu ini.'
  }

  const prompt = `
Anda adalah "CashPlow AI Financial Advisor", seorang konsultan perencana keuangan pribadi profesional (CFP) yang ramah, bijak, solutif, dan realistis untuk pengguna di Indonesia.

${financialContext}

Topik Konsultasi: ${topic}
${customPrompt ? `Pertanyaan Khusus Pengguna: "${customPrompt}"` : ''}
${focusInstruction}

Panduan Jawaban:
1. Gunakan Bahasa Indonesia yang hangat, bersahabat, namun lugas dan berbasis angka nyata di atas.
2. Gunakan format Markdown yang indah (gunakan bullet points, bold untuk angka nominal, dan emoji yang relevan).
3. Berikan saran yang dapat langsung diterapkan (Actionable Steps), bukan sekadar teori umum.
4. Buat respon ringkas, padat, dan nyaman dibaca di layar smartphone (maksimal 3-4 paragraf/bagian).
`

  try {
    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    })

    const advice = response.text || 'Tidak dapat memproses rekomendasi saat ini. Silakan coba kembali.'

    return {
      ok: true,
      topic,
      savingsRate,
      advice,
    }
  } catch (err: any) {
    console.error('[Gemini Advisor Error]', err)
    throw createError({
      statusCode: 500,
      message: err.message || 'Gagal menghasilkan analisis AI. Coba beberapa saat lagi.',
    })
  }
})
