import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowUpRightIcon } from "lucide-react"

import { GUIDES } from "@/constants/guides"
import { seoHead } from "@/lib/seo"

export const Route = createFileRoute("/guides")({
  head: () =>
    seoHead(
      "ENV Guides for Safer Configuration",
      "Practical guides for comparing, validating, formatting, and managing .env files across development and deployment environments.",
      "/guides",
      { image: "guides" }
    ),
  component: GuidesPage,
})

function GuidesPage() {
  return (
    <main className="mx-auto min-h-[calc(100svh-3.5rem)] w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
        ENV knowledge base
      </p>
      <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
        Practical guides for safer environment configuration
      </h1>
      <p className="mt-4 max-w-3xl text-base/relaxed text-muted-foreground">
        Original, implementation-focused guidance for keeping dotenv files
        consistent without copying secrets into third-party services.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {GUIDES.map((guide) => (
          <article
            key={guide.slug}
            className="flex flex-col border bg-card p-5"
          >
            <h2 className="text-lg font-semibold tracking-tight">
              {guide.title}
            </h2>
            <p className="mt-2 text-sm/relaxed text-muted-foreground">
              {guide.description}
            </p>
            <Link
              to="/guides/$slug"
              params={{ slug: guide.slug }}
              data-ph-capture
              data-ph-capture-attribute-action="navigate"
              data-ph-capture-attribute-destination="guide"
              data-ph-capture-attribute-location="guide_list"
              className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary underline underline-offset-3"
            >
              Read guide
              <ArrowUpRightIcon className="size-3.5" />
            </Link>
          </article>
        ))}
      </div>
    </main>
  )
}
