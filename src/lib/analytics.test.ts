// @vitest-environment jsdom

import { createElement, useEffect } from "react"
import { act, render, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({ imports: 0 }))
const posthog = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
}))

vi.mock("posthog-js", () => {
  state.imports += 1
  return { default: posthog }
})

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv("VITE_POSTHOG_KEY", "phc_test")
  state.imports = 0
  posthog.init.mockClear()
  posthog.capture.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

it("initializes cookieless analytics and permits privacy-safe events", async () => {
  const {
    Analytics,
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

  render(createElement(Analytics))
  render(createElement(Capture))

  await waitFor(() =>
    expect(posthog.capture).toHaveBeenCalledWith("input added", {
      tool: "compare",
      source: "drop",
      file_count: "3+",
    })
  )
  expect(posthog.init).toHaveBeenCalledOnce()
  expect(variableCountBucket(77)).toBe("51-100")

  const config = POSTHOG_OPTIONS as Record<string, unknown>
  expect(config).toMatchObject({
    cookieless_mode: "always",
    person_profiles: "never",
    capture_pageview: "history_change",
    capture_pageleave: true,
    capture_exceptions: false,
    capture_heatmaps: true,
    disable_session_recording: true,
    disable_surveys: true,
    mask_all_text: true,
    respect_dnt: true,
  })
  expect(config).not.toHaveProperty("persistence")
  expect(config).not.toHaveProperty("opt_out_persistence_by_default")
})

it("keeps only privacy-safe manual, route, and navigation properties", async () => {
  const { POSTHOG_OPTIONS } = await import("./analytics")
  const beforeSend = (POSTHOG_OPTIONS as Record<string, unknown>)
    .before_send as (event: {
    event: string
    properties: Record<string, unknown>
  }) => { event: string; properties: Record<string, unknown> } | null

  expect(
    beforeSend({
      event: "tool completed",
      properties: {
        token: "phc_test",
        distinct_id: "anonymous-user",
        $cookieless_mode: true,
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
      $cookieless_mode: true,
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
        $cookieless_mode: true,
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
      $cookieless_mode: true,
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

it("does not load analytics without a project key", async () => {
  vi.stubEnv("VITE_POSTHOG_KEY", "")
  vi.resetModules()
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

it("retries after the analytics chunk fails to load", async () => {
  let imports = 0
  vi.doMock("posthog-js", () => {
    imports += 1
    if (imports === 1) throw new Error("temporary chunk failure")
    return { default: posthog }
  })

  const { Analytics, useAnalytics } = await import("./analytics")
  render(createElement(Analytics))
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
