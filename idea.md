# EnvSift Product Idea

## Summary

EnvSift starts as a collection of free, client-side environment-variable tools and can grow into an authenticated environment configuration intelligence platform.

The authenticated product should help developers answer:

- Which environment variables does this codebase actually use?
- Which variables are documented, missing, unused, or inconsistent?
- Which variables belong in development, CI, staging, and production?
- When did the environment contract change, and who changed it?
- Can the repository documentation be updated safely through a reviewed pull request?

EnvSift should not become a traditional secret vault initially. Secret values should remain on the developer's machine or existing deployment provider.

## Product principles

1. Existing utilities remain usable without an account.
2. Authentication unlocks persistence, collaboration, automation, and history—not basic formatting or comparison.
3. Environment files and secret values are processed locally by default.
4. The server stores variable names, metadata, findings, and scan history, but not secret values.
5. Deterministic scanning produces facts; AI only produces reviewable suggestions.
6. Repository writes happen through visible pull requests, never silent commits to the default branch.
7. Permissions are requested only when a feature needs them.

## Free client-side toolkit

The current public tools remain the entry point:

- Compare ENV files
- Generate `.env.example`
- Inspect ENV files
- Merge and clean ENV files
- Format ENV files
- Convert ENV, JSON, shell, and Docker Compose formats

These tools establish trust because developers can use them without uploading credentials or creating an account.

## Authenticated projects

A saved project represents a codebase and its environment contract.

It can contain:

- Connected GitHub repository
- Development, preview, CI, staging, and production environments
- Detected environment-variable references
- Required and optional variables
- Descriptions and example values
- Expected type or format
- Public or sensitive classification
- Categories such as Database, Authentication, Email, Payments, and Observability
- Variable ownership and comments
- Scan history and environment health reports

An environment contract is an `.env.example` with structured metadata. It documents what the application expects without storing the application's real credentials.

## Three sources of environment truth

No single scanner can see the complete environment configuration. EnvSift combines three sources.

### 1. GitHub repository scan

The repository scan can inspect committed files for:

- Code references such as `process.env.NAME`, `import.meta.env.NAME`, and equivalent patterns in other languages
- `.env.example` and other committed ENV templates
- Dockerfiles and Docker Compose files
- GitHub Actions workflows
- Framework configuration files
- Deployment manifests
- Documentation mentioning required variables

GitHub cannot see local `.env` files that are correctly ignored by Git, so repository scans alone cannot claim that a developer or deployment is configured correctly.

### 2. Local CLI scan

A local CLI can inspect the repository and gitignored environment files on the developer's machine.

Possible commands:

```bash
npx envsift scan
npx envsift check
npx envsift check --environment development
npx envsift check --ci
```

The CLI should upload only variable names, presence status, findings, source locations, repository identity, and commit identity. It should never upload variable values.

### 3. CI and deployment reports

CI jobs and deployment integrations can report whether required keys are present in an environment without revealing their values.

This is needed for truthful staging and production coverage. A GitHub repository scan cannot know which variables exist in Vercel, Railway, Netlify, or another deployment platform.

## Environment coverage dashboard

The primary authenticated view can be a coverage matrix:

| Variable       | Used in code | Example | Local | CI  | Staging | Production |
| -------------- | ------------ | ------- | ----- | --- | ------- | ---------- |
| `DATABASE_URL` | Yes          | Yes     | Yes   | Yes | Yes     | Yes        |
| `REDIS_URL`    | Yes          | No      | Yes   | Yes | Missing | Unknown    |
| `OLD_API_KEY`  | No           | Yes     | No    | No  | Unknown | Unknown    |

Useful statuses include:

- Healthy
- Missing
- Unexpected
- Empty
- Invalid
- Undocumented
- Unused
- Unknown or not recently checked

Health reports should record when an environment was checked, which repository commit was checked, and which user or machine submitted the result.

## GitHub integration

GitHub login provides user identity. Repository scanning should use a GitHub App installed only on repositories selected by the user.

