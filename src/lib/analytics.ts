import { useCallback, useEffect, useSyncExternalStore } from "react"
import type { PostHog, PostHogConfig } from "posthog-js"

export type ToolName =
  "compare" | "example" | "inspect" | "merge" | "format" | "convert"
export type ToolErrorCode = "invalid_input" | "file_read_failed" | "copy_failed"
export type AnalyticsConsent = "accepted" | "declined" | "unknown"
export type AnalyticsConsentSource = "banner" | "privacy"
export type WebMcpToolName =
  | "compare_env_files"
  | "validate_env_file"
  | "format_env_file"
  | "generate_env_example"
  | "merge_env_files"
  | "convert_env_file"

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
  "analytics consent accepted": { source: AnalyticsConsentSource }
  "webmcp tool called": {
    tool: WebMcpToolName
    result: "success" | "failure"
    input_size: "empty" | "small" | "medium" | "large"
  }
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
  "analytics consent accepted": ["source"],
  "webmcp tool called": ["tool", "result", "input_size"],
}
const REQUIRED_POSTHOG_PROPERTIES = ["token", "distinct_id"] as const
const SAFE_CONTEXT_PROPERTIES = [
  "$session_id",
  "$window_id",
  "$pageview_id",
  "$current_url",
  "$pathname",
  "$host",
  "$browser",
  "$browser_version",
  "$os",
  "$os_version",
  "$device_type",
  "$viewport_width",
  "$viewport_height",
  "$screen_width",
  "$screen_height",
  "$browser_language_prefix",
  "$referrer",
  "$referring_domain",
  "$lib",
  "$lib_version",
  "$geoip_disable",
] as const
const AUTOCAPTURE_PROPERTIES = [
  "action",
  "destination",
  "location",
  "tool",
] as const
const AUTOMATIC_EVENTS = new Set([
  "$pageview",
  "$pageleave",
  "$web_vitals",
  "$$heatmap",
])

export const ANALYTICS_CONSENT_KEY = "envsift-analytics-consent-v1"
export const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_KEY

function cleanUrl(value: unknown) {
  if (typeof value !== "string") return undefined
  try {
    const url = new URL(value, "https://envsift.damnlabs.com")
    return `${url.origin}${url.pathname}`
  } catch {
    return undefined
  }
}

function pageContext(pathname: string) {
  const toolByPath: Partial<Record<string, ToolName>> = {
    "/compare": "compare",
    "/example": "example",
    "/validator": "inspect",
    "/merge": "merge",
    "/format": "format",
    "/convert": "convert",
  }
  const tool = toolByPath[pathname]
  const page_kind = tool
    ? "tool"
    : pathname === "/"
      ? "home"
      : pathname === "/guides"
        ? "guides"
        : pathname.startsWith("/guides/")
          ? "guide"
          : pathname === "/privacy"
            ? "privacy"
            : "other"

  return { route: pathname, page_kind, ...(tool ? { tool } : {}) }
}

export const POSTHOG_OPTIONS = {
  api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
  defaults: "2026-05-30",
  autocapture: {
    dom_event_allowlist: ["click"],
    element_allowlist: ["a", "button"],
    css_selector_allowlist: ["[data-ph-capture]"],
    element_attribute_ignorelist: [
      "href",
      "class",
      "style",
      "title",
      "aria-label",
    ],
    capture_copied_text: false,
  },
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
  opt_out_persistence_by_default: true,
  property_denylist: ["$raw_user_agent"],
  mask_all_text: true,
  respect_dnt: true,
  before_send: (event) => {
    if (!event) return null

    const properties: Record<string, unknown> = {
      ...event.properties,
      $geoip_disable: true,
    }
    const currentUrl = cleanUrl(properties.$current_url)
    const referrer = cleanUrl(properties.$referrer)
    if (currentUrl) properties.$current_url = currentUrl
    else delete properties.$current_url
    if (referrer) properties.$referrer = referrer
    else delete properties.$referrer
    delete properties.$raw_user_agent
    Object.keys(properties).forEach((property) => {
      if (property.startsWith("$geoip_") && property !== "$geoip_disable") {
        delete properties[property]
      }
    })

    const pathname =
      typeof properties.$pathname === "string"
        ? properties.$pathname.split(/[?#]/, 1)[0]
        : currentUrl
          ? new URL(currentUrl).pathname
          : "/"
    properties.$pathname = pathname
    const context = pageContext(pathname)

    if (AUTOMATIC_EVENTS.has(event.event)) {
      return { ...event, properties: { ...properties, ...context } }
    }

    const eventName = event.event as keyof AnalyticsEvents
    const eventProperties = Object.hasOwn(EVENT_PROPERTIES, eventName)
      ? EVENT_PROPERTIES[eventName]
      : event.event === "$autocapture"
        ? AUTOCAPTURE_PROPERTIES
        : undefined
    if (!eventProperties) return null

    return {
      ...event,
      properties: {
        ...Object.fromEntries(
          [
            ...REQUIRED_POSTHOG_PROPERTIES,
            ...SAFE_CONTEXT_PROPERTIES,
            ...eventProperties,
          ]
            .filter((property) => properties[property] !== undefined)
            .map((property) => [property, properties[property]])
        ),
        ...context,
      },
    }
  },
} satisfies Partial<PostHogConfig>

let consentOverride: AnalyticsConsent | undefined
const consentListeners = new Set<() => void>()
let posthogPromise: Promise<PostHog | undefined> | undefined

export function getAnalyticsConsent(): AnalyticsConsent {
  if (consentOverride) return consentOverride
  if (typeof window === "undefined") return "unknown"
  try {
    const stored = window.localStorage.getItem(ANALYTICS_CONSENT_KEY)
    return stored === "accepted" || stored === "declined" ? stored : "unknown"
  } catch {
    return "unknown"
  }
}

function subscribeToConsent(listener: () => void) {
  consentListeners.add(listener)
  return () => consentListeners.delete(listener)
}

export function useAnalyticsConsent() {
  return useSyncExternalStore(
    subscribeToConsent,
    getAnalyticsConsent,
    () => "unknown" as const
  )
}

function getPostHog() {
  if (!POSTHOG_API_KEY || getAnalyticsConsent() !== "accepted") return

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

export function setAnalyticsConsent(
  consent: Exclude<AnalyticsConsent, "unknown">,
  source: AnalyticsConsentSource
) {
  const wasInitialized = Boolean(posthogPromise)
  consentOverride = consent
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, consent)
  } catch {
    // The in-memory choice still applies for this tab.
  }
  consentListeners.forEach((listener) => listener())

  if (consent === "accepted") {
    void getPostHog()?.then((posthog) => {
      if (!posthog) return
      posthog.set_config({ disable_persistence: false })
      posthog.opt_in_capturing({ captureEventName: false })
      if (wasInitialized) posthog.capture("$pageview")
      posthog.capture("analytics consent accepted", { source })
    })
    return
  }

  void posthogPromise?.then((posthog) => {
    posthog?.reset(true)
    posthog?.opt_out_capturing()
  })
}

export function Analytics() {
  const consent = useAnalyticsConsent()

  useEffect(() => {
    if (consent !== "accepted") return
    void getPostHog()?.then((posthog) => {
      posthog?.set_config({ disable_persistence: false })
      posthog?.opt_in_capturing({ captureEventName: false })
    })
  }, [consent])

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

export function contentSizeBucket(
  length: number
): "empty" | "small" | "medium" | "large" {
  if (length <= 0) return "empty"
  if (length <= 1_000) return "small"
  if (length <= 10_000) return "medium"
  return "large"
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
