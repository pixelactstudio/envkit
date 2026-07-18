import { ENV_KEY_PATTERN, UNQUOTED_ENV_VALUE_PATTERN } from "@/constants/env"

export type EnvEntry = {
  key: string
  value: string
  line: number
}

export type EnvIssue = {
  severity: "error" | "warning"
  line: number
  key?: string
  message: string
}

export type EnvDocument = {
  entries: EnvEntry[]
  issues: EnvIssue[]
  duplicateKeys: string[]
}

export type EnvFormat = "env" | "json" | "shell" | "docker"
export type EnvQuoteMode = "smart" | "always" | "never"
export type MergeWinner = "left" | "right" | "manual"
export type MergeResolution = "left" | "right"
export type DockerValueMode = "values" | "references"

function assignment(line: string) {
  const match = line.trim().match(/^(?:export\s+)?([^=]+?)\s*=(.*)$/)

  return match ? { key: match[1].trim(), rawValue: match[2].trim() } : undefined
}

function decodeValue(rawValue: string) {
  if (
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"))
  ) {
    if (rawValue.startsWith('"')) {
      try {
        return JSON.parse(rawValue) as string
      } catch {
        // Dotenv quoting is looser than JSON; removing the quotes is still safe.
      }
    }

    return rawValue.slice(1, -1)
  }

  return rawValue.replace(/\s+#.*$/, "").trimEnd()
}

function uniqueEntries(entries: EnvEntry[]) {
  const byKey = new Map<string, EnvEntry>()
  entries.forEach((entry) => byKey.set(entry.key, entry))
  return [...byKey.values()]
}

export function parseEnv(source: string): EnvDocument {
  const entries: EnvEntry[] = []
  const issues: EnvIssue[] = []
  const counts = new Map<string, number>()

  source.split(/\r?\n/).forEach((rawLine, index) => {
    const line = index + 1
    const trimmed = rawLine.trim()

    if (!trimmed || trimmed.startsWith("#")) return

    const parsed = assignment(rawLine)

    if (!parsed || !ENV_KEY_PATTERN.test(parsed.key)) {
      issues.push({
        severity: "error",
        line,
        message: "Expected a portable KEY=value assignment.",
      })
      return
    }

    if (rawLine !== trimmed) {
      issues.push({
        severity: "warning",
        line,
        key: parsed.key,
        message:
          "Leading or trailing whitespace may behave differently across runtimes.",
      })
    }

    const quote = parsed.rawValue[0]
    if ((quote === '"' || quote === "'") && !parsed.rawValue.endsWith(quote)) {
      issues.push({
        severity: "error",
        line,
        key: parsed.key,
        message: "The quoted value is not closed on this line.",
      })
    }

    const value = decodeValue(parsed.rawValue)
    entries.push({ key: parsed.key, value, line })

    const count = (counts.get(parsed.key) ?? 0) + 1
    counts.set(parsed.key, count)
    if (count > 1) {
      issues.push({
        severity: "warning",
        line,
        key: parsed.key,
        message: "Duplicate key; the last value usually wins.",
      })
    }

    if (!value) {
      issues.push({
        severity: "warning",
        line,
        key: parsed.key,
        message: "This variable has an empty value.",
      })
    }
  })

  const keys = new Set(entries.map(({ key }) => key))
  entries.forEach((entry) => {
    const references = entry.value.matchAll(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g)
    for (const match of references) {
      if (!keys.has(match[1])) {
        issues.push({
          severity: "warning",
          line: entry.line,
          key: entry.key,
          message: `References missing variable ${match[1]}.`,
        })
      }
    }
  })

  return {
    entries,
    issues,
    duplicateKeys: [...counts]
      .filter(([, count]) => count > 1)
      .map(([key]) => key),
  }
}

export function compareEnvs(left: string, right: string) {
  const leftEntries = new Map(
    uniqueEntries(parseEnv(left).entries).map((entry) => [entry.key, entry])
  )
  const rightEntries = new Map(
    uniqueEntries(parseEnv(right).entries).map((entry) => [entry.key, entry])
  )
  const keys = [
    ...new Set([...leftEntries.keys(), ...rightEntries.keys()]),
  ].sort()
  const onlyLeft: EnvEntry[] = []
  const onlyRight: EnvEntry[] = []
  const same: Array<{ left: EnvEntry; right: EnvEntry }> = []
  const changed: Array<{ left: EnvEntry; right: EnvEntry }> = []

  keys.forEach((key) => {
    const leftEntry = leftEntries.get(key)
    const rightEntry = rightEntries.get(key)

    if (!rightEntry && leftEntry) onlyLeft.push(leftEntry)
    else if (!leftEntry && rightEntry) onlyRight.push(rightEntry)
    else if (leftEntry && rightEntry) {
      ;(leftEntry.value === rightEntry.value ? same : changed).push({
        left: leftEntry,
        right: rightEntry,
      })
    }
  })

  return { onlyLeft, onlyRight, same, changed }
}

export function compareManyEnvs(sources: string[]) {
  const files = sources.map(
    (source) =>
      new Map(
        uniqueEntries(parseEnv(source).entries).map((entry) => [
          entry.key,
          entry,
        ])
      )
  )
  const keys = [...new Set(files.flatMap((file) => [...file.keys()]))].sort()
  const rows = keys.map((key) => ({
    key,
    entries: files.map((file) => file.get(key)),
  }))
  const missing = rows.filter(({ entries }) => entries.some((entry) => !entry))
  const complete = rows.filter(({ entries }) => entries.every(Boolean))
  const different = complete.filter(
    ({ entries }) => new Set(entries.map((entry) => entry?.value)).size > 1
  )
  const same = complete.filter(
    ({ entries }) => new Set(entries.map((entry) => entry?.value)).size === 1
  )
  const missingByFile = files.map((_, fileIndex) =>
    missing.flatMap(({ entries }) => {
      if (entries[fileIndex]) return []

      const source = entries.find((entry) => entry !== undefined)
      if (!source) return []

      const values = new Set(
        entries.flatMap((entry) => (entry ? [entry.value] : []))
      )
      return [{ ...source, value: values.size === 1 ? source.value : "" }]
    })
  )

  return { rows, missing, different, same, missingByFile }
}

function encodeEnvValue(value: string) {
  return value && UNQUOTED_ENV_VALUE_PATTERN.test(value)
    ? value
    : value
      ? JSON.stringify(value)
      : ""
}

export function formatEnvFile(
  source: string,
  quotes: EnvQuoteMode = "smart",
  sort = true,
  keepComments = true
) {
  const document = parseEnv(source)
  const error = document.issues.find(({ severity }) => severity === "error")
  if (error) {
    return {
      output: "",
      error: `Line ${error.line}: ${error.message}`,
      duplicates: document.duplicateKeys.length,
      comments: 0,
    }
  }

  const entries = uniqueEntries(document.entries)
  if (sort) entries.sort((a, b) => a.key.localeCompare(b.key))
  const comments = source
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith("#"))

  const unsafe =
    quotes === "never"
      ? entries.find(
          ({ value }) => value && !UNQUOTED_ENV_VALUE_PATTERN.test(value)
        )
      : undefined
  if (unsafe) {
    return {
      output: "",
      error: `${unsafe.key} needs quotes because its value contains spaces or special characters.`,
      duplicates: document.duplicateKeys.length,
      comments: 0,
    }
  }

  const formatEntry = ({ key, value }: EnvEntry) => {
    const formatted =
      quotes === "always"
        ? JSON.stringify(value)
        : quotes === "never"
          ? value
          : encodeEnvValue(value)
    return `${key}=${formatted}`
  }
  const assignments = entries.map(formatEntry)
  const output = keepComments
    ? sort
      ? [
          ...comments,
          ...(comments.length && assignments.length ? [""] : []),
          ...assignments,
        ].join("\n")
      : (() => {
          const entriesByLine = new Map(
            entries.map((entry) => [entry.line, entry])
          )
          return source
            .split(/\r?\n/)
            .flatMap((line, index) => {
              if (!line.trim() || line.trimStart().startsWith("#")) {
                return [line.trimEnd()]
              }
              const entry = entriesByLine.get(index + 1)
              return entry ? [formatEntry(entry)] : []
            })
            .join("\n")
            .replace(/\n{3,}/g, "\n\n")
            .trim()
        })()
    : assignments.join("\n")

  return {
    output,
    error: "",
    duplicates: document.duplicateKeys.length,
    comments: comments.length,
  }
}

