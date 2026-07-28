import { SITE_CONFIG } from "@/constants/site"

type SeoKind = "website" | "tool" | "article" | "page"

export function seoHead(
  title: string,
  description: string,
  path: string,
  options: { image?: string; kind?: SeoKind } = {}
) {
  const fullTitle = `${title} | ${SITE_CONFIG.name}`
  const url = new URL(path, SITE_CONFIG.url).href
  const image = new URL(`/og/${options.image ?? "home"}.png`, SITE_CONFIG.url)
    .href
  const imageAlt = `${title} — ${SITE_CONFIG.name}`
  const kind = options.kind ?? "page"
  const schema =
    kind === "website"
      ? {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_CONFIG.name,
          url,
          description,
          publisher: {
            "@type": "Organization",
            name: SITE_CONFIG.damnLabs.name,
            url: SITE_CONFIG.damnLabs.url,
          },
        }
      : kind === "tool"
        ? {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: title,
            url,
            description,
            applicationCategory: "DeveloperApplication",
            operatingSystem: "Any",
            browserRequirements: "Requires JavaScript",
            isAccessibleForFree: true,
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          }
        : {
            "@context": "https://schema.org",
            "@type": kind === "article" ? "TechArticle" : "WebPage",
            name: title,
            headline: kind === "article" ? title : undefined,
            url,
            description,
            author:
              kind === "article"
                ? {
                    "@type": "Organization",
                    name: SITE_CONFIG.damnLabs.name,
                    url: SITE_CONFIG.damnLabs.url,
                  }
                : undefined,
          }

  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      {
        property: "og:type",
        content: kind === "article" ? "article" : "website",
      },
      { property: "og:site_name", content: SITE_CONFIG.name },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:image:width", content: "1120" },
      { property: "og:image:height", content: "630" },
      {
        property: "og:image:alt",
        content: imageAlt,
      },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
      {
        name: "twitter:image:alt",
        content: imageAlt,
      },
      { "script:ld+json": schema },
    ],
    links: [{ rel: "canonical", href: url }],
  }
}
