import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function createPageUrl(pageName) {
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

export default { cn, createPageUrl };
