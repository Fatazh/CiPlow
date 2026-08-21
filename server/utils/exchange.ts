// server/utils/exchange.ts
// Exchange rate utility with live public API fallback, 24h memory cache & DB history

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

const dynamicRates: Record<string, number> = { ...ratesToUsd }
let lastFetchTime = 0

async function refreshLiveRatesIfNeeded() {
  const now = Date.now()
  if (now - lastFetchTime < 24 * 60 * 60 * 1000) return

  try {
    const res: any = await $fetch('https://open.er-api.com/v6/latest/USD', {
      timeout: 3000,
      retry: 0
    })
    if (res && res.rates) {
      for (const [curr, r] of Object.entries(res.rates)) {
        if (typeof r === 'number') {
          dynamicRates[curr] = r
        }
      }
      lastFetchTime = now
    }
  } catch {
    // Offline or network error -> use existing cached or static rates
  }
}

/**
 * Gets the exchange rate between two currencies.
 * Logic is central here, used by both API and internal server processes.
 */
export async function getExchangeRate(base: string, target: string): Promise<number> {
  if (!base || !target || base === target) return 1

  await refreshLiveRatesIfNeeded()

  let rate = 1
  if (dynamicRates[base] && dynamicRates[target]) {
    rate = (1 / dynamicRates[base]!) * dynamicRates[target]!
  } else {
    // Fallback: try to find the latest rate from DB
    const latest = await prisma.exchangeRate.findFirst({
      where: { baseCurrency: base, targetCurrency: target },
      orderBy: { date: 'desc' }
    })
    if (latest) rate = Number(latest.rate)
  }

  // Log to DB for history (async, non-blocking)
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
  }).catch((err) => console.error('[ExchangeRate Log Error]', err))

  return rate
}
