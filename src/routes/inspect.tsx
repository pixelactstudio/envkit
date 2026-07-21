import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/inspect")({
  beforeLoad: () => {
    throw redirect({ to: "/validator", statusCode: 301 })
  },
})
