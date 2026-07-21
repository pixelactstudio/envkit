// @vitest-environment jsdom

import { createElement } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    ...props
  }: React.ComponentProps<"a"> & { to?: string }) =>
    createElement("a", { ...props, href: to }, children),
}))

afterEach(cleanup)

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv("VITE_POSTHOG_KEY", "")
  const storage = new Map<string, string>()
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
      clear: () => storage.clear(),
    },
  })
})

it("offers equally prominent accessible accept and decline controls", async () => {
  const { AnalyticsConsentBanner } = await import("./analytics-consent")
  render(createElement(AnalyticsConsentBanner))

  expect(
    screen.getByRole("region", { name: "Analytics preferences" })
  ).toBeTruthy()
  const accept = screen.getByRole("button", { name: "Accept analytics" })
  const decline = screen.getByRole("button", { name: "Decline" })
  expect(accept.className).toBe(decline.className)
  expect(screen.getByRole("link", { name: "privacy details" })).toBeTruthy()
})

it("lets the privacy controls accept and withdraw analytics", async () => {
  const { AnalyticsConsentControls } = await import("./analytics-consent")
  const { ANALYTICS_CONSENT_KEY } = await import("@/lib/analytics")
  render(createElement(AnalyticsConsentControls))

  fireEvent.click(screen.getByRole("button", { name: "Accept analytics" }))
  expect(window.localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe("accepted")
  expect(screen.getByText(/Current status:/).textContent).toContain("Accepted")

  fireEvent.click(screen.getByRole("button", { name: "Withdraw analytics" }))
  expect(window.localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe("declined")
  expect(screen.getByText(/Current status:/).textContent).toContain("Declined")
})
