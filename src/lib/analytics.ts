import { useCallback, useEffect } from "react"
import type { PostHog, PostHogConfig } from "posthog-js"

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

const EVENT_PROPERTIES: {
  [TEvent in keyof AnalyticsEvents]: readonly (keyof AnalyticsEvents[TEvent])[]
} = {
  "tool opened": ["tool"],
  "input added": ["tool", "source", "file_count"],
  "tool completed": ["tool", "variable_count", "result"],
  "output copied": ["tool"],
  "output downloaded": ["tool"],
  "tool error": ["tool", "error_code"],
}
const REQUIRED_POSTHOG_PROPERTIES = ["token", "distinct_id"] as const
const AUTOMATIC_EVENTS = new Set([
  "$pageview",
  "$pageleave",
  "$web_vitals",
  "$$heatmap",
])

export const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_KEY
export const POSTHOG_OPTIONS = {
  api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
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
  person_profiles: "identified_only",
  persistence: "localStorage",
  respect_dnt: true,
  before_send: (event) => {
    if (!event) return null
    if (AUTOMATIC_EVENTS.has(event.event)) return event

    const eventName = event.event as keyof AnalyticsEvents
    if (!Object.hasOwn(EVENT_PROPERTIES, eventName)) return null

    const properties = event.properties
    return {
      ...event,
      properties: Object.fromEntries(
        [...REQUIRED_POSTHOG_PROPERTIES, ...EVENT_PROPERTIES[eventName]]
          .filter((property) => properties[property] !== undefined)
          .map((property) => [property, properties[property]])
      ),
    }
  },
} satisfies Partial<PostHogConfig>

let posthogPromise: Promise<PostHog | undefined> | undefined

function getPostHog() {
  if (!POSTHOG_API_KEY) return

  posthogPromise ??= import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(POSTHOG_API_KEY, POSTHOG_OPTIONS)
      return posthog
    })
    .catch(() => {
      posthogPromise = undefined
      return undefined
    })
  return posthogPromise
}

export function Analytics() {
  useEffect(() => {
    void getPostHog()
  }, [])

  return null
}

export function useAnalytics() {
  return useCallback(
    <TEvent extends keyof AnalyticsEvents>(
      event: TEvent,
      properties: AnalyticsEvents[TEvent]
    ) => {
      void getPostHog()?.then((posthog) => posthog?.capture(event, properties))
    },
    []
  )
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
  const track = useAnalytics()

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
  }, [active, errorCode, operation, tool, track, variableCount])
}
