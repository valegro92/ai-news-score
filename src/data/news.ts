import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { redis } from "@/lib/redis";

export interface NewsItem {
  id: string;
  titolo: string;
  fonte: string;
  data: string;
  url: string;
  categoria: string;
  sintesi: string;
  score: number;
}

export interface WeekData {
  id: string;
  label: string;
  lastUpdate: string;
  news: NewsItem[];
}

const WEEKS_DIR = join(process.cwd(), "src/data/weeks");

/** Validate a single news item has all required fields */
function validateNewsItem(item: Record<string, unknown>, weekId: string): NewsItem {
  const required = ["id", "titolo", "fonte", "data", "url", "categoria", "sintesi", "score"];  for (const field of required) {
    if (!(field in item) || item[field] === undefined || item[field] === "") {
      throw new Error(`[${weekId}] News item missing field: ${field} — id: ${item.id || "unknown"}`);
    }
  }
  if (typeof item.score !== "number" || item.score < 1 || item.score > 10) {
    throw new Error(`[${weekId}] Invalid score: ${item.score} — id: ${item.id}`);
  }
  return item as unknown as NewsItem;
}

/** Load and validate a single week JSON from filesystem */
function loadWeek(filename: string): WeekData {
  const filepath = join(WEEKS_DIR, filename);
  const raw = JSON.parse(readFileSync(filepath, "utf-8"));
  if (!raw.id || !raw.label || !raw.lastUpdate || !Array.isArray(raw.news)) {
    throw new Error(`Invalid week file: ${filename}`);
  }
  return {
    id: raw.id,
    label: raw.label,
    lastUpdate: raw.lastUpdate,
    news: raw.news.map((n: Record<string, unknown>) => validateNewsItem(n, raw.id)),
  };
}
/** Convert pipeline ScoredArticle to NewsItem format */
function pipelineToNewsItem(article: {
  id: string; title: string; link: string; source: string;
  date: string; score: number; tags: string[]; sommario: string;
}): NewsItem {
  return {
    id: article.id,
    titolo: article.title,
    fonte: article.source,
    data: (() => {
      try {
        return new Date(article.date).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
      } catch { return article.date; }
    })(),
    url: article.link,
    categoria: (article.tags && article.tags[0]) || "AI",
    sintesi: article.sommario || "",
    score: article.score,
  };
}

/** Try to load latest week from Redis (pipeline results) */
async function loadFromRedis(): Promise<WeekData | null> {
  try {
    const latestId = await redis.get<string>("week:latest");
    if (!latestId) return null;
    const raw = await redis.get<string>(`week:${latestId}`);
    if (!raw) return null;    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      id: data.weekId,
      label: data.label,
      lastUpdate: data.generatedAt,
      news: (data.articles || []).map(pipelineToNewsItem),
    };
  } catch (err) {
    console.error("Redis news load error:", err);
    return null;
  }
}

/** Get all available weeks from filesystem, sorted newest first */
export function getAllWeeks(): WeekData[] {
  try {
    const files = readdirSync(WEEKS_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse();
    return files.map(loadWeek);
  } catch {
    return [];
  }
}

/** Get a specific week by id (e.g. "2026-W14") */
export function getWeek(weekId: string): WeekData | null {
  const filename = `${weekId}.json`;
  try {    return loadWeek(filename);
  } catch {
    return null;
  }
}

/** Get the latest week — static JSON curati hanno priorità, Redis solo fallback */
export async function getLatestWeekAsync(): Promise<WeekData> {
  // 1. Priorità: JSON statici curati (dal task schedulato)
  const weeks = getAllWeeks();
  if (weeks.length > 0) return weeks[0];

  // 2. Fallback: Redis (pipeline automatica)
  const redisWeek = await loadFromRedis();
  if (redisWeek && redisWeek.news.length > 0) return redisWeek;

  throw new Error("No week data found");
}

/** Sync version for backwards compatibility */
export function getLatestWeek(): WeekData {
  const weeks = getAllWeeks();
  if (weeks.length === 0) {
    throw new Error("No week data found in src/data/weeks/");
  }
  return weeks[0];
}

/** Backwards compatibility — flat list from latest static week */
export const newsItems: NewsItem[] = getLatestWeek().news;