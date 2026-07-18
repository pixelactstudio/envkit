import { useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"

import { EnvEditor, OutputPanel, ToolPage } from "@/components/tool-ui"
import { Badge } from "@/components/ui/badge"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { useToolCompletion } from "@/lib/analytics"
import { formatEnvFile, parseEnv } from "@/lib/env"
import type { EnvQuoteMode } from "@/lib/env"
import { seoMeta } from "@/lib/seo"

export const Route = createFileRoute("/format")({
  head: () => ({
    meta: seoMeta(
      "Format ENV files",
      "Format .env files with consistent quotes, ordering, and duplicate removal without uploading credentials."
    ),
  }),
  component: FormatPage,
})

function FormatPage() {
  const [source, setSource] = useState("")
  const [quotes, setQuotes] = useState<EnvQuoteMode>("smart")
  const [sort, setSort] = useState(true)
  const [keepComments, setKeepComments] = useState(true)
  const result = useMemo(
    () => formatEnvFile(source, quotes, sort, keepComments),
    [source, quotes, sort, keepComments]
  )
  const document = useMemo(() => parseEnv(source), [source])
  useToolCompletion({
    tool: "format",
    operation: source,
    active: Boolean(source.trim() && (document.entries.length || result.error)),
    variableCount: document.entries.length,
    errorCode: result.error ? "invalid_input" : undefined,
  })

  return (
    <ToolPage
      tool="format"
      title="ENV Formatter"
      description="Normalize quoting, remove duplicate assignments, and optionally sort variables into a consistent file."
    >
      <div className="mb-4 flex flex-wrap items-end gap-3 border bg-muted/30 p-3">
        <div>
          <label
            htmlFor="format-quotes"
            className="mb-1 block text-[11px] text-muted-foreground"
          >
            Value quotes
          </label>
          <NativeSelect
            id="format-quotes"
            value={quotes}
            onChange={(event) => setQuotes(event.target.value as EnvQuoteMode)}
          >
            <NativeSelectOption value="smart">
              Only when required
            </NativeSelectOption>
            <NativeSelectOption value="always">
              Quote every value
            </NativeSelectOption>
            <NativeSelectOption value="never">No quotes</NativeSelectOption>
          </NativeSelect>
        </div>
        <div>
          <label
            htmlFor="format-comments"
            className="mb-1 block text-[11px] text-muted-foreground"
          >
            Comments
          </label>
          <NativeSelect
            id="format-comments"
            value={keepComments ? "keep" : "remove"}
            onChange={(event) => setKeepComments(event.target.value === "keep")}
          >
            <NativeSelectOption value="keep">Keep comments</NativeSelectOption>
            <NativeSelectOption value="remove">
              Remove comments
            </NativeSelectOption>
          </NativeSelect>
        </div>
        <div>
          <label
            htmlFor="format-order"
            className="mb-1 block text-[11px] text-muted-foreground"
          >
            Variable order
          </label>
          <NativeSelect
            id="format-order"
            value={sort ? "sorted" : "original"}
            onChange={(event) => setSort(event.target.value === "sorted")}
          >
            <NativeSelectOption value="sorted">
              Sort alphabetically
            </NativeSelectOption>
            <NativeSelectOption value="original">
              Keep original order
            </NativeSelectOption>
          </NativeSelect>
        </div>
        {result.duplicates ? (
          <Badge variant="secondary">
            {result.duplicates} duplicate{result.duplicates === 1 ? "" : "s"}{" "}
            removed
          </Badge>
        ) : null}
        {result.comments ? (
          <Badge variant="outline">
            {result.comments} comment{result.comments === 1 ? "" : "s"}{" "}
            {keepComments ? "kept" : "omitted"}
          </Badge>
        ) : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <EnvEditor
          id="format-source"
          label="Unformatted ENV"
          description="Paste mixed quoting styles or load a local file."
          value={source}
          onChange={setSource}
        />
        <OutputPanel
          id="format-result"
          label="Formatted ENV"
          description={
            keepComments
              ? sort
                ? "Comments are kept above the sorted assignments."
                : "Comments stay in their original positions."
              : "Only normalized assignments are included."
          }
          value={result.output}
          filename=".env.formatted"
          error={result.error}
        />
      </div>
    </ToolPage>
  )
}
