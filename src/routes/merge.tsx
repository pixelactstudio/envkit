import { useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"

import { EnvEditor, OutputPanel, ToolPage } from "@/components/tool-ui"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { useToolCompletion } from "@/lib/analytics"
import { mergeEnvs, parseEnv } from "@/lib/env"
import type { MergeResolution, MergeWinner } from "@/lib/env"
import { seoMeta } from "@/lib/seo"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/merge")({
  head: () => ({
    meta: seoMeta(
      "Merge and clean ENV files",
      "Merge two .env files with explicit conflict precedence, duplicate removal, and stable sorting in your browser."
    ),
  }),
  component: MergePage,
})

function MergePage() {
  const [left, setLeft] = useState("")
  const [right, setRight] = useState("")
  const [winner, setWinner] = useState<MergeWinner>("right")
  const [resolutions, setResolutions] = useState<
    Partial<Record<string, MergeResolution>>
  >({})
  const result = useMemo(
    () => mergeEnvs(left, right, winner, resolutions),
    [left, right, winner, resolutions]
  )
  const duplicates = useMemo(
    () =>
      parseEnv(left).duplicateKeys.length +
      parseEnv(right).duplicateKeys.length,
    [left, right]
  )
  const inputCount =
    Number(Boolean(left.trim())) + Number(Boolean(right.trim()))
  useToolCompletion({
    tool: "merge",
    operation: `${left}\0${right}`,
    active: Boolean(left.trim() && right.trim() && !result.unresolved),
    variableCount: result.total,
    errorCode: result.error ? "invalid_input" : undefined,
  })

  return (
    <ToolPage
      tool="merge"
      title="Merge & Clean"
      description="Combine two ENV files into one sorted result. Duplicate keys are collapsed and your chosen file wins when values conflict."
    >
      <div className="mb-4 flex flex-wrap items-center gap-3 border bg-muted/30 p-3">
        <label htmlFor="merge-priority" className="text-xs font-medium">
          On conflicts
        </label>
        <NativeSelect
          id="merge-priority"
          value={winner}
          onChange={(event) => setWinner(event.target.value as typeof winner)}
        >
          <NativeSelectOption value="right">File B wins</NativeSelectOption>
          <NativeSelectOption value="left">File A wins</NativeSelectOption>
          <NativeSelectOption value="manual">
            Choose each conflict
          </NativeSelectOption>
        </NativeSelect>
        <Badge variant="outline">
          {result.total} final variable{result.total === 1 ? "" : "s"}
        </Badge>
        <Badge variant={result.conflicts ? "destructive" : "secondary"}>
          {result.conflicts} value conflict
          {result.conflicts === 1 ? "" : "s"}
        </Badge>
        {duplicates ? (
          <Badge variant="secondary">
            {duplicates} duplicate{duplicates === 1 ? "" : "s"} removed
          </Badge>
        ) : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <EnvEditor
          id="merge-left"
          label="File A"
          description={
            winner === "manual"
              ? "Choose conflicting values below"
              : winner === "left"
                ? "Wins conflicts"
                : "Lower priority"
          }
          value={left}
          onChange={setLeft}
        />
        <EnvEditor
          id="merge-right"
          label="File B"
          description={
            winner === "manual"
              ? "Choose conflicting values below"
              : winner === "right"
                ? "Wins conflicts"
                : "Lower priority"
          }
          value={right}
          onChange={setRight}
        />
      </div>
      {winner === "manual" && result.conflictEntries.length ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Resolve conflicts</CardTitle>
            <CardDescription>
              Choose the value to keep for each conflicting variable.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-2">
            {result.conflictEntries.map((conflict) => (
              <div key={conflict.key} className="min-w-0 border p-3">
                <code className="font-medium text-primary">{conflict.key}</code>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(["left", "right"] as const).map((side) => {
                    const entry = conflict[side]
                    const selected = resolutions[conflict.key] === side
                    return (
                      <button
                        key={side}
                        type="button"
                        aria-pressed={selected}
                        className={cn(
                          "min-w-0 border p-3 text-left transition-colors hover:border-primary focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
                          selected && "border-primary bg-primary/10"
                        )}
                        onClick={() =>
                          setResolutions((current) => ({
                            ...current,
                            [conflict.key]: side,
                          }))
                        }
                      >
                        <span className="block text-[11px] font-medium text-muted-foreground">
                          File {side === "left" ? "A" : "B"}
                        </span>
                        <code
                          className="mt-1 block truncate text-xs"
                          title={entry.value}
                        >
                          {entry.value || "(empty)"}
                        </code>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      <div className="mt-4">
        <OutputPanel
          id="merge-output"
          label="Merged ENV"
          description="Keys are sorted alphabetically for a stable, reviewable result."
          value={result.output}
          filename=".env.merged"
          error={
            result.error ||
            (result.unresolved
              ? `${result.unresolved} conflict${result.unresolved === 1 ? "" : "s"} still need a choice.`
              : "")
          }
          errorTitle={result.error ? "Unable to merge" : "Resolve conflicts"}
        />
      </div>
    </ToolPage>
  )
}
