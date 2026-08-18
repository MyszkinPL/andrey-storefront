import { createHash, createHmac, timingSafeEqual } from "node:crypto"

import { prisma } from "@/lib/prisma"

type CreateCryptoInvoiceInput = {
  amountRub: number
  description: string
  acceptedAssets?: string | null
}

type CryptoInvoice = {
  invoiceId: string
  url: string
  status: string
  asset: string | null
  amount: string | null
  expiresAt: Date | null
}

type CryptoCurrency = {
  code: string
  name: string
  isFiat: boolean
}

export type CryptoPayInvoicePayload = {
  invoice_id: number | string
  status?: string
  bot_invoice_url?: string
  mini_app_invoice_url?: string
  paid_asset?: string
  paid_amount?: string
  amount?: string
  expiration_date?: string
}

export type CryptoPayWebhookUpdate = {
  update_id: number
  update_type: string
  request_date: string
  payload: CryptoPayInvoicePayload
}

function getBaseUrl(useTestnet: boolean) {
  return useTestnet ? "https://testnet-pay.crypt.bot/api" : "https://pay.crypt.bot/api"
}

const currencyCache = new Map<string, { expiresAt: number; items: CryptoCurrency[] }>()

async function cryptoPayFetch<T>(
  method: string,
  init: RequestInit,
  token: string,
  useTestnet: boolean,
) {
  const response = await fetch(`${getBaseUrl(useTestnet)}/${method}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Crypto-Pay-API-Token": token,
      ...(init.headers || {}),
    },
    cache: "no-store",
  })

  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; result?: T; error?: { name?: string; code?: number } }
    | null

  if (!response.ok || !payload?.ok || !payload.result) {
    throw new Error(payload?.error?.name || `Crypto Pay ${method} failed`)
  }

  return payload.result
}

export async function createCryptoInvoice(
  input: CreateCryptoInvoiceInput,
): Promise<CryptoInvoice | null> {
  const settings = await prisma.shopSettings.findUnique({ where: { id: 1 } })
  if (!settings?.cryptoPayEnabled || !settings.cryptoPayToken) return null

  const result = await cryptoPayFetch<{
    invoice_id: number | string
    bot_invoice_url: string
    status: string
    accepted_assets?: string[]
    mini_app_invoice_url?: string
    amount?: string
    expiration_date?: string
  }>(
    "createInvoice",
    {
      method: "POST",
      body: JSON.stringify({
        amount: input.amountRub,
        currency_type: "fiat",
        fiat: settings.cryptoPayFiat || "RUB",
        accepted_assets:
          input.acceptedAssets || settings.cryptoPayDefaultAssets || undefined,
        description: input.description.slice(0, 200),
      }),
    },
    settings.cryptoPayToken,
    settings.cryptoPayUseTestnet,
  )

  return {
    invoiceId: String(result.invoice_id),
    url: result.mini_app_invoice_url || result.bot_invoice_url,
    status: result.status,
    asset: result.accepted_assets?.join(", ") || null,
    amount: result.amount || null,
    expiresAt: result.expiration_date ? new Date(result.expiration_date) : null,
  }
}

export async function getCryptoInvoice(invoiceId: string) {
  const settings = await prisma.shopSettings.findUnique({ where: { id: 1 } })
  if (!settings?.cryptoPayEnabled || !settings.cryptoPayToken) return null

  const query = new URLSearchParams({ invoice_ids: invoiceId })
  const result = await cryptoPayFetch<
    Array<{
      invoice_id: number | string
      status: string
      bot_invoice_url?: string
      mini_app_invoice_url?: string
      paid_asset?: string
      paid_amount?: string
      amount?: string
      expiration_date?: string
    }>
  >(
    `getInvoices?${query.toString()}`,
    { method: "GET" },
    settings.cryptoPayToken,
    settings.cryptoPayUseTestnet,
  )

  const invoice = result[0]
  if (!invoice) return null

  return {
    invoiceId: String(invoice.invoice_id),
    url: invoice.mini_app_invoice_url || invoice.bot_invoice_url || null,
    status: invoice.status,
    asset: invoice.paid_asset || null,
    amount: invoice.paid_amount || invoice.amount || null,
    expiresAt: invoice.expiration_date ? new Date(invoice.expiration_date) : null,
  }
}

export async function getCryptoPayCurrencies(options?: {
  token?: string | null
  useTestnet?: boolean
}): Promise<CryptoCurrency[]> {
  const settings = options?.token
    ? null
    : await prisma.shopSettings.findUnique({ where: { id: 1 } })
  const token = options?.token || settings?.cryptoPayToken
  const useTestnet = options?.useTestnet ?? settings?.cryptoPayUseTestnet ?? false

  if (!token) return []

  const cacheKey = `${useTestnet}:${token}`
  const cached = currencyCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.items
  }

  const result = await cryptoPayFetch<
    Array<{
      code?: string
      name?: string
      is_fiat?: boolean
      isFiat?: boolean
    }>
  >("getCurrencies", { method: "GET" }, token, useTestnet)

  const items = result
    .map((currency) => ({
      code: (currency.code || "").trim().toUpperCase(),
      name: (currency.name || currency.code || "").trim(),
      isFiat: Boolean(currency.is_fiat ?? currency.isFiat),
    }))
    .filter((currency) => currency.code.length > 0)
    .sort((left, right) => left.code.localeCompare(right.code))

  currencyCache.set(cacheKey, {
    expiresAt: Date.now() + 5 * 60 * 1000,
    items,
  })

  return items
}

const ratesCache = new Map<string, { expiresAt: number; rates: Map<string, number> }>()

/**
 * Estimates how much of a crypto asset a fiat price is worth, for payment
 * button labels. Rates are cached for a minute; any failure returns null so
 * the button falls back to a plain label instead of blocking the card.
 */
export async function estimateCryptoAmount(input: {
  amountFiat: number
  asset: string
  fiat?: string | null
  token: string
  useTestnet: boolean
}): Promise<number | null> {
  const fiat = (input.fiat || "RUB").toUpperCase()
  const cacheKey = `${input.useTestnet}:${fiat}`

  let cached = ratesCache.get(cacheKey)
  if (!cached || cached.expiresAt <= Date.now()) {
    try {
      const result = await cryptoPayFetch<
        Array<{
          is_valid?: boolean
          source?: string
          target?: string
          rate?: string
        }>
      >("getExchangeRates", { method: "GET" }, input.token, input.useTestnet)

      const rates = new Map<string, number>()
      for (const entry of result) {
        if (!entry.is_valid || entry.target?.toUpperCase() !== fiat) continue
        const rate = Number(entry.rate)
        if (entry.source && Number.isFinite(rate) && rate > 0) {
          rates.set(entry.source.toUpperCase(), rate)
        }
      }

      cached = { expiresAt: Date.now() + 60_000, rates }
      ratesCache.set(cacheKey, cached)
    } catch {
      return null
    }
  }

  const rate = cached.rates.get(input.asset.toUpperCase())
  return rate ? input.amountFiat / rate : null
}

export function mapCryptoInvoicePayload(invoice: CryptoPayInvoicePayload) {
  return {
    invoiceId: String(invoice.invoice_id),
    url: invoice.mini_app_invoice_url || invoice.bot_invoice_url || null,
    status: invoice.status || null,
    asset: invoice.paid_asset || null,
    amount: invoice.paid_amount || invoice.amount || null,
    expiresAt: invoice.expiration_date ? new Date(invoice.expiration_date) : null,
  }
}

export function verifyCryptoPaySignature(
  token: string,
  rawBody: string,
  signatureHeader: string | null,
) {
  if (!signatureHeader) return false

  const secret = createHash("sha256").update(token).digest()
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex")
  const signature = signatureHeader.trim().toLowerCase()

  if (digest.length !== signature.length) return false

  return timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}
