import { Link } from "@tanstack/react-router"
import { ArrowLeftIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { SITE_CONFIG } from "@/constants/site"

export function NotFoundPage() {
  return (
    <main className="mx-auto grid min-h-[calc(100svh-3.5rem)] max-w-7xl place-items-center p-6 text-center">
      <div>
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="mt-2 text-3xl font-semibold">Tool not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This {SITE_CONFIG.name} page does not exist or may have moved.
        </p>
        <Link
          to="/"
          className={buttonVariants({ className: "mt-6" })}
          data-ph-capture
          data-ph-capture-attribute-action="navigate"
          data-ph-capture-attribute-destination="home"
          data-ph-capture-attribute-location="not_found"
        >
          <ArrowLeftIcon data-icon="inline-start" />
          Back to tools
        </Link>
      </div>
    </main>
  )
}
