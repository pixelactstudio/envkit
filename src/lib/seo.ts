import { SITE_CONFIG } from "@/constants/site"

export function seoMeta(title: string, description: string) {
  const fullTitle = `${title} | ${SITE_CONFIG.name}`

  return [
    { title: fullTitle },
    { name: "description", content: description },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: SITE_CONFIG.name },
    { name: "twitter:card", content: "summary" },
    { name: "twitter:title", content: fullTitle },
    { name: "twitter:description", content: description },
  ]
}
