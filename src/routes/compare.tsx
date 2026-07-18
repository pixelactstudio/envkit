import { useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { EyeIcon, EyeOffIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { CopyButton, EnvEditor, ToolPage } from "@/components/tool-ui"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { INITIAL_COMPARE_FILES } from "@/constants/env"
import { copyText } from "@/lib/clipboard"
import { compareManyEnvs, formatEnv, parseEnv } from "@/lib/env"
import type { EnvEntry } from "@/lib/env"
import { seoMeta } from "@/lib/seo"

type CompareFile = { id: number; name: string; content: string }
type CompareRow = { key: string; entries: Array<EnvEntry | undefined> }

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: seoMeta(
      "Compare ENV files",
      "Compare two or more .env files locally to find missing variables, matching keys, and changed values without uploading secrets."
    ),
  }),
  component: ComparePage,
})

function KeyList({ keys, empty }: { keys: string[]; empty: string }) {
  const [copied, setCopied] = useState("")

  return keys.length ? (
    <div className="flex flex-wrap gap-2">
      {keys.map((key) => (
        <Tooltip key={key}>
          <TooltipTrigger
            render={
              <button
                type="button"
                className="border bg-muted/50 px-2 py-1 font-mono text-xs transition-colors hover:border-primary hover:text-primary focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                onClick={async () => {
                  try {
                    await copyText(key)
                    setCopied(key)
                  } catch {
                    setCopied("")
                  }
                }}
              />
            }
          >
            {key}
          </TooltipTrigger>
          <TooltipContent>{copied === key ? "Copied" : "Copy"}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ) : (
    <p className="text-xs text-muted-foreground">{empty}</p>
  )
}

function ComparisonTable({
  rows,
  files,
  showValues,
  empty,
}: {
  rows: CompareRow[]
  files: CompareFile[]
  showValues: boolean
  empty: string
}) {
  if (!rows.length)
    return <p className="text-xs text-muted-foreground">{empty}</p>

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="sticky left-0 z-10 min-w-44 bg-card">
            Variable
          </TableHead>
          {files.map((file) => (
            <TableHead key={file.id} className="min-w-44">
              {file.name}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            <TableCell className="sticky left-0 z-10 bg-card font-mono font-medium">
              {row.key}
            </TableCell>
            {row.entries.map((entry, index) => (
              <TableCell key={files[index].id}>
                {!entry ? (
                  <Badge variant="destructive">Missing</Badge>
                ) : showValues ? (
                  <code className="block max-w-56 truncate bg-muted px-2 py-1">
                    {entry.value || "(empty)"}
                  </code>
                ) : (
                  <span className="text-muted-foreground">••••••••</span>
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function ComparePage() {
  const [files, setFiles] = useState<CompareFile[]>(INITIAL_COMPARE_FILES)
  const [showValues, setShowValues] = useState(false)
  const documents = useMemo(
    () => files.map(({ content }) => parseEnv(content)),
    [files]
  )
  const comparison = useMemo(
    () => compareManyEnvs(files.map(({ content }) => content)),
    [files]
  )
  const hasInput = files.some(({ content }) => content.trim())

  function updateFile(id: number, update: Partial<CompareFile>) {
    setFiles((current) =>
      current.map((file) => (file.id === id ? { ...file, ...update } : file))
    )
  }

  function addFile() {
    setFiles((current) => {
      const id = Math.max(...current.map((file) => file.id)) + 1
      return [
        ...current,
        { id, name: `File ${current.length + 1}`, content: "" },
      ]
    })
  }

  return (
    <ToolPage
      title="Compare ENV files"
      description="Compare two or more environments to find missing keys and value differences. Values stay hidden until you reveal them."
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          {files.length} environments · {comparison.rows.length} unique
          variables
        </p>
        <Button type="button" variant="outline" size="sm" onClick={addFile}>
          <PlusIcon data-icon="inline-start" />
          Add environment
        </Button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,22rem),1fr))] gap-4">
        {files.map((file, index) => (
          <EnvEditor
            key={file.id}
            id={`compare-${file.id}`}
            label={file.name}
            description={`${documents[index].entries.length} variables · ${documents[index].issues.length} findings`}
            value={file.content}
            onChange={(content) => updateFile(file.id, { content })}
            onFileLoad={(name) => updateFile(file.id, { name })}
            action={
              files.length > 2 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${file.name}`}
                  onClick={() =>
                    setFiles((current) =>
                      current.filter(({ id }) => id !== file.id)
                    )
                  }
                >
                  <Trash2Icon />
                </Button>
              ) : null
            }
            placeholder="# Paste or load an ENV file\nDATABASE_URL=...\nAPI_URL=..."
          />
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Comparison</CardTitle>
          <CardDescription>
            Missing keys, changed values, and exact matches across every file.
          </CardDescription>
          <CardAction>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowValues((value) => !value)}
            >
              {showValues ? (
                <EyeOffIcon data-icon="inline-start" />
              ) : (
                <EyeIcon data-icon="inline-start" />
              )}
              {showValues ? "Hide values" : "Reveal values"}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {!hasInput ? (
            <div className="border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
              Add ENV content to begin comparing.
            </div>
          ) : (
            <div className="space-y-8">
              <section className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium">Missing variables</h2>
                  <Badge variant="secondary">{comparison.missing.length}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {files.map((file, index) => (
                    <CopyButton
                      key={file.id}
                      text={formatEnv(comparison.missingByFile[index])}
                      label={`Copy ${comparison.missingByFile[index].length} for ${file.name}`}
                    />
                  ))}
                </div>
                <ComparisonTable
                  rows={comparison.missing}
                  files={files}
                  showValues={showValues}
                  empty="No file is missing a variable."
                />
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="font-medium">Different values</h2>
                  <Badge variant="outline">{comparison.different.length}</Badge>
                </div>
                <ComparisonTable
                  rows={comparison.different}
                  files={files}
                  showValues={showValues}
                  empty="No complete variables have different values."
                />
              </section>

              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <h2 className="font-medium">Same everywhere</h2>
                  <Badge variant="outline">{comparison.same.length}</Badge>
                </div>
                <KeyList
                  keys={comparison.same.map(({ key }) => key)}
                  empty="No variables match across every file yet."
                />
              </section>
            </div>
          )}
        </CardContent>
      </Card>
    </ToolPage>
  )
}
