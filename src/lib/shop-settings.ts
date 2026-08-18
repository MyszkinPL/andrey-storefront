import { prisma } from "@/lib/prisma"

let cached: { at: number; currency: string } | null = null

/**
 * The shop's fiat currency. cryptoPayFiat doubles as the currency prices are
 * entered in: invoices send the stored amount with this fiat code, so every
 * price label must follow it too. Cached briefly — the bot renders several
 * price labels per update.
 */
export async function getShopCurrency() {
  if (cached && Date.now() - cached.at < 30_000) return cached.currency

  const settings = await prisma.shopSettings.findUnique({ where: { id: 1 } })
  const currency = settings?.cryptoPayFiat?.trim().toUpperCase() || "RUB"
  cached = { at: Date.now(), currency }
  return currency
}
