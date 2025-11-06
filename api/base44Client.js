// Minimal stub client to satisfy imports during development.
// Replace with your real API client implementation when available.

export const base44 = {
  entities: {
    ResearchPaper: {
      list: async (sort) => {
        return [];
      },
    },
    ChatSession: {
      create: async (payload) => {
        return { id: `session-${Date.now()}`, ...payload };
      },
      update: async (id, payload) => {
        return { id, ...payload };
      },
      list: async () => {
        return [];
      },
    },
    Neo4jConnection: {
      list: async () => {
        return [];
      },
      update: async (id, payload) => {
        return { id, ...payload };
      },
    },
    ProjectArtifact: {
      list: async () => []
    }
  },
  integrations: {
    Core: {
      InvokeLLM: async ({ prompt }) => {
        // Return a simple default response so UI can render while dev API isn't configured.
        return { answer: "(stub) LLM not configured; this is a placeholder response.", citations: [] };
      }
    }
  }
}
