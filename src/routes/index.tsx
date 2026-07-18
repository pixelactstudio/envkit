import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowUpRightIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SITE_CONFIG } from "@/constants/site"
import { TOOLS } from "@/constants/tools"
import { seoMeta } from "@/lib/seo"

export const Route = createFileRoute("/")({
  head: () => ({
    meta: seoMeta(
      "Private ENV tools for developers",
      `Compare, inspect, format, merge, redact, and convert .env files locally in your browser with ${SITE_CONFIG.name}.`
    ),
  }),
  component: HomePage,
})

function HomePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100svh-3.5rem)] w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:h-[calc(100svh-3.5rem)] lg:min-h-0 lg:justify-center lg:overflow-hidden lg:px-8 lg:py-7">
      <section className="grid items-end gap-5 border-b pb-7 lg:grid-cols-[1fr_auto]">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            Private developer utilities
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            Environment files, handled.
          </h1>
          <p className="mt-3 max-w-2xl text-sm/relaxed text-muted-foreground sm:text-base/relaxed">
            Compare, clean, inspect, and convert ENV files without sending
            credentials to another server.
          </p>
        </div>
        <div className="hidden border-l border-primary/40 pl-5 text-xs/relaxed text-muted-foreground lg:block">
          <p className="font-medium text-foreground">Browser-only processing</p>
          <p>No uploads. No accounts. No saved files.</p>
        </div>
      </section>

      <section className="py-6">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
              Developer toolkit
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              Choose a helper
            </h2>
          </div>
          <p className="hidden text-xs text-muted-foreground sm:block">
            {TOOLS.length} tools
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link key={tool.to} to={tool.to} className="group outline-none">
              <Card
                size="sm"
                className="h-full border-transparent transition-colors group-hover:bg-muted/50 group-focus-visible:ring-2 group-focus-visible:ring-ring"
              >
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="grid size-8 place-items-center border bg-background text-primary">
                      <tool.icon className="size-4" />
                    </span>
                    <ArrowUpRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                  </div>
                  <CardTitle className="text-sm">{tool.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto text-xs font-medium text-primary">
                  Open {tool.nav.toLowerCase()}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <footer className="flex flex-col gap-1 border-t pt-4 text-[11px] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>{SITE_CONFIG.name} processes every file locally in this tab.</p>
        <p>
          Built for the community by{" "}
          <a
            href={SITE_CONFIG.damnLabs.url}
            className="underline underline-offset-3 hover:text-foreground"
          >
            {SITE_CONFIG.damnLabs.name}
          </a>
          , a{" "}
          <a
            href={SITE_CONFIG.pixelactStudio.url}
            className="underline underline-offset-3 hover:text-foreground"
          >
            {SITE_CONFIG.pixelactStudio.name}
          </a>{" "}
          product.
        </p>
      </footer>
    </main>
  )
}
