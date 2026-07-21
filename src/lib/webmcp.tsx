import { useEffect } from "react"

import {
  compareManyEnvs,
  convertEnvironment,
  formatEnvFile,
  generateExample,
  mergeEnvs,
  parseEnv,
} from "@/lib/env"
import { contentSizeBucket, useAnalytics } from "@/lib/analytics"
import type { WebMcpToolName } from "@/lib/analytics"

const MAX_INPUT_LENGTH = 100_000
const annotations = { readOnlyHint: true, untrustedContentHint: true }
const sourceSchema = {
  type: "string",
  maxLength: MAX_INPUT_LENGTH,
  description: "ENV content explicitly provided to the browser agent.",
}

type ToolInput = Record<string, unknown>
type WebMcpTool = {
  name: WebMcpToolName
  description: string
  inputSchema: Record<string, unknown>
  annotations: typeof annotations
  execute: (input: ToolInput) => string
}
type ModelContext = {
  registerTool: (
    tool: Omit<WebMcpTool, "execute"> & {
      execute: (input: ToolInput) => string | Promise<string>
    },
    options?: { signal?: AbortSignal }
  ) => Promise<void>
}

function requiredString(input: ToolInput, key: string) {
  const value = input[key]
  if (typeof value !== "string") throw new Error(`${key} must be a string.`)
  if (value.length > MAX_INPUT_LENGTH)
    throw new Error(`${key} exceeds the ${MAX_INPUT_LENGTH} character limit.`)
  return value
}

function booleanOption(input: ToolInput, key: string, fallback: boolean) {
  const value = input[key]
  if (value === undefined) return fallback
  if (typeof value !== "boolean") throw new Error(`${key} must be a boolean.`)
  return value
}

function enumOption<const T extends readonly string[]>(
  input: ToolInput,
  key: string,
  values: T,
  fallback: T[number]
) {
  const value = input[key]
  if (value === undefined) return fallback
  if (typeof value !== "string" || !values.includes(value)) {
    throw new Error(`${key} must be one of: ${values.join(", ")}.`)
  }
  return value as T[number]
}

function validEnv(source: string, label = "source") {
  const document = parseEnv(source)
  const error = document.issues.find(({ severity }) => severity === "error")
  if (error) throw new Error(`${label} line ${error.line}: ${error.message}`)
  return document
}

function inputLength(input: ToolInput) {
  return Object.values(input).reduce<number>((total, value) => {
    if (typeof value === "string") return total + value.length
    if (Array.isArray(value)) {
      return (
        total +
        value.reduce<number>((sum, item) => {
          return sum + (typeof item === "string" ? item.length : 0)
        }, 0)
      )
    }
    return total
  }, 0)
}

