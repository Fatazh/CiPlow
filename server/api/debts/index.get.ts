// server/api/debts/index.get.ts
// Get all debts & loans for the authenticated user

import prisma from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const type = query.type ? String(query.type).toUpperCase() : undefined

  const debts = await prisma.debt.findMany({
    where: {
      userId: user.id,
      ...(type && ['LEND', 'BORROW'].includes(type) && { type: type as any }),
    },
    include: {
      payments: {
        orderBy: { date: 'desc' },
        include: { wallet: true },
      },
    },
    orderBy: [
      { status: 'asc' }, // UNPAID & PARTIAL first
      { createdAt: 'desc' },
    ],
  })

  let totalLend = 0 // Piutang (uang kita di orang lain)
  let totalBorrow = 0 // Hutang (uang orang lain di kita)
  let totalLendRemaining = 0
  let totalBorrowRemaining = 0

  const items = debts.map((d) => {
    const total = Number(d.totalAmount)
    const paid = Number(d.paidAmount)
    const remaining = Math.max(0, total - paid)
    const percentage = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0

    if (d.type === 'LEND') {
      totalLend += total
      totalLendRemaining += remaining
    } else {
      totalBorrow += total
      totalBorrowRemaining += remaining
    }

    return {
      id: d.id,
      type: d.type,
      personName: d.personName,
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: remaining,
      percentage,
      dueDate: d.dueDate ? d.dueDate.toISOString().split('T')[0] : null,
      notes: d.notes,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
      payments: d.payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        date: p.date.toISOString(),
        notes: p.notes,
        walletName: p.wallet?.name ?? null,
      })),
    }
  })

  return {
    ok: true,
    data: {
      items,
      summary: {
        totalLend, // Total Piutang
        totalLendRemaining, // Sisa Piutang yang belum balik
        totalBorrow, // Total Hutang
        totalBorrowRemaining, // Sisa Hutang yang harus dibayar
      },
    },
  }
})
