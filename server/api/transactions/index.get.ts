// server/api/transactions/index.get.ts
// List transactions with filters, pagination, and search

import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
const query = getQuery(event) as {
    page?: string
    limit?: string
    type?: string
    categoryId?: string
    walletId?: string
    month?: string
    year?: string
    search?: string
  }

  const page = Math.max(1, parseInt(query.page ?? '1'))
  const limit = Math.min(50, Math.max(1, parseInt(query.limit ?? '20')))
  const skip = (page - 1) * limit

  // Build where clause
  const where: any = { userId: user.id }

  if (query.type && ['INCOME', 'EXPENSE', 'TRANSFER'].includes(query.type)) {
    where.type = query.type
  }

  if (query.categoryId) {
    where.categoryId = query.categoryId
  }

  if (query.walletId) {
    where.OR = [
      { walletFromId: query.walletId },
      { walletToId: query.walletId },
    ]
  }

  if (query.month && query.year) {
    const month = parseInt(query.month)
    const year = parseInt(query.year)
    where.date = {
      gte: new Date(year, month - 1, 1, 0, 0, 0, 0),
      lte: new Date(year, month, 0, 23, 59, 59, 999),
    }
  }

  if (query.search?.trim()) {
    const s = query.search.trim()
    where.OR = [
      ...(where.OR ?? []),
      { description: { contains: s, mode: 'insensitive' } },
      { notes: { contains: s, mode: 'insensitive' } },
      { category: { name: { contains: s, mode: 'insensitive' } } },
    ]
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: true,
        walletFrom: true,
        walletTo: true,
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ])

  return {
    ok: true,
    data: transactions.map((tx) => ({
      id: tx.id,
      amount: Number(tx.amount),
      type: tx.type,
      description: tx.description,
      notes: tx.notes,
      date: tx.date.toISOString(),
      category: {
        id: tx.category.id,
        name: tx.category.name,
        icon: tx.category.icon,
        color: tx.category.color,
        type: tx.category.type,
      },
      walletFrom: tx.walletFrom
        ? { id: tx.walletFrom.id, name: tx.walletFrom.name, icon: tx.walletFrom.icon, type: tx.walletFrom.type }
        : null,
      walletTo: tx.walletTo
        ? { id: tx.walletTo.id, name: tx.walletTo.name, icon: tx.walletTo.icon, type: tx.walletTo.type }
        : null,
      // Detail fields
      quantity: tx.quantity,
      unitPrice: tx.unitPrice ? Number(tx.unitPrice) : null,
      // Promo fields
      isPromo: tx.isPromo,
      promoType: tx.promoType,
      promoValue: tx.promoValue ? Number(tx.promoValue) : null,
      promoDetails: tx.promoDetails,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
})
