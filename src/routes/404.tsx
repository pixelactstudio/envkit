import { createFileRoute } from "@tanstack/react-router"

import { NotFoundPage } from "@/components/not-found-page"
import { SITE_CONFIG } from "@/constants/site"

export const Route = createFileRoute("/404")({
  head: () => ({
    meta: [
      { title: `Page not found | ${SITE_CONFIG.name}` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: NotFoundPage,
})
