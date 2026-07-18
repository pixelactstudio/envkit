import {
  CombineIcon,
  FileKeyIcon,
  FileSearchIcon,
  GitCompareArrowsIcon,
  RefreshCwIcon,
  WandSparklesIcon,
} from "lucide-react"

export const TOOLS = [
  {
    to: "/compare",
    nav: "Compare",
    title: "ENV Compare",
    description:
      "Find missing and changed variables across two or more environments.",
    icon: GitCompareArrowsIcon,
  },
  {
    to: "/example",
    nav: "Example",
    title: ".env.example Generator",
    description: "Remove values and create a safe template for teammates.",
    icon: FileKeyIcon,
  },
  {
    to: "/inspect",
    nav: "Inspect",
    title: "ENV Inspector",
    description:
      "Catch invalid lines, duplicates, blanks, and missing references.",
    icon: FileSearchIcon,
  },
  {
    to: "/merge",
    nav: "Merge",
    title: "Merge & Clean",
    description: "Combine files with explicit precedence and stable ordering.",
    icon: CombineIcon,
  },
  {
    to: "/format",
    nav: "Format",
    title: "ENV Formatter",
    description: "Normalize quotes, ordering, and duplicate assignments.",
    icon: WandSparklesIcon,
  },
  {
    to: "/convert",
    nav: "Convert",
    title: "Format Converter",
    description: "Convert ENV or JSON to JSON, shell, ENV, or Compose syntax.",
    icon: RefreshCwIcon,
  },
] as const
