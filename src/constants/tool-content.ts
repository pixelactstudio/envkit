import type { ToolName } from "@/lib/analytics"

type ToolContent = {
  heading: string
  intro: string
  steps: readonly string[]
  handles: readonly string[]
  example: string
  faqs: readonly { question: string; answer: string }[]
  guide: string
  related: readonly ToolName[]
}

export const TOOL_CONTENT: Record<ToolName, ToolContent> = {
  compare: {
    heading: "How to compare .env files",
    intro:
      "Use the ENV comparison tool to find configuration drift before a deployment. It compares keys and values across two or more dotenv files while keeping values hidden by default.",
    steps: [
      "Paste or load each .env file into a separate environment card.",
      "Review variables that are missing, different, or identical across every file.",
      "Copy the missing assignments for a specific environment, then review their values before use.",
    ],
    handles: [
      "Two or more development, staging, production, or .env.example files",
      "Missing variables and variables with different values",
      "Comments, blank lines, quoted values, and shell-style export prefixes",
      "Duplicate and malformed assignments reported by the shared ENV parser",
    ],
    example:
      ".env.example\nAPI_URL=\nLOG_LEVEL=\n\n.env.production\nAPI_URL=https://api.example.com\n\nResult: LOG_LEVEL is missing from production",
    faqs: [
      {
        question: "Are ENV values uploaded for comparison?",
        answer:
          "No. Files are read with the browser File API and compared in this tab. EnvSift does not send their contents, keys, values, or filenames to a server or analytics service.",
      },
      {
        question: "Can I compare more than two .env files?",
        answer:
          "Yes. Add as many environment cards as needed. The result shows missing keys per file and value differences across every complete row.",
      },
      {
        question: "Does EnvSift expose secret values in the result?",
        answer:
          "Values remain masked until you choose Reveal values. Missing-key exports should still be reviewed before they are copied into another environment.",
      },
    ],
    guide: "compare-env-and-env-example",
    related: ["inspect", "example", "merge"],
  },
  inspect: {
    heading: "How to validate an .env file",
    intro:
      "The ENV validator checks portable dotenv syntax and common configuration mistakes before the file reaches an application or CI pipeline.",
    steps: [
      "Paste or load the ENV file you want to validate.",
      "Fix syntax errors first, because malformed assignments cannot be interpreted safely.",
      "Review warnings for duplicate keys, empty values, unresolved references, and whitespace that runtimes may handle differently.",
    ],
    handles: [
      "Invalid or non-portable variable names",
      "Lines without a valid key-value assignment",
      "Duplicate keys and empty values",
      "References such as ${HOST} when HOST is not defined in the same file",
      "Leading or trailing whitespace that can change a value",
    ],
    example:
      "API URL=https://example.com\nPORT=3000\nPORT=4000\nTOKEN=\nAPI_URL=${HOST}/v1\n\nResult: invalid key, duplicate PORT, empty TOKEN, and missing HOST",
    faqs: [
      {
        question: "What does the ENV validator consider an error?",
        answer:
          "An error is a line EnvSift cannot safely parse as a portable key-value assignment. Warnings are valid assignments that may still cause unexpected behavior.",
      },
      {
        question: "Does validation prove that credentials work?",
        answer:
          "No. EnvSift validates file structure and references. It cannot connect to databases, APIs, or deployment platforms to verify a credential.",
      },
      {
        question: "Can I validate an .env.example file?",
        answer:
          "Yes. Empty values are expected in many templates, so review those warnings in context and focus on malformed or duplicate keys.",
      },
    ],
    guide: "validate-env-before-deployment",
    related: ["format", "compare", "example"],
  },
  format: {
    heading: "How to format a dotenv file",
    intro:
      "Normalize a dotenv file so configuration changes are easier to review. Choose a quote policy, preserve or remove comments, and sort variables without uploading the file.",
    steps: [
      "Paste or load the unformatted ENV file.",
      "Choose smart, always, or never quoting and decide whether to keep comments and order.",
      "Review the formatted result, then copy or download it as a new file.",
    ],
    handles: [
      "Consistent quoting for spaces and special characters",
      "Alphabetical ordering or original assignment order",
      "Comment preservation or removal",
      "Duplicate keys collapsed to their last valid assignment",
      "Unsafe unquoted values rejected instead of silently changed",
    ],
    example:
      'Before\nPORT = 3000\nAPP_NAME=My App\nPORT=4000\n\nAfter\nAPP_NAME="My App"\nPORT=4000',
    faqs: [
      {
        question: "Will formatting change ENV values?",
        answer:
          "Smart quoting preserves parsed values while normalizing their representation. The no-quotes option refuses values that would become unsafe without quotes.",
      },
      {
        question: "Which duplicate assignment is kept?",
        answer:
          "EnvSift keeps the last valid assignment for a duplicate key, matching the precedence used by many dotenv loaders.",
      },
      {
        question: "Can comments stay in their original positions?",
        answer:
          "Yes, when original order is selected. With alphabetical sorting, comments are collected above the sorted assignments so they are not attached to the wrong key.",
      },
    ],
    guide: "format-dotenv-node-docker-shell",
    related: ["inspect", "convert", "merge"],
  },
  example: {
    heading: "How to create a safe .env.example",
    intro:
      "Generate a shareable inventory of required environment variables from a working .env file. Assignment values are removed locally, while comments can be preserved for setup guidance.",
    steps: [
      "Paste or load the source .env file.",
      "Preserve its comments and order, or sort and deduplicate the keys.",
      "Review comments for manually written secrets before committing the generated template.",
    ],
    handles: [
      "Removal of every parsed assignment value",
      "Optional comment and blank-line preservation",
      "Sorted, deduplicated output when preferred",
      "Invalid and duplicate lines marked or omitted instead of copied as secrets",
    ],
    example:
      "Source\nDATABASE_URL=postgres://user:pass@localhost/app\nPORT=3000\n\nTemplate\nDATABASE_URL=\nPORT=",
    faqs: [
      {
        question: "Is the generated .env.example automatically safe to commit?",
        answer:
          "Assignment values are removed, but comments are human-written and may contain sensitive text. Always review the output before committing it.",
      },
      {
        question: "Should optional variables be included?",
        answer:
          "Usually yes. Document optional variables with comments and safe example guidance so teammates know they exist without receiving real credentials.",
      },
      {
        question: "What happens to duplicate keys?",
        answer:
          "Preserved-order output marks later duplicates as omitted. Sorted output emits each valid key once.",
      },
    ],
    guide: "compare-env-and-env-example",
    related: ["inspect", "compare", "format"],
  },
  merge: {
    heading: "How to merge and clean .env files",
    intro:
      "Combine two dotenv files into one stable result. You control which file wins conflicting values or resolve each conflict manually.",
    steps: [
      "Load the lower- and higher-priority ENV files into File A and File B.",
      "Choose a winning file for all conflicts, or select manual resolution.",
      "Review conflicts and download the alphabetically sorted merged file.",
    ],
    handles: [
      "Keys present in only one source file",
      "Identical assignments collapsed into one line",
      "Different values resolved by explicit precedence",
      "Duplicates within each file removed before merging",
      "Malformed input rejected with the source file and line number",
    ],
    example:
      "File A\nPORT=3000\nLOG_LEVEL=debug\n\nFile B\nPORT=8080\nAPI_URL=https://api.example.com\n\nFile B wins\nAPI_URL=https://api.example.com\nLOG_LEVEL=debug\nPORT=8080",
    faqs: [
      {
        question: "Which file wins conflicts by default?",
        answer:
          "File B wins by default. Change the selector to File A or manual resolution before using the output.",
      },
      {
        question: "Does merging preserve comments?",
        answer:
          "No. Merge output is a clean, sorted set of assignments. Use the formatter when preserving comments is important.",
      },
      {
        question: "Can EnvSift merge more than two files at once?",
        answer:
          "The merge tool handles two files so precedence stays explicit. Merge the result with another file when a third layer is needed.",
      },
    ],
    guide: "prevent-environment-configuration-drift",
    related: ["compare", "format", "convert"],
  },
  convert: {
    heading: "How to convert environment variable formats",
    intro:
      "Move a flat configuration between dotenv, JSON, shell export, and Docker Compose syntax while keeping every value in the browser.",
    steps: [
      "Select ENV or flat JSON as the input format and paste or load the source.",
      "Choose ENV, JSON, shell exports, or Docker Compose for the output.",
      "For Compose, choose literal values or references to host environment variables.",
    ],
    handles: [
      "ENV and shell export input",
      "Flat JSON objects with string, number, boolean, or null values",
      "Normalized dotenv and formatted JSON output",
      "Shell export statements and Docker Compose environment blocks",
      "Unsafe JSON integers and nested values rejected to prevent data loss",
    ],
    example:
      'ENV input\nPORT=3000\nDEBUG=true\n\nJSON output\n{\n  "DEBUG": "true",\n  "PORT": "3000"\n}',
    faqs: [
      {
        question: "Does JSON conversion preserve value types?",
        answer:
          "ENV values are strings, so ENV-to-JSON output uses strings. JSON input values are converted to their string representation when targeting an ENV format.",
      },
      {
        question: "Are nested JSON objects supported?",
        answer:
          "No. Environment variables are flat key-value pairs, so nested objects and arrays are rejected instead of being flattened ambiguously.",
      },
      {
        question: "What is the difference between Docker value modes?",
        answer:
          "Literal mode writes the values into the Compose block. Reference mode writes expressions such as ${PORT} so Compose reads the host variable at runtime.",
      },
    ],
    guide: "format-dotenv-node-docker-shell",
    related: ["format", "merge", "inspect"],
  },
}
