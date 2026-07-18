import { useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"

import { EnvEditor, OutputPanel, ToolPage } from "@/components/tool-ui"
import { Badge } from "@/components/ui/badge"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { generateExample, parseEnv } from "@/lib/env"
import { seoMeta } from "@/lib/seo"

export const Route = createFileRoute("/example")({
  head: () => ({
    meta: seoMeta(
      ".env.example Generator",
      "Generate a safe .env.example template by removing environment variable values locally in your browser."
    ),
  }),
  component: ExamplePage,
})

function ExamplePage() {
  const [source, setSource] = useState("")
  const [mode, setMode] = useState<"preserve" | "sort">("preserve")
  const document = useMemo(() => parseEnv(source), [source])
  const output = useMemo(
    () => generateExample(source, mode === "sort"),
    [source, mode]
  )

  return (
    <ToolPage
      title=".env.example Generator"
      description="Turn a real ENV file into a shareable template. Assignment values are removed locally before you copy or download anything."
    >
      <div className="mb-4 flex flex-wrap items-center gap-3 border bg-muted/30 p-3">
        <label htmlFor="example-mode" className="text-xs font-medium">
          Output order
        </label>
        <NativeSelect
          id="example-mode"
          value={mode}
          onChange={(event) => setMode(event.target.value as typeof mode)}
        >
          <NativeSelectOption value="preserve">
            Preserve comments and order
          </NativeSelectOption>
          <NativeSelectOption value="sort">
            Sort and deduplicate keys
          </NativeSelectOption>
        </NativeSelect>
        <Badge variant="outline">
          {document.entries.length} variables found
        </Badge>
        {document.duplicateKeys.length ? (
          <Badge variant="destructive">
            {document.duplicateKeys.length} duplicate keys
          </Badge>
        ) : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <EnvEditor
          id="example-input"
          label="Source ENV"
          description="Comments and blank lines are preserved unless sorted output is selected."
          value={source}
          onChange={setSource}
        />
        <OutputPanel
          id="example-output"
          label="Safe template"
          description="Review comments for manually written secrets before committing."
          value={output}
          filename=".env.example"
        />
      </div>
    </ToolPage>
  )
}
