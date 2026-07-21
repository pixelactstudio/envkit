import { expect, it } from "vitest"

import { seoHead } from "./seo"

it("builds canonical tool metadata without invented review data", () => {
  const head = seoHead(
    "Free .env File Validator",
    "Validate dotenv files locally.",
    "/validator",
    { image: "validator", kind: "tool" }
  )
  const jsonLd = head.meta.find((entry) => "script:ld+json" in entry)

  expect(head.links).toContainEqual({
    rel: "canonical",
    href: "https://envsift.damnlabs.com/validator",
  })
  expect(head.meta).toContainEqual({
    property: "og:image",
    content: "https://envsift.damnlabs.com/og/validator.png",
  })
  expect(jsonLd).toMatchObject({
    "script:ld+json": {
      "@type": "WebApplication",
      isAccessibleForFree: true,
    },
  })
  expect(JSON.stringify(jsonLd)).not.toContain("aggregateRating")
})
