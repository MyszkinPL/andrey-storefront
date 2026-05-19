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

function getBaseUrl(useTestnet: boolean) {
  return useTestnet ? "https://testnet-pay.crypt.bot/api" : "https://pay.crypt.bot/api"
}

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
