import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event) as { base?: string; target?: string }
  const baseCurrency = query.base || 'USD'
  const targetCurrency = query.target || 'IDR'

  if (baseCurrency === targetCurrency) return { ok: true, rate: 1 }

  // Comprehensive Mock implementation for exchange rates.
  // Base rates relative to 1 USD
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

  let rate = 1
  if (ratesToUsd[baseCurrency] && ratesToUsd[targetCurrency]) {
    // Cross rate formula: (1/Base_Rate) * Target_Rate
    // e.g. IDR to USD: (1/15700) * 1 = 0.000063...
    // e.g. USD to IDR: (1/1) * 15700 = 15700
    // e.g. EUR to IDR: (1/0.92) * 15700 = 17065.2...
    rate = (1 / ratesToUsd[baseCurrency]!) * ratesToUsd[targetCurrency]!
  }

  // Save the retrieved rate into the database for history
  await prisma.exchangeRate.upsert({
    where: {
      baseCurrency_targetCurrency_date: {
        baseCurrency,
        targetCurrency,
        date: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    },
    update: { rate },
    create: {
      baseCurrency,
      targetCurrency,
      rate,
      date: new Date(new Date().setHours(0, 0, 0, 0)),
    },
  })

  return { ok: true, rate }
})