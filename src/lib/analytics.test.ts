// @vitest-environment jsdom

import { createElement, useEffect } from "react"
import { act, render, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({ imports: 0 }))
const posthog = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  set_config: vi.fn(),
  opt_in_capturing: vi.fn(),
  opt_out_capturing: vi.fn(),
  reset: vi.fn(),
}))

vi.mock("posthog-js", () => {
  state.imports += 1
  return { default: posthog }
})

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv("VITE_POSTHOG_KEY", "phc_test")
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
  state.imports = 0
  Object.values(posthog).forEach((mock) => mock.mockClear())
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

it("does not load or capture analytics before consent", async () => {
  const { Analytics, useAnalytics } = await import("./analytics")

  function Capture() {
    const track = useAnalytics()
    useEffect(() => track("tool opened", { tool: "inspect" }), [track])
    return null
  }

  render(createElement(Analytics))
  render(createElement(Capture))
  await vi.dynamicImportSettled()

  expect(state.imports).toBe(0)
  expect(posthog.init).not.toHaveBeenCalled()
  expect(posthog.capture).not.toHaveBeenCalled()
})

it("persists a decline without loading PostHog", async () => {
  const { ANALYTICS_CONSENT_KEY, setAnalyticsConsent } =
    await import("./analytics")

  setAnalyticsConsent("declined", "banner")
  await vi.dynamicImportSettled()

  expect(window.localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe("declined")
  expect(state.imports).toBe(0)
  expect(posthog.init).not.toHaveBeenCalled()
})

it("persists acceptance, initializes PostHog, and permits capture", async () => {
  const { ANALYTICS_CONSENT_KEY, setAnalyticsConsent, useAnalytics } =
    await import("./analytics")

  setAnalyticsConsent("accepted", "banner")
  await waitFor(() => expect(posthog.init).toHaveBeenCalledOnce())
  expect(window.localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe("accepted")
  expect(posthog.opt_in_capturing).toHaveBeenCalledWith({
    captureEventName: false,
  })
  expect(posthog.capture).toHaveBeenCalledWith("analytics consent accepted", {
    source: "banner",
  })

  function Capture() {
    const track = useAnalytics()
    useEffect(() => track("tool opened", { tool: "compare" }), [track])
    return null
  }

  render(createElement(Capture))
  await waitFor(() =>
    expect(posthog.capture).toHaveBeenCalledWith("tool opened", {
      tool: "compare",
    })
  )
})

it("discards events emitted before acceptance", async () => {
  const { setAnalyticsConsent, useAnalytics } = await import("./analytics")

  function Capture() {
    const track = useAnalytics()
    useEffect(() => track("tool opened", { tool: "format" }), [track])
    return null
  }

  render(createElement(Capture))
  setAnalyticsConsent("accepted", "privacy")
  await waitFor(() => expect(posthog.init).toHaveBeenCalledOnce())

  expect(posthog.capture).not.toHaveBeenCalledWith("tool opened", {
    tool: "format",
  })
})

it("withdraws consent, clears analytics state, and blocks later events", async () => {
  const { setAnalyticsConsent, useAnalytics } = await import("./analytics")
  setAnalyticsConsent("accepted", "privacy")
  await waitFor(() => expect(posthog.init).toHaveBeenCalledOnce())

  setAnalyticsConsent("declined", "privacy")
  await waitFor(() => expect(posthog.opt_out_capturing).toHaveBeenCalledOnce())
  expect(posthog.reset).toHaveBeenCalledWith(true)
  expect(posthog.reset.mock.invocationCallOrder[0]).toBeLessThan(
    posthog.opt_out_capturing.mock.invocationCallOrder[0]
  )

  posthog.capture.mockClear()
  function Capture() {
    const track = useAnalytics()
    useEffect(() => track("output copied", { tool: "example" }), [track])
    return null
  }
  render(createElement(Capture))
  await vi.dynamicImportSettled()
  expect(posthog.capture).not.toHaveBeenCalled()
})

it("keeps only privacy-safe manual, route, and navigation properties", async () => {
  const { fileCountBucket, POSTHOG_OPTIONS, variableCountBucket } =
    await import("./analytics")
  const config = POSTHOG_OPTIONS as Record<string, unknown>
  const beforeSend = config.before_send as (event: {
    event: string
    properties: Record<string, unknown>
  }) => { event: string; properties: Record<string, unknown> } | null

  expect(fileCountBucket(4)).toBe("3+")
  expect(variableCountBucket(77)).toBe("51-100")
  expect(config).toMatchObject({
    capture_pageview: "history_change",
    capture_pageleave: true,
    capture_dead_clicks: false,
    capture_exceptions: false,
    capture_heatmaps: true,
    disable_session_recording: true,
    disable_surveys: true,
    mask_all_text: true,
    respect_dnt: true,
  })

  expect(
    beforeSend({
      event: "tool completed",
      properties: {
        token: "phc_test",
        distinct_id: "anonymous-user",
        tool: "format",
        variable_count: "2-10",
        result: "success",
        $session_id: "session-id",
        $current_url:
          "https://envsift.damnlabs.com/format?secret=value#toolbar",
        $pathname: "/format?secret=value",
        $browser: "Chrome",
        editor_state: "SECRET=value",
        $raw_user_agent: "sensitive-user-agent",
      },
    })
  ).toEqual({
    event: "tool completed",
    properties: {
      token: "phc_test",
      distinct_id: "anonymous-user",
      $session_id: "session-id",
      $current_url: "https://envsift.damnlabs.com/format",
      $pathname: "/format",
      $browser: "Chrome",
      $geoip_disable: true,
      tool: "format",
      variable_count: "2-10",
      result: "success",
      route: "/format",
      page_kind: "tool",
    },
  })

  expect(
    beforeSend({
      event: "$autocapture",
      properties: {
        token: "phc_test",
        distinct_id: "anonymous-user",
        action: "navigate",
        destination: "/compare",
        location: "home_tool_grid",
        tool: "compare",
        $elements: [{ text: "potentially sensitive" }],
        $pathname: "/",
      },
    })
  ).toEqual({
    event: "$autocapture",
    properties: {
      token: "phc_test",
      distinct_id: "anonymous-user",
      $pathname: "/",
      $geoip_disable: true,
      action: "navigate",
      destination: "/compare",
      location: "home_tool_grid",
      tool: "compare",
      route: "/",
      page_kind: "home",
    },
  })
})

it("completes an operation without sending its editor state", async () => {
  vi.useFakeTimers()
  const { setAnalyticsConsent, useToolCompletion } = await import("./analytics")
  setAnalyticsConsent("accepted", "banner")
  await vi.dynamicImportSettled()

  function Completion() {
    useToolCompletion({
      tool: "format",
      operation: "SECRET_KEY=sensitive-value",
      active: true,
      variableCount: 12,
    })
    return null
  }

  render(createElement(Completion))
  await act(async () => {
    vi.advanceTimersByTime(800)
    await vi.dynamicImportSettled()
  })

  expect(posthog.capture).toHaveBeenCalledWith("tool completed", {
    tool: "format",
    variable_count: "11-50",
    result: "success",
  })
  expect(JSON.stringify(posthog.capture.mock.calls)).not.toContain(
    "sensitive-value"
  )
})

it("retries a failed PostHog import after consent", async () => {
  let imports = 0
  vi.doMock("posthog-js", () => {
    imports += 1
    if (imports === 1) throw new Error("temporary chunk failure")
    return { default: posthog }
  })

  const { setAnalyticsConsent, useAnalytics } = await import("./analytics")
  setAnalyticsConsent("accepted", "banner")
  await vi.dynamicImportSettled()

  function Capture() {
    const track = useAnalytics()
    useEffect(() => track("tool opened", { tool: "compare" }), [track])
    return null
  }

  render(createElement(Capture))
  await waitFor(() =>
    expect(posthog.capture).toHaveBeenCalledWith("tool opened", {
      tool: "compare",
    })
  )
  expect(imports).toBe(2)
})
