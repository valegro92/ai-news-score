import { redis } from "./redis";

export interface Suggestion {
  id: string;
  url: string;
  nota: string;
  timestamp: string;
  status: "pending" | "accepted" | "rejected";
}

const SUGGESTIONS_KEY = "suggestions";

export async function addSuggestion(
  url: string,
  nota: string
): Promise<string> {
  const id = `sug-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const suggestion: Suggestion = {
    id,
    url,
    nota,
    timestamp: new Date().toISOString(),
    status: "pending",
  };

  try {
    // Salva in una sorted set con timestamp come score
    await redis.zadd(SUGGESTIONS_KEY, {
      score: Date.now(),
      member: JSON.stringify(suggestion),
    });
    return id;
  } catch (error) {
    console.error("Redis addSuggestion error:", error);
    return id;
  }
}

export async function getSuggestions(): Promise<Suggestion[]> {
  try {
    // Leggi dal più recente al più vecchio
    const raw = await redis.zrange(SUGGESTIONS_KEY, 0, -1, { rev: true });
    return raw.map((item) => {
      if (typeof item === "string") return JSON.parse(item) as Suggestion;
      return item as unknown as Suggestion;
    });
  } catch (error) {
    console.error("Redis getSuggestions error:", error);
    return [];
  }
}
