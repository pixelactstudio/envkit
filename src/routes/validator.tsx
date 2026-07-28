import { useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { AlertTriangleIcon, CheckCircle2Icon, CircleXIcon } from "lucide-react"

import { EnvEditor, ToolPage } from "@/components/tool-ui"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useToolCompletion } from "@/lib/analytics"
import { parseEnv } from "@/lib/env"
import { seoHead } from "@/lib/seo"

export const Route = createFileRoute("/validator")({
  head: () =>
    seoHead(
      "Free .env File Validator — Check ENV Syntax",
      "Validate .env files online for syntax errors, duplicate keys, empty values, missing references, and risky whitespace without uploading secrets.",
      "/validator",
      { image: "validator", kind: "tool" }
    ),
  component: ValidatorPage,
})

function ValidatorPage() {
  const [source, setSource] = useState("")
  const document = useMemo(() => parseEnv(source), [source])
  const errors = document.issues.filter(({ severity }) => severity === "error")
  const warnings = document.issues.filter(
    ({ severity }) => severity === "warning"
  )
  useToolCompletion({
    tool: "inspect",
    operation: source,
    active: Boolean(
      source.trim() && (document.entries.length || errors.length)
    ),
    variableCount: document.entries.length,
    errorCode: errors.length ? "invalid_input" : undefined,
  })

  return (
    <ToolPage
      tool="inspect"
      title=".env File Validator"
      description="Check an ENV file for malformed assignments, duplicate keys, empty values, missing references, and risky whitespace."
    >
      <div className="space-y-4">
        <EnvEditor
          tool="inspect"
          fileCount={1}
          id="validator-input"
          label="ENV file"
          description={`${document.entries.length} valid variables detected`}
          value={source}
          onChange={setSource}
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              Validation results
              <Badge variant={errors.length ? "destructive" : "outline"}>
                {errors.length} errors
              </Badge>
              <Badge variant="secondary">{warnings.length} warnings</Badge>
            </CardTitle>
            <CardDescription>
              Errors are invalid ENV syntax. Warnings flag values that may be
              accidental or behave differently between runtimes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!source.trim() ? (
              <div className="border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                Paste or load an ENV file to validate it.
              </div>
            ) : !document.issues.length ? (
              <Alert className="border-emerald-600/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300">
                <CheckCircle2Icon />
                <AlertTitle>No issues found</AlertTitle>
                <AlertDescription>
                  Every non-comment line is a valid assignment with a non-empty
                  value.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {document.issues.map((issue, index) => (
                  <Alert
                    key={`${issue.line}-${issue.message}-${index}`}
                    variant={
                      issue.severity === "error" ? "destructive" : "default"
                    }
                  >
                    {issue.severity === "error" ? (
                      <CircleXIcon />
                    ) : (
                      <AlertTriangleIcon />
                    )}
                    <AlertTitle className="flex flex-wrap items-center gap-2">
                      Line {issue.line}
                      {issue.key ? (
                        <code className="font-normal">{issue.key}</code>
                      ) : null}
                    </AlertTitle>
                    <AlertDescription>{issue.message}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolPage>
  )
}
