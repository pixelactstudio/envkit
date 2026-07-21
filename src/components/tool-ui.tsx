import { useEffect, useState } from "react"
import type { DragEvent, ReactNode } from "react"
import { Link } from "@tanstack/react-router"
import {
  ArrowLeftIcon,
  CheckIcon,
  ClipboardIcon,
  DownloadIcon,
  FileUpIcon,
  RotateCcwIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ToolSeoContent } from "@/components/tool-seo-content"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { fileCountBucket, useAnalytics } from "@/lib/analytics"
import type { ToolName } from "@/lib/analytics"
import { copyText } from "@/lib/clipboard"
import { cn } from "@/lib/utils"

export function ToolPage({
  tool,
  title,
  description,
  children,
}: {
  tool: ToolName
  title: string
  description: string
  children: ReactNode
}) {
  const track = useAnalytics()

  useEffect(() => {
    const timeout = window.setTimeout(() => track("tool opened", { tool }))
    return () => window.clearTimeout(timeout)
  }, [tool, track])

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Link
        to="/"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6")}
      >
        <ArrowLeftIcon data-icon="inline-start" />
        All tools
      </Link>
      <div className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm/relaxed text-muted-foreground sm:text-base">
          {description}
        </p>
      </div>
      {children}
      <ToolSeoContent tool={tool} />
    </main>
  )
}

export function EnvEditor({
  tool,
  fileCount,
  id,
  label,
  description,
  value,
  onChange,
  placeholder = "# Paste an ENV file\nDATABASE_URL=...\nAPI_KEY=...",
  accept = ".env,.txt,.json,text/plain,application/json",
  action,
  onFileLoad,
}: {
  tool: ToolName
  fileCount: number
  id: string
  label: string
  description?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  accept?: string
  action?: ReactNode
  onFileLoad?: (name: string) => void
}) {
  const track = useAnalytics()
  const [error, setError] = useState("")
  const [dragging, setDragging] = useState(false)

  async function readFile(file: File | undefined, source: "file" | "drop") {
    if (!file) return
    try {
      onChange(await file.text())
      onFileLoad?.(file.name)
      setError("")
      track("input added", {
        tool,
        source,
        file_count: fileCountBucket(fileCount),
      })
    } catch {
      setError("The selected file could not be read.")
      track("tool error", { tool, error_code: "file_read_failed" })
    }
  }

  return (
    <Card
      className={cn(
        "relative min-w-0 transition-colors",
        dragging && "bg-primary/5"
      )}
      onDragEnter={(event) => {
        if (event.dataTransfer.types.includes("Files")) setDragging(true)
      }}
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = "copy"
      }}
      onDragLeave={(event: DragEvent<HTMLDivElement>) => {
        if (
          !event.relatedTarget ||
          !event.currentTarget.contains(event.relatedTarget as Node)
        ) {
          setDragging(false)
        }
      }}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        void readFile(event.dataTransfer.files[0], "drop")
      }}
    >
      {dragging ? (
        <div className="pointer-events-none absolute inset-2 z-20 grid place-items-center border border-dashed border-primary/70 bg-card/95">
          <div className="text-center">
            <span className="mx-auto grid size-10 place-items-center bg-primary/10 text-primary">
              <FileUpIcon className="size-5" />
            </span>
            <p className="mt-3 text-sm font-medium">Drop your ENV file</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Release to load it locally
            </p>
          </div>
        </div>
      ) : null}
      <CardHeader>
        <CardTitle>
          <label htmlFor={id}>{label}</label>
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        <CardAction className="flex items-center gap-1">
          {action}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!value}
            onClick={() => onChange("")}
          >
            <RotateCcwIcon data-icon="inline-start" />
            Clear
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onPaste={() =>
            track("input added", {
              tool,
              source: "paste",
              file_count: fileCountBucket(fileCount),
            })
          }
          placeholder={placeholder}
          spellCheck={false}
          wrap="soft"
          className="env-scrollbar field-sizing-fixed! h-64! max-h-64! min-h-64! resize-none overflow-auto font-mono text-[13px] leading-6"
        />
        <label className="flex cursor-pointer items-center gap-2 border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground">
          <FileUpIcon className="size-4" />
          <span>Load or drop a local file</span>
          <Input
            type="file"
            accept={accept}
            className="sr-only"
            onChange={(event) => {
              void readFile(event.target.files?.[0], "file")
              event.currentTarget.value = ""
            }}
          />
        </label>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  )
}

export function CopyButton({
  tool,
  text,
  label = "Copy",
}: {
  tool: ToolName
  text: string
  label?: string
}) {
  const track = useAnalytics()
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle")

  async function copy() {
    try {
      await copyText(text)
      setStatus("copied")
      track("output copied", { tool })
    } catch {
      setStatus("error")
      track("tool error", { tool, error_code: "copy_failed" })
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!text}
      onClick={copy}
    >
      {status === "copied" ? (
        <CheckIcon data-icon="inline-start" />
      ) : (
        <ClipboardIcon data-icon="inline-start" />
      )}
      {status === "copied"
        ? "Copied"
        : status === "error"
          ? "Copy failed"
          : label}
    </Button>
  )
}

function DownloadButton({
  tool,
  text,
  filename,
}: {
  tool: ToolName
  text: string
  filename: string
}) {
  const track = useAnalytics()

  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }))
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
    track("output downloaded", { tool })
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!text}
      onClick={download}
    >
      <DownloadIcon data-icon="inline-start" />
      Download
    </Button>
  )
}

export function OutputPanel({
  tool,
  id,
  label,
  description,
  value,
  filename,
  error,
  errorTitle = "Unable to convert",
}: {
  tool: ToolName
  id: string
  label: string
  description?: string
  value: string
  filename: string
  error?: string
  errorTitle?: string
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>
          <label htmlFor={id}>{label}</label>
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        <CardAction className="flex gap-2">
          <CopyButton tool={tool} text={value} />
          <DownloadButton tool={tool} text={value} filename={filename} />
        </CardAction>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-3">
            <AlertTitle>{errorTitle}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Textarea
          id={id}
          value={value}
          readOnly
          spellCheck={false}
          placeholder="Your generated output will appear here."
          className="env-scrollbar field-sizing-fixed! h-64! max-h-64! min-h-64! resize-none overflow-auto bg-muted/30 font-mono text-[13px] leading-6"
        />
      </CardContent>
    </Card>
  )
}
