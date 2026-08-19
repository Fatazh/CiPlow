export default defineEventHandler(async (event) => {
  const query = getQuery(event) as { base?: string; target?: string };
  const baseCurrency = query.base || "USD";
  const targetCurrency = query.target || "IDR";

  const rate = await getExchangeRate(baseCurrency, targetCurrency);
  return { ok: true, rate };
});
