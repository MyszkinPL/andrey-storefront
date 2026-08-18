import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const handleUpdate = vi.fn()

vi.mock("@/lib/bot", () => ({
  getReadyBot: async () => ({ handleUpdate }),
}))

const SESSION_SECRET = "test-session-secret-at-least-24-chars"

function forgedAdminUpdate() {
  // What an attacker would send: a callback that promotes them to admin,
  // carrying a real admin's Telegram id.
  return {
    update_id: 1,
    callback_query: {
      id: "1",
      from: { id: 7374948454, is_bot: false, first_name: "Admin" },
      data: "ur:clx0987654321abcdefghijkl",
      chat_instance: "1",
    },
  }
}

function post(headers: Record<string, string> = {}) {
  return new Request("https://example.com/api/telegram/webhook", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(forgedAdminUpdate()),
  })
}

describe("telegram webhook authentication", () => {
  beforeEach(() => {
    vi.resetModules()
    handleUpdate.mockClear()
    process.env.SESSION_SECRET = SESSION_SECRET
    delete process.env.TELEGRAM_WEBHOOK_SECRET
  })

  afterEach(() => {
    delete process.env.TELEGRAM_WEBHOOK_SECRET
  })

  it("rejects an update with no secret header", async () => {
    const { POST } = await import("./route")
    const response = await POST(post())

    expect(response.status).toBe(401)
    expect(handleUpdate).not.toHaveBeenCalled()
  })

  it("rejects an update with a wrong secret", async () => {
    const { POST } = await import("./route")
    const response = await POST(
      post({ "x-telegram-bot-api-secret-token": "not-the-secret" }),
    )

    expect(response.status).toBe(401)
    expect(handleUpdate).not.toHaveBeenCalled()
  })

  it("accepts an update carrying the derived secret", async () => {
    const { getWebhookSecret } = await import("@/lib/webhook-secret")
    const { POST } = await import("./route")

    const secret = getWebhookSecret()
    expect(secret).toBeTruthy()

    const response = await POST(
      post({ "x-telegram-bot-api-secret-token": secret as string }),
    )

    expect(response.status).toBe(200)
    expect(handleUpdate).toHaveBeenCalledOnce()
  })

  it("honours an explicitly configured secret", async () => {
    process.env.TELEGRAM_WEBHOOK_SECRET = "explicit-secret"
    const { POST } = await import("./route")

    const response = await POST(
      post({ "x-telegram-bot-api-secret-token": "explicit-secret" }),
    )

    expect(response.status).toBe(200)
    expect(handleUpdate).toHaveBeenCalledOnce()
  })

  it("fails closed when no secret can be derived", async () => {
    delete process.env.SESSION_SECRET
    const { POST } = await import("./route")

    const response = await POST(
      post({ "x-telegram-bot-api-secret-token": "anything" }),
    )

    expect(response.status).toBe(503)
    expect(handleUpdate).not.toHaveBeenCalled()

    process.env.SESSION_SECRET = SESSION_SECRET
  })

  it("still acknowledges when the handler throws, so Telegram stops retrying", async () => {
    handleUpdate.mockRejectedValueOnce(new Error("boom"))
    const { getWebhookSecret } = await import("@/lib/webhook-secret")
    const { POST } = await import("./route")

    const response = await POST(
      post({ "x-telegram-bot-api-secret-token": getWebhookSecret() as string }),
    )

    expect(response.status).toBe(200)
  })
})