export function formatEnv(entries: Array<Pick<EnvEntry, "key" | "value">>) {
  return [...entries]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(({ key, value }) => `${key}=${encodeEnvValue(value)}`)
    .join("\n")
}

export function generateExample(source: string, sort = false) {
  if (sort) {
    return uniqueEntries(parseEnv(source).entries)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map(({ key }) => `${key}=`)
      .join("\n")
  }

  const seen = new Set<string>()
  return source
    .split(/\r?\n/)
    .map((line, index) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) return line

      const parsed = assignment(line)
      if (!parsed || !ENV_KEY_PATTERN.test(parsed.key)) {
        return `# Invalid line ${index + 1} omitted`
      }
      if (seen.has(parsed.key)) return `# Duplicate ${parsed.key} omitted`

      seen.add(parsed.key)
      return `${parsed.key}=`
    })
    .join("\n")
}

export function mergeEnvs(
  left: string,
  right: string,
  winner: MergeWinner = "right",
  resolutions: Partial<Record<string, MergeResolution>> = {}
) {
  const leftDocument = parseEnv(left)
  const rightDocument = parseEnv(right)
  const leftError = leftDocument.issues.find(
    ({ severity }) => severity === "error"
  )
  const rightError = rightDocument.issues.find(
    ({ severity }) => severity === "error"
  )
  const error = leftError
    ? `File A line ${leftError.line}: ${leftError.message}`
    : rightError
      ? `File B line ${rightError.line}: ${rightError.message}`
      : ""

  if (error)
    return {
      output: "",
      conflicts: 0,
      conflictEntries: [],
      unresolved: 0,
      total: 0,
      error,
    }

  const leftEntries = uniqueEntries(leftDocument.entries)
  const rightEntries = uniqueEntries(rightDocument.entries)
  const leftMap = new Map(leftEntries.map((entry) => [entry.key, entry]))
  const rightMap = new Map(rightEntries.map((entry) => [entry.key, entry]))
  const conflictEntries = [...leftMap].flatMap(([key, entry]) => {
    const rightEntry = rightMap.get(key)
    return rightEntry && rightEntry.value !== entry.value
      ? [{ key, left: entry, right: rightEntry }]
      : []
  })
  const keys = [...new Set([...leftMap.keys(), ...rightMap.keys()])].sort()
  const merged = new Map<string, EnvEntry>()
  let unresolved = 0

  keys.forEach((key) => {
    const leftEntry = leftMap.get(key)
    const rightEntry = rightMap.get(key)
    if (!leftEntry || !rightEntry || leftEntry.value === rightEntry.value) {
      merged.set(key, rightEntry ?? leftEntry!)
      return
    }

    const choice = winner === "manual" ? resolutions[key] : winner
    if (!choice) {
      unresolved += 1
      return
    }
    merged.set(key, choice === "left" ? leftEntry : rightEntry)
  })

  return {
    output: unresolved ? "" : formatEnv([...merged.values()]),
    conflicts: conflictEntries.length,
    conflictEntries,
    unresolved,
    total: keys.length,
    error: "",
  }
}

