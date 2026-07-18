import { useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { ArrowRightIcon } from "lucide-react"

import { EnvEditor, OutputPanel, ToolPage } from "@/components/tool-ui"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { ENV_OUTPUT_FILENAMES } from "@/constants/env"
import { convertEnvironment } from "@/lib/env"
import type { DockerValueMode, EnvFormat } from "@/lib/env"
import { seoMeta } from "@/lib/seo"

export const Route = createFileRoute("/convert")({
  head: () => ({
    meta: seoMeta(
      "Convert ENV formats",
      "Convert .env files and flat JSON into normalized ENV, JSON, shell exports, or Docker Compose syntax locally."
    ),
  }),
  component: ConvertPage,
})

function ConvertPage() {
  const [source, setSource] = useState("")
  const [input, setInput] = useState<"env" | "json">("env")
  const [output, setOutput] = useState<EnvFormat>("json")
  const [dockerMode, setDockerMode] = useState<DockerValueMode>("values")
  const result = useMemo(() => {
    try {
      return {
        value: convertEnvironment(source, input, output, dockerMode),
        error: "",
      }
    } catch (error) {
      return {
        value: "",
        error:
          error instanceof Error
            ? error.message
            : "The input could not be converted.",
      }
    }
  }, [source, input, output, dockerMode])

  return (
    <ToolPage
      title="Format Converter"
      description="Convert a flat ENV or JSON object into normalized ENV, JSON, shell exports, or a Docker Compose environment block."
    >
      <div className="mb-4 flex flex-wrap items-center gap-3 border bg-muted/30 p-3">
        <div>
          <label
            htmlFor="convert-input"
            className="mb-1 block text-[11px] text-muted-foreground"
          >
            Input format
          </label>
          <NativeSelect
            id="convert-input"
            value={input}
            onChange={(event) => setInput(event.target.value as typeof input)}
          >
            <NativeSelectOption value="env">
              ENV / shell export
            </NativeSelectOption>
            <NativeSelectOption value="json">
              Flat JSON object
            </NativeSelectOption>
          </NativeSelect>
        </div>
        <ArrowRightIcon className="mt-4 size-4 text-muted-foreground" />
        <div>
          <label
            htmlFor="convert-output"
            className="mb-1 block text-[11px] text-muted-foreground"
          >
            Output format
          </label>
          <NativeSelect
            id="convert-output"
            value={output}
            onChange={(event) => setOutput(event.target.value as EnvFormat)}
          >
            <NativeSelectOption value="env">ENV</NativeSelectOption>
            <NativeSelectOption value="json">JSON</NativeSelectOption>
            <NativeSelectOption value="shell">Shell exports</NativeSelectOption>
            <NativeSelectOption value="docker">
              Docker Compose
            </NativeSelectOption>
          </NativeSelect>
        </div>
        {output === "docker" ? (
          <div>
            <label
              htmlFor="docker-values"
              className="mb-1 block text-[11px] text-muted-foreground"
            >
              Compose values
            </label>
            <NativeSelect
              id="docker-values"
              value={dockerMode}
              onChange={(event) =>
                setDockerMode(event.target.value as DockerValueMode)
              }
            >
              <NativeSelectOption value="values">
                Include values directly
              </NativeSelectOption>
              <NativeSelectOption value="references">
                Reference host variables
              </NativeSelectOption>
            </NativeSelect>
          </div>
        ) : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <EnvEditor
          id="convert-source"
          label="Input"
          description={
            input === "json"
              ? "Only flat JSON objects are accepted."
              : "Comments are ignored in generated output."
          }
          value={source}
          onChange={setSource}
          placeholder={
            input === "json"
              ? '{\n  "PORT": 3000,\n  "API_URL": "https://example.com"\n}'
              : "PORT=3000\nAPI_URL=https://example.com"
          }
        />
        <OutputPanel
          id="convert-result"
          label="Converted output"
          value={result.value}
          filename={ENV_OUTPUT_FILENAMES[output]}
          error={result.error}
        />
      </div>
    </ToolPage>
  )
}
