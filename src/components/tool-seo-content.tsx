import { Link } from "@tanstack/react-router"
import { ArrowUpRightIcon, ShieldCheckIcon } from "lucide-react"

import { TOOL_CONTENT } from "@/constants/tool-content"
import { TOOLS } from "@/constants/tools"
import type { ToolName } from "@/lib/analytics"

export function ToolSeoContent({ tool }: { tool: ToolName }) {
  const content = TOOL_CONTENT[tool]
  const related = content.related.map((id) =>
    TOOLS.find((item) => item.id === id)!
  )

  return (
    <section className="mt-16 border-t pt-12" aria-labelledby={`${tool}-guide`}>
      <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <p className="text-xs font-semibold tracking-widest text-primary uppercase">
            Practical guide
          </p>
          <h2
            id={`${tool}-guide`}
            className="mt-2 text-2xl font-semibold tracking-tight"
          >
            {content.heading}
          </h2>
          <p className="mt-3 max-w-3xl text-sm/relaxed text-muted-foreground">
            {content.intro}
          </p>
          <ol className="mt-6 grid gap-3">
            {content.steps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm/relaxed">
                <span className="grid size-6 shrink-0 place-items-center border bg-muted text-xs font-medium">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h3 className="font-semibold">What this tool handles</h3>
          <ul className="mt-3 grid gap-2 text-sm/relaxed text-muted-foreground">
            {content.handles.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden="true" className="text-primary">
                  •
                </span>
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 border bg-muted/30 p-4">
            <p className="text-xs font-semibold tracking-wider uppercase">
              Example
            </p>
            <pre className="env-scrollbar mt-3 overflow-x-auto text-xs/relaxed whitespace-pre-wrap text-muted-foreground">
              {content.example}
            </pre>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <h2 className="text-xl font-semibold">Frequently asked questions</h2>
          <div className="mt-4 divide-y border-y">
            {content.faqs.map(({ question, answer }) => (
              <details key={question} className="group py-4">
                <summary className="cursor-pointer list-none pr-6 text-sm font-medium marker:hidden">
                  {question}
                </summary>
                <p className="mt-2 max-w-3xl text-sm/relaxed text-muted-foreground">
                  {answer}
                </p>
              </details>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="border border-primary/30 bg-primary/5 p-4">
            <ShieldCheckIcon className="size-5 text-primary" />
            <h2 className="mt-3 font-semibold">Private by design</h2>
            <p className="mt-2 text-sm/relaxed text-muted-foreground">
              ENV content is processed in this tab. Read the exact data-handling
              method on the{" "}
              <Link
                to="/privacy"
                className="font-medium text-foreground underline underline-offset-3"
              >
                privacy and methodology page
              </Link>
              .
            </p>
          </div>
          <div>
            <h2 className="font-semibold">Continue reading</h2>
            <Link
              to="/guides/$slug"
              params={{ slug: content.guide }}
              className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary underline underline-offset-3"
            >
              Read the related ENV guide
              <ArrowUpRightIcon className="size-3.5" />
            </Link>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to={item.to}
                  className="text-sm underline underline-offset-3"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
