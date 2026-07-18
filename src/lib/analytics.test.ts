// @vitest-environment jsdom

import { createElement } from "react"
import { act, render } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"

const posthog = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
}))

vi.mock("posthog-js/dist/module.slim", () => ({ default: posthog }))

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv("VITE_POSTHOG_KEY", "phc_test")
  posthog.init.mockClear()
  posthog.capture.mockClear()
})

afterEach(() => vi.useRealTimers())

it("allows only manual privacy-safe analytics", async () => {
  const { fileCountBucket, track, variableCountBucket } =
    await import("./analytics")

  track("input added", {
    tool: "compare",
    source: "drop",
    file_count: fileCountBucket(4),
  })

  expect(posthog.capture).toHaveBeenCalledWith("input added", {
    tool: "compare",
    source: "drop",
    file_count: "3+",
  })
  expect(variableCountBucket(77)).toBe("51-100")

  const config = posthog.init.mock.calls[0][1] as Record<string, unknown>
  expect(config).toMatchObject({
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    capture_dead_clicks: false,
    capture_exceptions: false,
    capture_heatmaps: false,
    capture_performance: false,
    disable_session_recording: true,
    disable_surveys: true,
    advanced_disable_flags: true,
    rageclick: false,
  })

  const beforeSend = config.before_send as (event: { event: string }) => unknown
  expect(beforeSend({ event: "$pageview" })).toBeNull()
  expect(beforeSend({ event: "tool completed" })).toEqual({
    event: "tool completed",
  })
})

it("completes an operation without sending its editor state", async () => {
  vi.useFakeTimers()
  const { useToolCompletion } = await import("./analytics")

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
  act(() => vi.advanceTimersByTime(800))

  expect(posthog.capture).toHaveBeenCalledWith("tool completed", {
    tool: "format",
    variable_count: "11-50",
    result: "success",
  })
  expect(JSON.stringify(posthog.capture.mock.calls)).not.toContain(
    "sensitive-value"
  )
})
