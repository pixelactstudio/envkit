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
                Session recordings, form autocapture, or exception payloads
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
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Storage and third parties</h2>
          <p className="mt-3 text-sm/relaxed text-muted-foreground">
            The selected theme and anonymous analytics identifier may be stored
            in localStorage. When analytics is configured, privacy-filtered
            events go to PostHog; browser Do Not Track is respected. EnvSift
            does not create accounts, upload files, or persist editor contents.
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
            >
              <GithubIcon data-icon="inline-start" />
              View source
            </a>
            <Link to="/guides" className={buttonVariants()}>
              Read ENV guides
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
