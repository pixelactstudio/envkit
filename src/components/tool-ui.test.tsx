// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { expect, it, vi } from "vitest"

import { EnvEditor } from "./tool-ui"

it("loads a file dropped anywhere on the editor card", async () => {
  const onChange = vi.fn()
  render(
    <EnvEditor
      tool="compare"
      fileCount={1}
      id="test-env"
      label="File A"
      value=""
      onChange={onChange}
    />
  )

  const card = screen.getByText("File A").closest("[data-slot=card]")!
  fireEvent.drop(card, {
    dataTransfer: {
      files: [new File(["PORT=3000"], ".env", { type: "text/plain" })],
      types: ["Files"],
    },
  })

  await waitFor(() => expect(onChange).toHaveBeenCalledWith("PORT=3000"))
})

it("uses native wrapped textarea text so the caret and selection stay aligned", () => {
  const { container } = render(
    <EnvEditor
      tool="inspect"
      fileCount={1}
      id="native-env"
      label="Native editor"
      value="A_VERY_LONG_ENVIRONMENT_KEY=value"
      onChange={() => undefined}
    />
  )

  const textarea = container.querySelector("textarea")!
  expect(textarea.getAttribute("wrap")).toBe("soft")
  expect(textarea.className).not.toContain("text-transparent")
  expect(container.querySelector("pre")).toBeNull()
})
