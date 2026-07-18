import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { ThemeProvider } from "next-themes"

import { AppHeader } from "@/components/app-header"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SITE_CONFIG } from "@/constants/site"
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
        name: "keywords",
        content:
          "env compare, dotenv compare, env formatter, env validator, env merge, env example generator, environment variables, developer tools",
      },
      {
        name: "author",
        content: `${SITE_CONFIG.daymLabs.name}, ${SITE_CONFIG.pixelactStudio.name}`,
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
  notFoundComponent: () => (
    <main className="mx-auto grid min-h-[calc(100svh-3.5rem)] max-w-7xl place-items-center p-6 text-center">
      <div>
        <p className="text-sm font-medium text-primary">404</p>
        <h1 className="mt-2 text-3xl font-semibold">Tool not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The requested {SITE_CONFIG.name} page does not exist.
        </p>
      </div>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-svh bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="envkit-theme"
        >
          <TooltipProvider delay={1200} timeout={0}>
            <AppHeader />
            {children}
          </TooltipProvider>
        </ThemeProvider>
        <TanStackDevtools
          config={{
            position: "bottom-right",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
