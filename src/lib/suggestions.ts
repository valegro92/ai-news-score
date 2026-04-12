export interface Suggestion {
  id: string;
  url: string;
  nota: string;
  timestamp: string;
  status: "pending" | "accepted" | "rejected";
}

// In-memory storage (v1)
// Per produzione persistente, sostituire con Vercel KV
const suggestions: Suggestion[] = [];

export async function addSuggestion(url: string, nota: string): Promise<Suggestion> {
  const suggestion: Suggestion = {
    id: `sug-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    url,
    nota,
    timestamp: new Date().toISOString(),
    status: "pending",
  };
  suggestions.push(suggestion);
  return suggestion;
}

export async function getSuggestions(): Promise<Suggestion[]> {
  return [...suggestions].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
