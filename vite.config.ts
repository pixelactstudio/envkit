import { defineConfig } from "vite"
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

import { SITE_CONFIG } from "./src/constants/site"

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    tanstackStart({
      prerender: { enabled: true, crawlLinks: true, failOnError: true },
      sitemap: { enabled: true, host: SITE_CONFIG.url },
      pages: [
        {
          path: "/404",
          sitemap: { exclude: true },
          prerender: { enabled: true, outputPath: "/404.html" },
        },
      ],
    }),
    viteReact(),
  ],
})

export default config