The default installation should be read-only and limited to the content and metadata needed for scanning.

Write permissions should be requested separately only when the user chooses to create a pull request.

A connected repository can be rescanned:

- Manually
- After relevant pushes
- From CI
- On a limited schedule

Repository checkouts used for server-side scanning should be temporary and removed after the scan completes.

## Scanner output

The scanner can produce:

- Variables used in code but missing from `.env.example`
- Variables documented but no longer used
- Variables duplicated across files
- Variables referenced inconsistently
- Variables used only by a particular service or package
- Variables referenced by CI or deployment configuration
- Public client variables and server-only variables
- Suggested environment coverage
- Source locations for every detected reference

Every result should link back to evidence in the repository instead of presenting an unexplained conclusion.

## AI-assisted analysis

AI can improve the generated contract after deterministic scanning has established the facts.

Useful AI suggestions include:

- Categorizing related variables
- Generating descriptions from nearby code
- Suggesting which environments may require a variable
- Identifying related or possibly duplicated variables
- Proposing a cleaned `.env.example`
- Summarizing changes between scans

AI should not:

- Receive real secret values
- Decide conclusively whether a variable is required
- Automatically delete variables
- Make security claims based only on variable names
- Commit changes without user review

AI output remains a suggestion until a user accepts it.

## Pull-request workflow

EnvSift can generate repository changes such as:

- A new or updated `.env.example`
- An EnvSift project configuration file
- Missing variable documentation
- Comments and grouping improvements
- Removal of confirmed stale entries

The safe workflow is:

```text
Scan repository
→ Generate proposed changes
→ Show the exact diff
→ Create a branch
→ Open a pull request
→ Let the repository's normal review rules decide
```

Direct commits to the default branch are deliberately excluded.

## Teams and history

GitHub identity and repository permissions can provide much of the initial collaboration model.

EnvSift can add:

- Project members and simple owner/editor/viewer access
- Comments and ownership on variable definitions
- Scan attribution
- Health-report history
- Contract change summaries
- Links from EnvSift changes to Git commits and pull requests

Git remains the version history for generated repository files. EnvSift stores scan snapshots and dashboard activity instead of building a second source-control system.

## CI checks

The same scanner should power the CLI and CI integration.

A check can fail when:

- Code introduces a new variable without updating the contract
- A required variable is absent from the target environment
- A removed variable remains in the template
- The environment contract contains invalid entries

CI tokens should be scoped to one project and should provide access only to the contract and report-submission endpoint.

## Features to consider later

### Secure secret requests

A user could request selected missing values through an expiring, client-encrypted link. The server would store ciphertext only, while the decryption key remains with the participants.

This still creates meaningful security responsibility and should not be treated as a simple sharing feature.

### Deployment integrations

Integrations with platforms such as Vercel, Railway, Netlify, and GitHub Actions could report key presence or create reviewed synchronization changes.

They should begin as read-only health integrations. Writing or synchronizing values requires a separate security review and explicit permissions.

### Framework presets

Built-in detection rules and presets may help explain common variables for frameworks and services. A public community-template marketplace should wait until repeated usage proves that publishing and moderation are worthwhile.

## Explicitly deferred

EnvSift should not initially provide:

- A hosted secret vault
- Plaintext secret storage
- Secret rotation
- Automatic production synchronization
- Silent repository commits
- Enterprise SSO or complex RBAC
- Kubernetes secret management
- AI access to secret values

These features change EnvSift from a configuration intelligence product into security-critical infrastructure.

## Ideal product loop

```text
Use a free local ENV tool
→ Connect a GitHub repository
→ Scan committed configuration
→ Review the generated environment contract
→ Run local or CI checks
→ View environment coverage and drift
→ Receive reports after code changes
→ Open a pull request to update documentation
```

## Product position

EnvSift is not another place to store secrets.

It is the place where a team understands which environment variables an application needs, where they are expected, whether each environment is healthy, and how that contract changes over time.