export const WEBMCP_TOOLS: WebMcpTool[] = [
  {
    name: "compare_env_files",
    description:
      "Compare two to six ENV files and return missing or changed variable names. Only use content the user chose to share with the browser agent.",
    inputSchema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          minItems: 2,
          maxItems: 6,
          items: sourceSchema,
          description: "ENV file contents in comparison order.",
        },
      },
      required: ["files"],
      additionalProperties: false,
    },
    annotations,
    execute(input) {
      const files = input.files
      if (
        !Array.isArray(files) ||
        files.length < 2 ||
        files.length > 6 ||
        files.some(
          (file) => typeof file !== "string" || file.length > MAX_INPUT_LENGTH
        )
      ) {
        throw new Error("files must contain two to six ENV strings.")
      }
      files.forEach((file, index) => validEnv(file, `file ${index + 1}`))
      const result = compareManyEnvs(files)
      return JSON.stringify({
        variable_count: result.rows.length,
        missing: result.missing.slice(0, 50).map(({ key, entries }) => ({
          key,
          missing_in: entries.flatMap((entry, index) =>
            entry ? [] : [index + 1]
          ),
        })),
        changed: result.different.slice(0, 50).map(({ key }) => key),
        same_count: result.same.length,
        truncated: result.missing.length > 50 || result.different.length > 50,
      })
    },
  },
  {
    name: "validate_env_file",
    description:
      "Validate ENV syntax and report issue lines without returning values. Only use content the user chose to share with the browser agent.",
    inputSchema: {
      type: "object",
      properties: { source: sourceSchema },
      required: ["source"],
      additionalProperties: false,
    },
    annotations,
    execute(input) {
      const document = parseEnv(requiredString(input, "source"))
      return JSON.stringify({
        variable_count: document.entries.length,
        issues: document.issues.slice(0, 50),
        duplicate_keys: document.duplicateKeys.slice(0, 50),
        truncated:
          document.issues.length > 50 || document.duplicateKeys.length > 50,
      })
    },
  },
  {
    name: "format_env_file",
    description:
      "Format an ENV file with explicit quote, sorting, and comment options. Only use content the user chose to share with the browser agent.",
    inputSchema: {
      type: "object",
      properties: {
        source: sourceSchema,
        quotes: { type: "string", enum: ["smart", "always", "never"] },
        sort: { type: "boolean" },
        keep_comments: { type: "boolean" },
      },
      required: ["source"],
      additionalProperties: false,
    },
    annotations,
    execute(input) {
      const result = formatEnvFile(
        requiredString(input, "source"),
        enumOption(input, "quotes", ["smart", "always", "never"], "smart"),
        booleanOption(input, "sort", true),
        booleanOption(input, "keep_comments", true)
      )
      if (result.error) throw new Error(result.error)
      return result.output
    },
  },
  {
    name: "generate_env_example",
    description:
      "Remove ENV values to create a shareable .env.example. Only use content the user chose to share with the browser agent.",
    inputSchema: {
      type: "object",
      properties: {
        source: sourceSchema,
        sort: { type: "boolean" },
      },
      required: ["source"],
      additionalProperties: false,
    },
    annotations,
    execute(input) {
      return generateExample(
        requiredString(input, "source"),
        booleanOption(input, "sort", false)
      )
    },
  },
  {
    name: "merge_env_files",
    description:
      "Merge two valid ENV files with deterministic conflict precedence. Only use content the user chose to share with the browser agent.",
    inputSchema: {
      type: "object",
      properties: {
        left: sourceSchema,
        right: sourceSchema,
        winner: { type: "string", enum: ["left", "right"] },
      },
      required: ["left", "right"],
      additionalProperties: false,
    },
    annotations,
    execute(input) {
      const result = mergeEnvs(
        requiredString(input, "left"),
        requiredString(input, "right"),
        enumOption(input, "winner", ["left", "right"], "right")
      )
      if (result.error) throw new Error(result.error)
      return result.output
    },
  },
  {
    name: "convert_env_file",
    description:
      "Convert ENV or flat JSON into ENV, JSON, shell exports, or Docker Compose. Only use content the user chose to share with the browser agent.",
    inputSchema: {
      type: "object",
      properties: {
        source: sourceSchema,
        input: { type: "string", enum: ["env", "json"] },
        output: { type: "string", enum: ["env", "json", "shell", "docker"] },
        docker_mode: { type: "string", enum: ["values", "references"] },
      },
      required: ["source", "input", "output"],
      additionalProperties: false,
    },
    annotations,
    execute(input) {
      return convertEnvironment(
        requiredString(input, "source"),
        enumOption(input, "input", ["env", "json"], "env"),
        enumOption(input, "output", ["env", "json", "shell", "docker"], "json"),
        enumOption(input, "docker_mode", ["values", "references"], "values")
      )
    },
  },
]

export function WebMcp() {
  const track = useAnalytics()

  useEffect(() => {
    const modelContext = (
      document as Document & { modelContext?: ModelContext }
    ).modelContext
    if (!modelContext) return

    const controller = new AbortController()
    WEBMCP_TOOLS.forEach((tool) => {
      void modelContext
        .registerTool(
          {
            ...tool,
            execute: async (input) => {
              try {
                const output = tool.execute(input)
                track("webmcp tool called", {
                  tool: tool.name,
                  result: "success",
                  input_size: contentSizeBucket(inputLength(input)),
                })
                return output
              } catch (error) {
                track("webmcp tool called", {
                  tool: tool.name,
                  result: "failure",
                  input_size: contentSizeBucket(inputLength(input)),
                })
                throw error
              }
            },
          },
          { signal: controller.signal }
        )
        .catch(() => {
          // Unsupported permission policies leave the visible app unaffected.
        })
    })

    return () => controller.abort()
  }, [track])

  return null
}
