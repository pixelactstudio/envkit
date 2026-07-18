// @vitest-environment jsdom

import { expect, it, vi } from "vitest"

import { copyText } from "./clipboard"

it("falls back to document copy on non-secure local URLs", async () => {
  Object.defineProperty(window, "isSecureContext", { value: false })
  document.execCommand = vi.fn(() => true)

  await expect(copyText("LOCAL_ONLY=yes")).resolves.toBeUndefined()
  expect(document.execCommand).toHaveBeenCalledWith("copy")
})
