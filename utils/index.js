// Utility helpers for the app root.
// Export named helpers expected by the codebase (e.g. createPageUrl).
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
      // slugify simple names
      return "/" + name.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
}

export default {
  createPageUrl,
};
