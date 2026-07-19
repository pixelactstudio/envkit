// @vitest-environment jsdom

import { createElement, useEffect } from "react"
import { act, render } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"

const posthog = vi.hoisted(() => ({
  capture: vi.fn(),
}))

vi.mock("@posthog/react", () => ({ usePostHog: () => posthog }))

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv("VITE_POSTHOG_KEY", "phc_test")
  posthog.capture.mockClear()
})

afterEach(() => vi.useRealTimers())

it("allows only manual privacy-safe analytics", async () => {
  const {
    fileCountBucket,
    POSTHOG_OPTIONS,
    useAnalytics,
    variableCountBucket,
  } = await import("./analytics")

  function Capture() {
    const track = useAnalytics()
    useEffect(() => {
      track("input added", {
        tool: "compare",
        source: "drop",
        file_count: fileCountBucket(4),
      })
    }, [track])
    return null
  }

  render(createElement(Capture))

  expect(posthog.capture).toHaveBeenCalledWith("input added", {
    tool: "compare",
    source: "drop",
    file_count: "3+",
  })
  expect(variableCountBucket(77)).toBe("51-100")

  const config = POSTHOG_OPTIONS as Record<string, unknown>
  expect(config).toMatchObject({
    defaults: "2026-05-30",
    autocapture: false,
    capture_pageview: "history_change",
    capture_pageleave: true,
    capture_dead_clicks: false,
    capture_exceptions: false,
    capture_heatmaps: true,
    capture_performance: true,
    disable_session_recording: true,
    disable_surveys: true,
    advanced_disable_flags: true,
    rageclick: false,
    respect_dnt: true,
  })

  const beforeSend = config.before_send as (event: {
    event: string
    properties: Record<string, unknown>
  }) => { event: string; properties: Record<string, unknown> } | null
  const pageview = {
    event: "$pageview",
    properties: { $current_url: "https://envsift.damnlabs.com/format" },
  }
  expect(beforeSend(pageview)).toBe(pageview)
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
        $window_id: "window-id",
        $current_url: "https://envsift.damnlabs.com/format",
        $browser: "Chrome",
        editor_state: "SECRET=value",
      },
    })
  ).toEqual({
    event: "tool completed",
    properties: {
      token: "phc_test",
      distinct_id: "anonymous-user",
      tool: "format",
      variable_count: "2-10",
      result: "success",
    },
  })
})

it("does not capture without a project key", async () => {
  vi.stubEnv("VITE_POSTHOG_KEY", "")
  vi.resetModules()
  const { useAnalytics } = await import("./analytics")

  function Capture() {
    const track = useAnalytics()
    useEffect(() => track("tool opened", { tool: "inspect" }), [track])
    return null
  }

  render(createElement(Capture))
  expect(posthog.capture).not.toHaveBeenCalled()
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
