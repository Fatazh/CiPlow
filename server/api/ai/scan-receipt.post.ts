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
Tugas Anda adalah membaca dan mengekstrak informasi struk belanja, nota cetak kasir minimarket/supermarket, nota bon warung TULIS TANGAN, atau kuitansi pembayaran dari gambar yang diberikan.

Kategori yang tersedia di aplikasi pengguna:
${categoryNames}

Panduan Khusus Nota / Struk Tulis Tangan:
- Bacalah tulisan tangan dengan cermat (nama toko/warung, nama barang/makanan, jumlah, harga per satuan, dan total akhir).
- Jika ada angka yang dicoret, gunakan angka koreksi terbaru atau total akhir yang tertera.
- Jika nama toko tidak tertulis di nota tulis tangan, gunakan 'Warung/Toko' atau nama yang relevan dari catatan.
- Jika gambar benar-benar buram, kosong, atau tidak berisi struk/transaksi apapun sama sekali sehingga tidak dapat dibaca, kembalikan JSON: { "error": "UNREADABLE", "reason": "Foto tidak terbaca atau bukan struk" }

Ekstrak informasi berikut dan kembalikan HANYA dalam format JSON valid:
{
  "merchant": "Nama toko / warung / restoran / merchant",
  "date": "Tanggal transaksi dalam format YYYY-MM-DD. Jika tahun tidak tertera gunakan tahun ${new Date().getFullYear()}. Jika tanggal tidak terbaca, gunakan tanggal hari ini: ${new Date().toISOString().split('T')[0]}",
  "totalAmount": 0 (Nominal angka total pembayaran akhir/grand total, integer number tanpa desimal dan tanpa simbol mata uang),
  "items": [
    {
      "name": "Nama item barang / menu / jasa",
      "quantity": 1 (angka jumlah item, number minimal 1),
      "unitPrice": 0 (harga per satuan item, number)
    }
  ],
  "suggestedCategory": "Nama salah satu kategori yang paling cocok dari daftar kategori di atas (hanya namanya saja tanpa tipe, misal: 'Makanan & Minuman' atau 'Belanja Bulanan')",
  "notes": "Catatan singkat rangkuman belanja (opsional)"
}

Catatan Penting:
- Seluruh angka nominal harus bertipe number (bukan string).
- Kembalikan HANYA objek JSON murni tanpa markdown triple backticks atau teks pengantar apapun.
`

  try {
    const ai = new GoogleGenAI({ apiKey })

    // Call Gemini 3.6 Flash with fallback to gemini-flash-latest
    let responseText = ''
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
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
      responseText = response.text || ''
    } catch (primaryErr: any) {
      console.warn('[Gemini 3.6 Flash scan failed, trying gemini-flash-latest fallback]', primaryErr?.message)
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-flash-latest',
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
      responseText = fallbackResponse.text || ''
    }

    // Extract JSON block using regex if model included preamble
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw createError({
        statusCode: 422,
        message: 'Struk atau tulisan tangan tidak dapat dibaca oleh AI. Pastikan foto struk memiliki pencahayaan terang dan tulisan yang jelas, atau catat transaksi secara manual.',
      })
    }

    let parsedResult: any
    try {
      parsedResult = JSON.parse(jsonMatch[0])
    } catch {
      throw createError({
        statusCode: 422,
        message: 'Struk atau tulisan tangan tidak dapat dibaca oleh AI. Pastikan foto struk memiliki pencahayaan terang dan tulisan yang jelas, atau catat transaksi secara manual.',
      })
    }

    if (parsedResult.error === 'UNREADABLE' || (Number(parsedResult.totalAmount) <= 0 && (!parsedResult.items || parsedResult.items.length === 0))) {
      throw createError({
        statusCode: 422,
        message: 'Struk atau tulisan tangan tidak dapat dibaca oleh AI. Pastikan foto struk memiliki pencahayaan terang dan tulisan yang jelas, atau catat transaksi secara manual.',
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
    if (err.statusCode) throw err

    let userMsg = 'Struk atau tulisan tangan tidak dapat dibaca oleh AI. Pastikan foto struk terlihat jelas, atau catat secara manual.'
    if (err?.message) {
      try {
        const parsed = typeof err.message === 'string' && err.message.trim().startsWith('{') ? JSON.parse(err.message) : null
        if (parsed?.error?.message) {
          userMsg = parsed.error.message
        }
      } catch {
        // use default
      }
    }
    throw createError({
      statusCode: err.statusCode || 422,
      message: userMsg,
    })
  }
})
