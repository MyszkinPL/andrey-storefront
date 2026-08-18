import { describe, expect, it } from "vitest"

import { ApiFailure, errorResponse, failure } from "@/lib/api-error"

describe("ApiFailure", () => {
  it("derives the HTTP status from the code", () => {
    expect(new ApiFailure("UNAUTHORIZED", "x").status).toBe(401)
    expect(new ApiFailure("BANNED", "x").status).toBe(403)
    expect(new ApiFailure("USERNAME_REQUIRED", "x").status).toBe(403)
    expect(new ApiFailure("NOT_FOUND", "x").status).toBe(404)
    expect(new ApiFailure("ORDER_STATE", "x").status).toBe(409)
  })

  it("lets a caller override the status", () => {
    expect(new ApiFailure("VALIDATION", "x", 422).status).toBe(422)
  })

  it("gives banned and username-required the same status but different codes", () => {
    // This is the pair the auth gate has to tell apart; by status alone it
    // cannot, which is exactly how it used to trap users.
    const banned = new ApiFailure("BANNED", "x")
    const username = new ApiFailure("USERNAME_REQUIRED", "y")

    expect(banned.status).toBe(username.status)
    expect(banned.code).not.toBe(username.code)
  })
})

describe("failure", () => {
  it("renders the message in the reader's language", () => {
    expect(failure("ORDER_LIMIT", "en", "errors.orderLimit").message).toBe(
      "Limit: no more than 2 active orders per account.",
    )
    expect(failure("ORDER_LIMIT", "ru", "errors.orderLimit").message).toContain(
      "Лимит",
    )
  })
})

describe("errorResponse", () => {
  it("carries the code alongside the message", async () => {
    const response = errorResponse(new ApiFailure("ORDER_STATE", "closed"))

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      code: "ORDER_STATE",
      error: "closed",
    })
  })

  it("labels an unexpected throw as UNKNOWN rather than leaking a status", async () => {
    const response = errorResponse(new Error("boom"))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      code: "UNKNOWN",
      error: "boom",
    })
  })

  it("survives a non-Error being thrown", async () => {
    const response = errorResponse("just a string")

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({ code: "UNKNOWN" })
  })
})
