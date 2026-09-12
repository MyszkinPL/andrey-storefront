/**
 * Runs once when the Next.js server starts. The order timer needs something to
 * close orders while nobody is looking at them, and this is the one hook a
 * standalone server offers for that.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return
  // Skip when there is no database to sweep, e.g. a build step.
  if (!process.env.DATABASE_URL) return

  const { startOrderExpirySweep } = await import("@/lib/order-expiry")
  startOrderExpirySweep()
}
