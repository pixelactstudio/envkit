<div align="center">
  <img src="./public/envsift-mark.svg" alt="EnvSift" width="56" height="56" />
  <h1>EnvSift</h1>
  <p>Private, client-side tools for working with environment variables.</p>
</div>

EnvSift helps developers compare, inspect, format, merge, redact, and convert
`.env` files without sending their contents to a server. Pasted values and
local files are processed in the browser.

## Tools

| Tool                     | Purpose                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| ENV Compare              | Find missing or changed variables across two or more files.                                   |
| `.env.example` Generator | Remove values and create a safe template.                                                     |
| ENV Inspector            | Detect invalid lines, duplicate keys, empty values, missing references, and risky whitespace. |
| Merge & Clean            | Merge two files with automatic or manual conflict resolution.                                 |
| ENV Formatter            | Normalize quotes and ordering while optionally preserving comments.                           |
| Format Converter         | Convert ENV or flat JSON to ENV, JSON, shell exports, or Docker Compose syntax.               |

## Getting started

Requirements: Node.js and pnpm.

```bash
git clone https://github.com/pixelactstudio/envsift.git
cd envsift
pnpm install
cp .env.example .env.local
pnpm dev
```

The development server runs at [http://localhost:3000](http://localhost:3000).
Analytics is disabled unless `VITE_POSTHOG_KEY` is set. The host is optional and
defaults to PostHog US Cloud:

```bash
VITE_POSTHOG_KEY=phc_your_project_key
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

PostHog records six manual product events with bucketed counts plus page views,
page leaves, heatmaps, and Web Vitals. Autocapture, session replay, and error
capture remain disabled. ENV contents, keys, values, filenames, copied text, and
raw error messages are never included. SDK-added properties are stripped from
manual product events; only the public project token, anonymous distinct ID, and
the documented event properties are sent.

## Scripts

| Command          | Purpose                                                |
| ---------------- | ------------------------------------------------------ |
| `pnpm dev`       | Start the local development server.                    |
| `pnpm build`     | Create the production build and prerender tool routes. |
| `pnpm preview`   | Preview the production build locally.                  |
| `pnpm test`      | Run the Vitest suite.                                  |
| `pnpm typecheck` | Check TypeScript without emitting files.               |
| `pnpm lint`      | Run ESLint.                                            |
| `pnpm format`    | Format JavaScript and TypeScript files with Prettier.  |
| `pnpm check`     | Check JavaScript and TypeScript formatting.            |

## Commit workflow

`pnpm install` configures Husky automatically.

- The pre-commit hook runs ESLint and Prettier against staged files through
  lint-staged.
- The commit-message hook enforces Conventional Commits through Commitlint.

```text
feat: add a new ENV helper
fix: preserve multiline values
chore: update dependencies
```

## Stack

- TanStack Start with statically prerendered routes
- React and TypeScript
- Tailwind CSS and shadcn/ui components built on Base UI
- Vitest, ESLint, Prettier, Husky, lint-staged, and Commitlint

Active development happens on `dev`; `main` is the release branch.

EnvSift is available at [envsift.damnlabs.com](https://envsift.damnlabs.com). It is
a [Damn Labs](https://damnlabs.com) product by
[Pixelact Studio](https://pixelactstudio.com).

## License

EnvSift is open-source software licensed under the
[Apache License 2.0](./LICENSE).
