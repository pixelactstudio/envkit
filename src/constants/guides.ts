export type Guide = {
  slug: string
  title: string
  description: string
  intro: string
  tool: { to: "/compare" | "/validator" | "/format"; label: string }
  sections: readonly {
    heading: string
    paragraphs: readonly string[]
    code?: string
    bullets?: readonly string[]
  }[]
}

export const GUIDES: readonly Guide[] = [
  {
    slug: "compare-env-and-env-example",
    title: "How to Compare .env and .env.example Files",
    description:
      "Compare a working .env file with .env.example, find missing variables, and keep the template useful without exposing secrets.",
    intro:
      "A real .env file contains local values. A committed .env.example should contain the same required keys, useful comments, and no credentials. Comparing them catches setup drift before it blocks another developer or deployment.",
    tool: { to: "/compare", label: "Compare your ENV files" },
    sections: [
      {
        heading: "Give each file one job",
        paragraphs: [
          "Use .env for machine-specific values and keep it out of version control. Use .env.example as the public contract: it tells people which variables exist without distributing working secrets.",
          "The key sets should normally match, but the values should not. A template may use empty values or safe placeholders where the expected format needs explanation.",
        ],
        code: ".env\nDATABASE_URL=postgres://user:secret@localhost/app\nPORT=3000\n\n.env.example\nDATABASE_URL=\nPORT=3000",
      },
      {
        heading: "Compare keys before values",
        paragraphs: [
          "Start by finding keys present in only one file. A key missing from .env.example leaves new contributors without setup guidance. A key missing from .env may cause a runtime failure or silently select an unsafe default.",
          "Then review changed values only where consistency matters. Ports or feature flags may intentionally differ, while variable names and required presence should remain stable.",
        ],
        bullets: [
          "Add undocumented application variables to .env.example without copying their values.",
          "Add missing local values through your normal secret-management process.",
          "Remove obsolete keys only after confirming the application no longer reads them.",
        ],
      },
      {
        heading: "Generate, review, and automate",
        paragraphs: [
          "EnvSift can generate a value-free template from a working file, but review comments because humans sometimes paste secrets into them. Commit the reviewed template, never the source .env file.",
          "In CI, compare the set of required keys from the application or .env.example with the deployment configuration. Fail on missing required keys, but allow environment-specific extras when they are intentional.",
        ],
      },
    ],
  },
  {
    slug: "validate-env-before-deployment",
    title: "How to Validate Environment Variables Before Deployment",
    description:
      "Validate dotenv syntax, duplicates, empty values, and missing references before configuration reaches production.",
    intro:
      "Environment configuration often fails at startup, far away from the commit that introduced the problem. A short validation pass catches structural mistakes before the deployment system or application has to interpret them.",
    tool: { to: "/validator", label: "Validate an ENV file" },
    sections: [
      {
        heading: "Separate syntax checks from service checks",
        paragraphs: [
          "Syntax validation answers whether a file can be parsed predictably. It can detect invalid names, malformed assignments, duplicates, empty values, unresolved references, and suspicious whitespace.",
          "It cannot prove that a database password is current or an API endpoint is reachable. Those are runtime checks and should use narrowly scoped health checks without printing credentials.",
        ],
      },
      {
        heading: "Treat duplicates as configuration debt",
        paragraphs: [
          "Many dotenv loaders keep the first or last duplicate assignment, but the behavior is not universal. A file with two PORT values forces readers to guess which one wins.",
          "Remove duplicates and keep one source of truth. If an environment needs a different value, store the override in that environment instead of leaving competing lines in one file.",
        ],
        code: "# Ambiguous\nPORT=3000\nPORT=8080\n\n# Clear\nPORT=8080",
      },
      {
        heading: "Use a deployment checklist",
        paragraphs: [
          "Validate the file, compare required keys against the template, and confirm that production-only variables are documented. Then run application startup validation so required values fail fast with names—not secret contents—in the error message.",
        ],
        bullets: [
          "Reject malformed assignments and unresolved required references.",
          "Review every empty value instead of treating all empties as errors.",
          "Never print the full environment during CI troubleshooting.",
          "Rotate any credential that appears in logs, comments, or version control.",
        ],
      },
    ],
  },
  {
    slug: "format-dotenv-node-docker-shell",
    title: "Format Dotenv Files Safely for Node, Docker, and Shell",
    description:
      "Format and convert environment variables without losing spaces, quotes, comments, or value meaning across runtimes.",
    intro:
      "Dotenv, shell, and Docker Compose all represent environment variables, but their parsers do not treat every character identically. Normalize deliberately and inspect generated output instead of copying syntax blindly between formats.",
    tool: { to: "/format", label: "Format a dotenv file" },
    sections: [
      {
        heading: "Quote only with a rule",
        paragraphs: [
          "Simple alphanumeric values can usually remain unquoted. Values containing spaces, comment characters, quotes, or shell-significant characters need a representation the target parser understands.",
          "Smart quoting is a safe default for dotenv output because it quotes values when necessary. A no-quotes formatter should reject unsafe values rather than change their meaning silently.",
        ],
        code: 'PORT=3000\nAPP_NAME="Example Service"\nMESSAGE="contains # text"',
      },
      {
        heading: "Do not confuse dotenv with shell",
        paragraphs: [
          "A dotenv file is parsed as data by a library. A shell export file is executed by a shell and therefore has different escaping and expansion rules. Convert to explicit export statements when a script needs shell syntax.",
          "Docker Compose can embed literal values or reference variables from the host environment. Choose reference mode when the Compose file should remain shareable without containing the values.",
        ],
        code: "# Shell\nexport PORT=3000\n\n# Docker Compose reference\nenvironment:\n  PORT: ${PORT}",
      },
      {
        heading: "Make diffs boring",
        paragraphs: [
          "A stable order and one assignment per key make configuration reviews easier. Sort keys when order has no semantic meaning, keep comments only when their relationship remains clear, and collapse duplicates after confirming which value should win.",
        ],
        bullets: [
          "Format a copy and review the diff before replacing the source.",
          "Keep secrets out of formatter logs and online tools that upload content.",
          "Validate after conversion because the target format may have stricter rules.",
        ],
      },
    ],
  },
  {
    slug: "prevent-environment-configuration-drift",
    title: "Prevent Configuration Drift Across Dev, Staging, and Production",
    description:
      "Keep environment-variable contracts aligned across development, staging, and production without forcing their secret values to match.",
    intro:
      "Configuration drift happens when environments stop sharing the same variable contract. The values should differ, but missing keys, stale names, and undocumented overrides create deployments that behave unpredictably.",
    tool: { to: "/compare", label: "Compare environments" },
    sections: [
      {
        heading: "Compare the contract, not the secrets",
        paragraphs: [
          "Treat variable names, required presence, and expected format as the contract. Keep actual values in the secret store for each environment. Comparing key sets reveals drift without requiring production credentials to be copied into local files.",
          "When values must be reviewed, mask them by default and reveal only the specific comparison needed. Differences such as DEBUG=false in production may be correct; unexplained missing keys are the higher-risk signal.",
        ],
      },
      {
        heading: "Use explicit precedence",
        paragraphs: [
          "Layered configuration is easier to reason about when precedence is written down: shared defaults first, environment overrides second, and runtime secrets last. Avoid merging files when nobody can state which source wins a conflict.",
        ],
        code: "shared.env < staging.env < runtime secret store\nshared.env < production.env < runtime secret store",
      },
      {
        heading: "Review drift as part of delivery",
        paragraphs: [
          "Add a key-set comparison to release preparation or CI. Require documentation for new variables and remove old variables from code, templates, and deployment configuration in the same change.",
        ],
        bullets: [
          "Keep one reviewed .env.example as the public contract.",
          "Compare every environment against that contract before release.",
          "Resolve missing variables through the secret manager, not chat or tickets.",
          "Record intentional environment-only keys so they do not become permanent mystery state.",
        ],
      },
    ],
  },
]

export function getGuide(slug: string) {
  return GUIDES.find((guide) => guide.slug === slug)
}
