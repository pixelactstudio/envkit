import { describe, expect, it } from "vitest"

import {
  compareManyEnvs,
  compareEnvs,
  convertEnvironment,
  formatEnvFile,
  generateExample,
  mergeEnvs,
  parseEnv,
} from "./env"

describe("ENV helpers", () => {
  it("parses, compares, redacts, merges, and converts without exposing input", () => {
    const left = "# app\nPORT=3000\nTOKEN='secret value'\nPORT=4000"
    const right = "PORT=4000\nHOST=localhost"

    expect(parseEnv(left).duplicateKeys).toEqual(["PORT"])
    expect(compareEnvs(left, right)).toMatchObject({
      onlyLeft: [{ key: "TOKEN" }],
      onlyRight: [{ key: "HOST" }],
      same: [{ left: { key: "PORT" } }],
      changed: [],
    })
    expect(generateExample(left)).not.toContain("secret value")
    expect(mergeEnvs(left, right).output).toBe(
      'HOST=localhost\nPORT=4000\nTOKEN="secret value"'
    )
    expect(mergeEnvs("VALID=yes\nnot valid", right).error).toContain(
      "File A line 2"
    )
    expect(convertEnvironment('{"PORT":3000}', "json", "shell")).toBe(
      "export PORT='3000'"
    )
    expect(
      convertEnvironment("NEXT_PUBLIC_GOOGLE_FONT_API_KEY=value", "env", "json")
    ).toContain("NEXT_PUBLIC_GOOGLE_FONT_API_KEY")
    expect(
      compareManyEnvs(["PORT=3000\nHOST=local", "PORT=4000", "PORT=3000"])
    ).toMatchObject({
      missing: [{ key: "HOST" }],
      different: [{ key: "PORT" }],
      same: [],
    })
    expect(formatEnvFile("B='two words'\nA=one", "always").output).toBe(
      'A="one"\nB="two words"'
    )
    expect(
      formatEnvFile("# Service\nB=two\nA=one", "smart", true, true).output
    ).toBe("# Service\n\nA=one\nB=two")
    expect(formatEnvFile("# Service\nB=two", "smart", true, false).output).toBe(
      "B=two"
    )
    expect(
      mergeEnvs("A=one\nLEFT=yes", "A=two\nRIGHT=yes", "manual")
    ).toMatchObject({ output: "", unresolved: 1 })
    expect(
      mergeEnvs("A=one\nLEFT=yes", "A=two\nRIGHT=yes", "manual", {
        A: "left",
      }).output
    ).toBe("A=one\nLEFT=yes\nRIGHT=yes")
    expect(
      convertEnvironment("DISCORD_API_ID=123", "env", "docker", "references")
    ).toBe("environment:\n  DISCORD_API_ID: ${DISCORD_API_ID}")
    expect(
      convertEnvironment("SECRET=${HOST_SECRET}", "env", "docker", "values")
    ).toBe('environment:\n  SECRET: "$${HOST_SECRET}"')
  })

  it("rejects JSON integers that cannot be represented exactly", () => {
    expect(() =>
      convertEnvironment('{"ID":9007199254740993}', "json", "env")
    ).toThrow("JSON number 9007199254740993 is outside the safe integer range")
  })

  it("handles quoted multiline values across every output path", () => {
    const value =
      "-----BEGIN PRIVATE KEY-----\nprivate-key-data\n-----END PRIVATE KEY-----"
    const source = `PRIVATE_KEY="${value}"\nPORT=3000`
    const encoded = `PRIVATE_KEY=${JSON.stringify(value)}`

    const document = parseEnv(source)
    expect(document.issues).toEqual([])
    expect(document.entries[0]).toEqual({ key: "PRIVATE_KEY", value, line: 1 })
    expect(formatEnvFile(source, "smart", false, false).output).toBe(
      `${encoded}\nPORT=3000`
    )
    expect(
      JSON.parse(convertEnvironment(source, "env", "json")).PRIVATE_KEY
    ).toBe(value)
    expect(mergeEnvs(source, "HOST=localhost")).toMatchObject({
      error: "",
      output: `HOST=localhost\nPORT=3000\n${encoded}`,
    })
  })
})
