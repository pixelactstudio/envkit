import { useRef, useState } from "react"
import type { MouseEvent } from "react"
import { Link } from "@tanstack/react-router"
import { MenuIcon } from "lucide-react"

import { GithubIcon } from "@/components/github-icon"
import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { SITE_CONFIG } from "@/constants/site"
import { TOOLS } from "@/constants/tools"
import { cn } from "@/lib/utils"

function closeMobileMenu(event: MouseEvent<HTMLAnchorElement>) {
  event.currentTarget.closest("details")?.removeAttribute("open")
}

export function AppHeader() {
  const [menu, setMenu] = useState<string | null>(null)
  const closeTimer = useRef<number | undefined>(undefined)

  function cancelClose() {
    window.clearTimeout(closeTimer.current)
  }

  function queueClose() {
    cancelClose()
    closeTimer.current = window.setTimeout(() => setMenu(null), 200)
  }

  return (
    <header className="sticky top-0 z-40 h-14 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="mr-auto flex items-center gap-2.5 font-semibold tracking-tight"
        >
          <img src={SITE_CONFIG.logo} alt="" className="size-5" />
          <span>{SITE_CONFIG.name}</span>
        </Link>

        <NavigationMenu
          value={menu}
          onValueChange={setMenu}
          className="hidden md:flex"
        >
          <NavigationMenuList>
            <NavigationMenuItem value="tools">
              <NavigationMenuTrigger
                onPointerEnter={cancelClose}
                onPointerLeave={queueClose}
              >
                Tools
              </NavigationMenuTrigger>
              <NavigationMenuContent
                className="grid w-[34rem] grid-cols-2 gap-1 p-2"
                onPointerEnter={cancelClose}
                onPointerLeave={queueClose}
              >
                {TOOLS.map((tool) => (
                  <NavigationMenuLink
                    key={tool.to}
                    render={<Link to={tool.to} />}
                    className="items-start p-3"
                    closeOnClick
                  >
                    <tool.icon className="mt-0.5" />
                    <span>
                      <span className="block font-medium">{tool.title}</span>
                      <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                        {tool.description}
                      </span>
                    </span>
                  </NavigationMenuLink>
                ))}
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <Link
          to="/guides"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "hidden md:inline-flex"
          )}
        >
          Guides
        </Link>
        <Link
          to="/privacy"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "hidden md:inline-flex"
          )}
        >
          Privacy
        </Link>

        <a
          href={SITE_CONFIG.github.url}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({ variant: "ghost", size: "icon" })}
        >
          <GithubIcon />
          <span className="sr-only">View {SITE_CONFIG.name} on GitHub</span>
        </a>

        <ThemeToggle />

        <details className="group relative md:hidden">
          <summary
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "list-none [&::-webkit-details-marker]:hidden"
            )}
          >
            <MenuIcon />
            <span className="sr-only">Open tool navigation</span>
          </summary>
          <div className="absolute top-[calc(100%+0.5rem)] right-0 z-50 w-64 border bg-popover p-1 text-popover-foreground shadow-md">
            <p className="px-2 py-2 text-xs text-muted-foreground">
              Developer tools
            </p>
            {TOOLS.map((tool) => (
              <Link
                key={tool.to}
                to={tool.to}
                className="flex items-center gap-2 px-2 py-2 text-xs outline-none hover:bg-muted focus-visible:bg-muted"
                onClick={closeMobileMenu}
              >
                <tool.icon />
                {tool.title}
              </Link>
            ))}
            <div className="mt-1 border-t pt-1">
              <Link
                to="/guides"
                className="block px-2 py-2 text-xs outline-none hover:bg-muted focus-visible:bg-muted"
                onClick={closeMobileMenu}
              >
                ENV guides
              </Link>
              <Link
                to="/privacy"
                className="block px-2 py-2 text-xs outline-none hover:bg-muted focus-visible:bg-muted"
                onClick={closeMobileMenu}
              >
                Privacy and methodology
              </Link>
            </div>
          </div>
        </details>
      </div>
    </header>
  )
}
