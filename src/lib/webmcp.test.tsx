// @vitest-environment jsdom

import { createElement } from "react"
import { render, waitFor } from "@testing-library/react"
import { beforeEach, expect, it, vi } from "vitest"

beforeEach(() => {
  vi.resetModules()
  vi.stubEnv("VITE_POSTHOG_KEY", "")
})

it("exposes every existing ENV operation without returning validator values", async () => {
  const { WEBMCP_TOOLS } = await import("./webmcp")

  expect(WEBMCP_TOOLS.map(({ name }) => name)).toEqual([
    "compare_env_files",
    "validate_env_file",
    "format_env_file",
    "generate_env_example",
    "merge_env_files",
    "convert_env_file",
  ])

  const validate = WEBMCP_TOOLS.find(
    ({ name }) => name === "validate_env_file"
  )!
  const validation = validate.execute({
    source: "DATABASE_URL=secret-value\nEMPTY=",
  })
  expect(validation).toContain('"variable_count":2')
  expect(validation).not.toContain("secret-value")

  const format = WEBMCP_TOOLS.find(({ name }) => name === "format_env_file")!
  expect(format.execute({ source: "B=2\nA=hello world" })).toBe(
    'A="hello world"\nB=2'
  )
})

it("registers tools progressively and cleans them up with one abort signal", async () => {
  const registered: Array<Record<string, unknown>> = []
  const signals: AbortSignal[] = []
  const registerTool = vi.fn(
    async (
      tool: Record<string, unknown>,
      options?: { signal?: AbortSignal }
    ) => {
      registered.push(tool)
      if (options?.signal) signals.push(options.signal)
    }
  )
  Object.defineProperty(document, "modelContext", {
    configurable: true,
    value: { registerTool },
  })

  const { WebMcp } = await import("./webmcp")
  const view = render(createElement(WebMcp))
  await waitFor(() => expect(registerTool).toHaveBeenCalledTimes(6))
  expect(signals).toHaveLength(6)
  expect(signals.every((signal) => !signal.aborted)).toBe(true)

  view.unmount()
  expect(signals.every((signal) => signal.aborted)).toBe(true)
  expect(registered).toHaveLength(6)
})
