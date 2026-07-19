import { SITE_CONFIG } from "@/constants/site"

export function seoHead(title: string, description: string, path: string) {
  const fullTitle = `${title} | ${SITE_CONFIG.name}`
  const url = new URL(path, SITE_CONFIG.url).href

  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: SITE_CONFIG.name },
      { property: "og:url", content: url },
      { property: "og:image", content: SITE_CONFIG.socialImage },
      { property: "og:image:width", content: "1120" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: "EnvSift logo on a light background",
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: SITE_CONFIG.socialImage },
      {
        name: "twitter:image:alt",
        content: "EnvSift logo on a light background",
      },
    ],
    links: [{ rel: "canonical", href: url }],
  }
}
