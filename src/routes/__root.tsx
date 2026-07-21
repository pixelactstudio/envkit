import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { ThemeProvider } from "next-themes"

import { AppHeader } from "@/components/app-header"
import { AnalyticsConsentBanner } from "@/components/analytics-consent"
import { NotFoundPage } from "@/components/not-found-page"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SITE_CONFIG } from "@/constants/site"
import { Analytics } from "@/lib/analytics"
import { WebMcp } from "@/lib/webmcp"
import appCss from "../styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: `${SITE_CONFIG.name} — Private ENV tools for developers`,
      },
      {
        name: "description",
        content:
          "Compare, inspect, format, merge, redact, and convert .env files privately in your browser. No uploads, accounts, or server processing.",
      },
      {
        name: "author",
        content: `${SITE_CONFIG.damnLabs.name}, ${SITE_CONFIG.pixelactStudio.name}`,
      },
      {
        name: "application-name",
        content: SITE_CONFIG.name,
      },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large",
      },
      {
        property: "og:title",
        content: `${SITE_CONFIG.name} — Private ENV tools for developers`,
      },
      {
        property: "og:description",
        content:
          "Compare, inspect, format, merge, redact, and convert .env files without uploading secrets.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:site_name",
        content: SITE_CONFIG.name,
      },
      {
        property: "og:url",
        content: SITE_CONFIG.url,
      },
      {
        name: "twitter:card",
        content: "summary",
      },
      {
        name: "twitter:title",
        content: `${SITE_CONFIG.name} — Private ENV tools for developers`,
      },
      {
        name: "twitter:description",
        content:
          "Compare, inspect, format, merge, redact, and convert .env files without uploading secrets.",
      },
      {
        name: "theme-color",
        content: "#0a0a0a",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: SITE_CONFIG.logo,
        type: "image/svg+xml",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
    ],
  }),
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const app = (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      storageKey="envsift-theme"
    >
      <TooltipProvider delay={1200} timeout={0}>
        <AppHeader />
        {children}
      </TooltipProvider>
    </ThemeProvider>
  )

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-svh bg-background text-foreground antialiased">
        {app}
        <WebMcp />
        <Analytics />
        <AnalyticsConsentBanner />
        <Scripts />
      </body>
    </html>
  )
}
