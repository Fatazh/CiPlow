import { GoogleGenAI } from '@google/genai'
import { requireAuth } from '~/server/utils/auth'
import prisma from '~/server/utils/prisma'
import { assertRateLimit } from '~/server/utils/rate-limit'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  assertRateLimit(event, {
    key: 'ai-scan-receipt',
    max: 15,
    windowMs: 60 * 1000,
    message: 'Terlalu banyak permintaan scan struk. Coba beberapa saat lagi.',
  })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: 'GEMINI_API_KEY belum dikonfigurasi di server (.env)',
    })
  }

  const body = await readBody(event)
  if (!body || !body.image) {
    throw createError({
      statusCode: 400,
      message: 'Foto struk (base64 image) wajib diunggah',
    })
  }

  // File size validation (max ~5MB base64)
  if (typeof body.image === 'string' && body.image.length > 7 * 1024 * 1024) {
    throw createError({
      statusCode: 413,
      message: 'Ukuran berkas foto terlalu besar (maksimal 5 MB)',
    })
  }

  // Extract base64 data and mimeType
  // data:image/jpeg;base64,... or raw base64
  let mimeType = 'image/jpeg'
  let base64Data = body.image

  if (body.image.includes(';base64,')) {
    const parts = body.image.split(';base64,')
    mimeType = parts[0].replace('data:', '') || 'image/jpeg'
    base64Data = parts[1]
  }

  // Fetch available categories for this authenticated user only (prevent cross-tenant leak)
  const categories = await prisma.category.findMany({
    where: { userId: user.id },
    select: { id: true, name: true, type: true }
  })
  const categoryNames = categories.map((c) => `${c.name} (${c.type})`).join(', ')

  const prompt = `
Anda adalah asisten AI akuntan keuangan pintar untuk aplikasi pencatat keuangan "CashPlow".
Tugas Anda adalah membaca dan mengekstrak informasi struk / nota belanja / kuitansi kasir dari gambar yang diberikan.

Kategori yang tersedia di aplikasi pengguna:
${categoryNames}

Ekstrak informasi berikut dan kembalikan HANYA dalam format JSON valid sesuai skema berikut:
{
  "merchant": "Nama toko / restoran / merchant (misal: Indomaret, Alfamart, Starbucks, SPBU Pertamina). Jika tidak terbaca, gunakan 'Toko/Merchant'",
  "date": "Tanggal transaksi dalam format YYYY-MM-DD. Jika tahun tidak tertera gunakan tahun ${new Date().getFullYear()}. Jika tanggal tidak terbaca, gunakan tanggal hari ini: ${new Date().toISOString().split('T')[0]}",
  "totalAmount": 0 (Nominal angka total pembayaran akhir/grand total, integer tanpa desimal dan tanpa simbol mata uang),
  "items": [
    {
      "name": "Nama item barang / produk",
      "quantity": 1 (angka jumlah item, minimal 1),
      "unitPrice": 0 (harga per satuan item)
    }
  ],
  "suggestedCategory": "Nama salah satu kategori yang paling cocok dari daftar kategori di atas (hanya namanya saja tanpa tipe, misal: 'Makanan & Minuman' atau 'Belanja Bulanan')",
  "notes": "Catatan singkat rangkuman belanja (opsional)"
}

Catatan:
- Pastikan totalAmount adalah total final yang dibayar.
- Jika ada diskon atau promo yang tertera di struk, sesuaikan total akhir.
- Seluruh angka harus bertipe number (bukan string).
- Kembalikan HANYA objek JSON murni tanpa markdown triple backticks.
`

  try {
    const ai = new GoogleGenAI({ apiKey })

    // Call Gemini 2.5 Flash / 2.0 Flash
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
    })

    const responseText = response.text || ''
    // Clean potential markdown wrap
    const cleanedJson = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    let parsedResult: any
    try {
      parsedResult = JSON.parse(cleanedJson)
    } catch {
      throw createError({
        statusCode: 422,
        message: 'Gagal memproses struktur data dari struk belanja. Coba ambil foto yang lebih jelas/tegak.',
      })
    }

    // Try matching suggestedCategory to actual categoryId in DB
    let matchedCategoryId: string | null = null
    if (parsedResult.suggestedCategory) {
      const match = categories.find((c) =>
        c.name.toLowerCase().includes(parsedResult.suggestedCategory.toLowerCase()) ||
        parsedResult.suggestedCategory.toLowerCase().includes(c.name.toLowerCase())
      )
      if (match) matchedCategoryId = match.id
    }

    return {
      ok: true,
      data: {
        merchant: parsedResult.merchant || 'Belanja',
        date: parsedResult.date || new Date().toISOString().split('T')[0],
        totalAmount: Number(parsedResult.totalAmount) || 0,
        items: Array.isArray(parsedResult.items) ? parsedResult.items : [],
        suggestedCategory: parsedResult.suggestedCategory || '',
        matchedCategoryId,
        notes: parsedResult.notes || '',
      },
    }
  } catch (err: any) {
    console.error('[Gemini Vision Error]', err)
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Gagal membaca struk dengan AI. Pastikan foto struk terlihat jelas.',
    })
  }
})
