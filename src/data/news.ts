import { readFileSync, readdirSync } from "fs";
import { join } from "path";

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
  const required = ["id", "titolo", "fonte", "data", "url", "categoria", "sintesi", "score"];
  for (const field of required) {
    if (!(field in item) || item[field] === undefined || item[field] === "") {
      throw new Error(`[${weekId}] News item missing field: ${field} — id: ${item.id || "unknown"}`);
    }
  }
  if (typeof item.score !== "number" || item.score < 1 || item.score > 10) {
    throw new Error(`[${weekId}] Invalid score: ${item.score} — id: ${item.id}`);
  }
  return item as unknown as NewsItem;
}

/** Load and validate a single week JSON */
function loadWeek(filename: string): WeekData {
  const filepath = join(WEEKS_DIR, filename);
  const raw = JSON.parse(readFileSync(filepath, "utf-8"));

  if (!raw.id || !raw.label || !raw.lastUpdate || !Array.isArray(raw.news)) {
    throw new Error(`Invalid week file: ${filename} — missing id, label, lastUpdate or news array`);
  }

  return {
    id: raw.id,
    label: raw.label,
    lastUpdate: raw.lastUpdate,
    news: raw.news.map((n: Record<string, unknown>) => validateNewsItem(n, raw.id)),
  };
}

/** Get all available weeks sorted newest first */
export function getAllWeeks(): WeekData[] {
  const files = readdirSync(WEEKS_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();
  return files.map(loadWeek);
}

/** Get a specific week by id (e.g. "2026-W14") */
export function getWeek(weekId: string): WeekData | null {
  const filename = `${weekId}.json`;
  try {
    return loadWeek(filename);
  } catch {
    return null;
  }
}

/** Get the latest week */
export function getLatestWeek(): WeekData {
  const weeks = getAllWeeks();
  if (weeks.length === 0) {
    throw new Error("No week data found in src/data/weeks/");
  }
  return weeks[0];
}

/** Backwards compatibility — flat list of all news from latest week */
export const newsItems: NewsItem[] = getLatestWeek().news;
