// server/utils/exchange.ts
// Exchange rate utility to avoid internal HTTP calls

import prisma from './prisma'

const ratesToUsd: Record<string, number> = {
  'USD': 1,
  'IDR': 15700,
  'EUR': 0.92,
  'SGD': 1.34,
  'JPY': 150.5,
  'MYR': 4.73,
  'GBP': 0.79,
  'AUD': 1.52,
}

/**
 * Gets the exchange rate between two currencies.
 * Logic is central here, used by both API and internal server processes.
 */
export async function getExchangeRate(base: string, target: string): Promise<number> {
  if (!base || !target || base === target) return 1

  let rate = 1
  if (ratesToUsd[base] && ratesToUsd[target]) {
    rate = (1 / ratesToUsd[base]!) * ratesToUsd[target]!
  } else {
    // Fallback: try to find the latest rate from DB if not in static list
    const latest = await prisma.exchangeRate.findFirst({
      where: { baseCurrency: base, targetCurrency: target },
      orderBy: { date: 'desc' }
    })
    if (latest) rate = Number(latest.rate)
  }

  // Log to DB for history (async, don't wait if not critical)
  prisma.exchangeRate.upsert({
    where: {
      baseCurrency_targetCurrency_date: {
        baseCurrency: base,
        targetCurrency: target,
        date: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
    update: { rate },
    create: {
      baseCurrency: base,
      targetCurrency: target,
      rate,
      date: new Date(new Date().setHours(0, 0, 0, 0)),
    },
  }).catch(err => console.error('[ExchangeRate Log Error]', err))

  return rate
}
