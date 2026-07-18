import { useEffect } from "react"
import posthog from "posthog-js/dist/module.slim"

export type ToolName =
  "compare" | "example" | "inspect" | "merge" | "format" | "convert"
export type ToolErrorCode = "invalid_input" | "file_read_failed" | "copy_failed"

type AnalyticsEvents = {
  "tool opened": { tool: ToolName }
  "input added": {
    tool: ToolName
    source: "paste" | "file" | "drop"
    file_count: "1" | "2" | "3+"
  }
  "tool completed": {
    tool: ToolName
    variable_count: "0" | "1" | "2-10" | "11-50" | "51-100" | "101+"
    result: "success" | "failure"
  }
  "output copied": { tool: ToolName }
  "output downloaded": { tool: ToolName }
  "tool error": { tool: ToolName; error_code: ToolErrorCode }
}

const EVENT_NAMES = new Set<keyof AnalyticsEvents>([
  "tool opened",
  "input added",
  "tool completed",
  "output copied",
  "output downloaded",
  "tool error",
])
let initialized = false

function client() {
  if (typeof window === "undefined") return undefined
  if (initialized) return posthog

  const token = import.meta.env.VITE_POSTHOG_KEY
  if (!token) return undefined

  posthog.init(token, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
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
    person_profiles: "identified_only",
    persistence: "localStorage",
    respect_dnt: true,
    before_send: (event) =>
      event && EVENT_NAMES.has(event.event as keyof AnalyticsEvents)
        ? event
        : null,
  })
  initialized = true
  return posthog
}

export function track<TEvent extends keyof AnalyticsEvents>(
  event: TEvent,
  properties: AnalyticsEvents[TEvent]
) {
  client()?.capture(event, properties)
}

export function fileCountBucket(count: number): "1" | "2" | "3+" {
  return count <= 1 ? "1" : count === 2 ? "2" : "3+"
}

export function variableCountBucket(
  count: number
): "0" | "1" | "2-10" | "11-50" | "51-100" | "101+" {
  if (count <= 0) return "0"
  if (count === 1) return "1"
  if (count <= 10) return "2-10"
  if (count <= 50) return "11-50"
  if (count <= 100) return "51-100"
  return "101+"
}

export function useToolCompletion({
  tool,
  operation,
  active,
  variableCount,
  errorCode,
}: {
  tool: ToolName
  operation: string
  active: boolean
  variableCount: number
  errorCode?: ToolErrorCode
}) {
  useEffect(() => {
    if (!active) return

    const timeout = window.setTimeout(() => {
      track("tool completed", {
        tool,
        variable_count: variableCountBucket(variableCount),
        result: errorCode ? "failure" : "success",
      })
      if (errorCode) track("tool error", { tool, error_code: errorCode })
    }, 800)

    return () => window.clearTimeout(timeout)
  }, [active, errorCode, operation, tool, variableCount])
}
