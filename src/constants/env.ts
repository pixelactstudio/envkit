export const ENV_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/
export const UNQUOTED_ENV_VALUE_PATTERN = /^[A-Za-z0-9_./:@%+,=-]+$/

export const INITIAL_COMPARE_FILES = [
  { id: 1, name: "File A", content: "" },
  { id: 2, name: "File B", content: "" },
]

export const ENV_OUTPUT_FILENAMES = {
  env: ".env",
  json: "environment.json",
  shell: "environment.sh",
  docker: "compose-environment.yml",
} as const
