import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { getGuide } from "@/constants/guides"
import { seoHead } from "@/lib/seo"

export const Route = createFileRoute("/guides_/$slug")({
  head: ({ params }) => {
    const guide = getGuide(params.slug)
    return guide
      ? seoHead(guide.title, guide.description, `/guides/${guide.slug}`, {
          image: "guides",
          kind: "article",
        })
      : {}
  },
  component: GuidePage,
})

function GuidePage() {
  const { slug } = Route.useParams()
  const guide = getGuide(slug)
  if (!guide) throw notFound()

  return (
    <main className="mx-auto min-h-[calc(100svh-3.5rem)] w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <Link
        to="/guides"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        All guides
      </Link>

      <article className="mt-8">
        <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
          ENV guide
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
          {guide.title}
        </h1>
        <p className="mt-5 text-base/relaxed text-muted-foreground">
          {guide.intro}
        </p>

        <div className="mt-12 space-y-12">
          {guide.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-2xl font-semibold tracking-tight">
                {section.heading}
              </h2>
              <div className="mt-4 space-y-4 text-sm/relaxed text-muted-foreground sm:text-base/relaxed">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {section.code ? (
                <pre className="env-scrollbar mt-5 overflow-x-auto border bg-muted/40 p-4 text-xs/relaxed whitespace-pre-wrap">
                  {section.code}
                </pre>
              ) : null}
              {section.bullets ? (
                <ul className="mt-5 grid gap-2 text-sm/relaxed text-muted-foreground">
                  {section.bullets.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden="true" className="text-primary">
                        •
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>

        <div className="mt-12 border border-primary/30 bg-primary/5 p-5">
          <h2 className="text-lg font-semibold">Apply the guide privately</h2>
          <p className="mt-2 text-sm/relaxed text-muted-foreground">
            EnvSift processes ENV content locally in your browser and does not
            send keys or values to a server.
          </p>
          <Link
            to={guide.tool.to}
            className={buttonVariants({ className: "mt-5" })}
          >
            {guide.tool.label}
            <ArrowRightIcon data-icon="inline-end" />
          </Link>
        </div>
      </article>
    </main>
  )
}