function entriesFromJson(source: string): EnvEntry[] {
  const parsed: unknown = JSON.parse(source)
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("JSON input must be a flat object.")
  }

  return Object.entries(parsed).map(([key, value]) => {
    if (!ENV_KEY_PATTERN.test(key))
      throw new Error(`${key} is not a portable ENV key.`)
    if (value !== null && typeof value === "object") {
      throw new Error(`${key} has a nested value; only flat JSON is supported.`)
    }

    return { key, value: value === null ? "" : String(value), line: 1 }
  })
}

export function convertEnvironment(
  source: string,
  input: "env" | "json",
  output: EnvFormat,
  dockerMode: DockerValueMode = "values"
) {
  if (!source.trim()) return ""

  const entries =
    input === "json"
      ? entriesFromJson(source)
      : (() => {
          const document = parseEnv(source)
          const error = document.issues.find(
            ({ severity }) => severity === "error"
          )
          if (error) throw new Error(`Line ${error.line}: ${error.message}`)
          return uniqueEntries(document.entries)
        })()
  const sorted = [...entries].sort((a, b) => a.key.localeCompare(b.key))

  if (output === "env") return formatEnv(sorted)
  if (output === "json") {
    return JSON.stringify(
      Object.fromEntries(sorted.map(({ key, value }) => [key, value])),
      null,
      2
    )
  }
  if (output === "shell") {
    return sorted
      .map(
        ({ key, value }) => `export ${key}='${value.replaceAll("'", `'"'"'`)}'`
      )
      .join("\n")
  }

  return [
    "environment:",
    ...sorted.map(({ key, value }) =>
      dockerMode === "references"
        ? `  ${key}: \${${key}}`
        : `  ${key}: ${JSON.stringify(value.replaceAll("$", () => "$$"))}`
    ),
  ].join("\n")
}
