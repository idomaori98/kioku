const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // refresh a few times a day

let cachedRates = null
let cachedAt = 0

async function fetchRates() {
  const res = await fetch('https://open.er-api.com/v6/latest/JPY')
  if (!res.ok) throw new Error(`Exchange rate API failed (${res.status})`)
  const data = await res.json()
  if (data.result !== 'success') throw new Error('Exchange rate API returned an error')
  return data.rates
}

// Rate is JPY -> homeCurrency, e.g. 0.0067 means 1 JPY = 0.0067 USD.
export async function getJpyRate(homeCurrency) {
  const now = Date.now()
  if (!cachedRates || now - cachedAt > CACHE_TTL_MS) {
    cachedRates = await fetchRates()
    cachedAt = now
  }
  const rate = cachedRates[homeCurrency.toUpperCase()]
  if (!rate) throw new Error(`No exchange rate available for ${homeCurrency}`)
  return rate
}
