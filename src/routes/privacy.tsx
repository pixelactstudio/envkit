import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowRightIcon, ShieldCheckIcon } from "lucide-react"

import { GithubIcon } from "@/components/github-icon"
import { buttonVariants } from "@/components/ui/button"
import { SITE_CONFIG } from "@/constants/site"
import { seoHead } from "@/lib/seo"

export const Route = createFileRoute("/privacy")({
  head: () =>
    seoHead(
      "Privacy and Local Processing",
      "See exactly how EnvSift reads, processes, and measures .env tools without uploading ENV contents, keys, values, or filenames.",
      "/privacy",
      { image: "privacy" }
    ),
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <main className="mx-auto min-h-[calc(100svh-3.5rem)] w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <ShieldCheckIcon className="size-8 text-primary" />
      <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
        Privacy and processing methodology
      </h1>
      <p className="mt-4 max-w-3xl text-base/relaxed text-muted-foreground">
        EnvSift is a static, browser-only application. Pasted text and selected
        files are processed in the current tab; there is no application server
        that receives or stores ENV content.
      </p>

      <div className="mt-12 grid gap-10">
        <section>
          <h2 className="text-xl font-semibold">What happens to a file</h2>
          <ol className="mt-4 grid gap-3 text-sm/relaxed text-muted-foreground">
            <li>
              <strong className="text-foreground">1. Read locally.</strong> A
              selected file is read through the browser File API.
            </li>
            <li>
              <strong className="text-foreground">2. Parse in memory.</strong>{" "}
              EnvSift validates and transforms the text with client-side
              TypeScript.
            </li>
            <li>
              <strong className="text-foreground">3. Render locally.</strong>{" "}
              Results stay in the page until you clear them, navigate away, or
              close the tab.
            </li>
            <li>
              <strong className="text-foreground">4. Export on request.</strong>{" "}
              Copy uses the Clipboard API and downloads are created as local
              browser blobs.
            </li>
          </ol>
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          <div className="border bg-card p-5">
            <h2 className="font-semibold">Never included in analytics</h2>
            <ul className="mt-3 grid gap-2 text-sm/relaxed text-muted-foreground">
              <li>ENV contents, keys, or values</li>
              <li>Selected filenames or downloaded output</li>
              <li>Copied text or raw parser error messages</li>
              <li>
                Session recordings, editor/form input autocapture, or exception
                payloads
              </li>
            </ul>
          </div>
          <div className="border bg-card p-5">
            <h2 className="font-semibold">What may be measured</h2>
            <ul className="mt-3 grid gap-2 text-sm/relaxed text-muted-foreground">
              <li>
                Page views, page leaves, Web Vitals, and heatmap coordinates
              </li>
              <li>Which tool was opened</li>
              <li>Input method: paste, file, or drop</li>
              <li>Bucketed file and variable counts plus success or failure</li>
              <li>Explicitly marked navigation and theme-control clicks</li>
              <li>WebMCP tool name, outcome, and bucketed input size</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Storage and third parties</h2>
          <p className="mt-3 text-sm/relaxed text-muted-foreground">
            The selected theme is stored in localStorage. PostHog receives
            privacy-filtered events in cookieless mode and stores no analytics
            identifier in cookies, localStorage, or sessionStorage. It derives a
            non-reversible daily identifier on its servers for audience
            measurement, so visitors cannot be recognized across days. Browser
            Do Not Track is respected. EnvSift does not create accounts, upload
            files, or persist editor contents.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Browser agents and WebMCP</h2>
          <p className="mt-3 text-sm/relaxed text-muted-foreground">
            In compatible browsers, EnvSift exposes its six deterministic tools
            through WebMCP. These tools run the same local functions as the
            visible interface. EnvSift analytics receive only the tool name,
            success or failure, and a broad input-size bucket—never tool
            arguments or results. Content you give to a browser agent may still
            be processed under that agent provider's privacy terms, so do not
            share secrets with an agent you do not trust.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Verify the implementation</h2>
          <p className="mt-3 text-sm/relaxed text-muted-foreground">
            EnvSift is open source. You can inspect the parser, analytics
            allowlist, and browser-only UI directly in the repository.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={SITE_CONFIG.github.url}
              target="_blank"
              rel="noreferrer"
              className={buttonVariants({ variant: "outline" })}
              data-ph-capture
              data-ph-capture-attribute-action="navigate_external"
              data-ph-capture-attribute-destination="github"
              data-ph-capture-attribute-location="privacy_page"
            >
              <GithubIcon data-icon="inline-start" />
              View source
            </a>
            <Link
              to="/guides"
              className={buttonVariants()}
              data-ph-capture
              data-ph-capture-attribute-action="navigate"
              data-ph-capture-attribute-destination="guides"
              data-ph-capture-attribute-location="privacy_page"
            >
              Read ENV guides
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
