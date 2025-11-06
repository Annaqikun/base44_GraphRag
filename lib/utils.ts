import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Utility to build internal page URLs. Exported here so code importing
// `@/lib/utils` can access it (some files import from '@/lib/utils').
export function createPageUrl(pageName: string | undefined) {
  if (!pageName) return "/";
  const name = String(pageName).trim().toLowerCase();
  switch (name) {
    case "dashboard":
    case "home":
      return "/";
    case "upload":
      return "/upload";
    case "graph":
    case "knowledgegraph":
      return "/graph";
    case "chat":
      return "/chat";
    default:
      return "/" + name.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
}

export default { cn, createPageUrl }
