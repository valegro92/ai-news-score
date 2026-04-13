// Pipeline settimanale: fetch RSS → filtra → score con AI → salva su Redis
// Ottimizzata per Vercel Hobby (max 60s)
import { redis } from "./redis";
import { chatJSON } from "./openrouter";
import feedList from "@/data/feeds.json";

// --- Tipi ---
export interface RawArticle {
  title: string;
  link: string;
  source: string;
  date: string;
}

export interface ScoredArticle {
  id: string;
  title: string;
  link: string;
  source: string;
  date: string;
  score: number;
  tags: string[];
  sommario: string;
}

export interface WeekData {
  weekId: string;
  label: string;
  generatedAt: string;
  articles: ScoredArticle[];
}

// --- Helper ---
function getWeekId(): string {
  const now = new Date();
  const jan1 = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - jan1.getTime()) / 86400000);
  const week = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getWeekLabel(): string {
  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)} ${now.getFullYear()}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

// --- Fetch RSS con fetch nativo (no rss-parser, zero deps) ---
function extractItems(xml: string, sourceName: string): RawArticle[] {
  const items: RawArticle[] = [];
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1]?.trim();
    const link = block.match(/<link[^>]*>(.*?)<\/link>/)?.[1]?.trim()
      || block.match(/<link[^>]*href="([^"]+)"/)?.[1]?.trim();
    const pubDate = block.match(/<pubDate[^>]*>(.*?)<\/pubDate>/)?.[1]?.trim();
    if (title && link) {
      items.push({ title, link, source: sourceName, date: pubDate || new Date().toISOString() });
    }
  }
  return items;
}

async function fetchFeeds(): Promise<RawArticle[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const topFeeds = feedList.slice(0, 10);
  console.log(`📡 Fetch ${topFeeds.length} feed con fetch nativo...`);

  const results = await Promise.allSettled(
    topFeeds.map(async (feed) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      try {
        const res = await fetch(feed.url, {
          signal: controller.signal,
          headers: { "User-Agent": "AI-News-Score/1.0" },
        });
        clearTimeout(timer);
        if (!res.ok) return [];
        const xml = await res.text();
        return extractItems(xml, feed.name);
      } catch {
        clearTimeout(timer);
        return [];
      }
    })
  );

  const articles: RawArticle[] = [];
  let feedsOk = 0;
  for (const r of results) {
    if (r.status === "fulfilled" && r.value.length > 0) {
      articles.push(...r.value);
      feedsOk++;
    }
  }
  console.log(`📰 ${feedsOk}/${topFeeds.length} feed ok, ${articles.length} articoli raw`);

  // Filtra ultimi 7 giorni + deduplica
  const seen = new Set<string>();
  const filtered = articles.filter((a) => {
    const pub = new Date(a.date);
    if (isNaN(pub.getTime()) || pub < sevenDaysAgo) return false;
    const key = a.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  console.log(`🗞️ ${filtered.length} articoli ultimi 7 giorni (dedup)`);
  return filtered.slice(0, 15);
}

// --- AI Scoring ---
interface AIScoreResponse {
  articles: { index: number; score: number; tags: string[]; sommario: string }[];
}

async function scoreArticles(
  raw: RawArticle[]
): Promise<{ scored: ScoredArticle[]; aiOk: boolean }> {
  const listing = raw
    .map((a, i) => `[${i}] "${a.title}" — ${a.source}`)
    .join("\n");

  try {
    console.log(`🤖 Scoring ${raw.length} articoli...`);
    const result = await chatJSON<AIScoreResponse>([
      {
        role: "system",
        content: `Valuta notizie AI per newsletter PMI italiana.
Per ogni articolo: score 1-10, tags (max 3), sommario (1 frase IT).
Score alto = impatto pratico aziende. Basso = teoria/hype.
JSON: {"articles": [{"index": 0, "score": 7, "tags": ["LLM"], "sommario": "..."}]}`,
      },
      { role: "user", content: listing },
    ]);

    console.log(`✅ AI: ${result.articles.length} scorati`);
    const scored = result.articles
      .map((item) => {
        const a = raw[item.index];
        if (!a) return null;
        return {
          id: slugify(a.title),
          title: a.title, link: a.link, source: a.source, date: a.date,
          score: Math.min(10, Math.max(1, item.score)),
          tags: (item.tags || []).slice(0, 3),
          sommario: item.sommario || "",
        };
      })
      .filter(Boolean) as ScoredArticle[];
    return { scored: scored.sort((a, b) => b.score - a.score), aiOk: true };
  } catch (err) {
    console.error("❌ AI fallita:", err);
    // Fallback senza AI
    const scored = raw.map((a) => ({
      id: slugify(a.title), title: a.title, link: a.link,
      source: a.source, date: a.date, score: 5, tags: [] as string[], sommario: "",
    }));
    return { scored, aiOk: false };
  }
}

// --- Pipeline principale ---
export async function runPipeline(): Promise<WeekData> {
  const weekId = getWeekId();
  const label = getWeekLabel();
  const t0 = Date.now();
  console.log(`🚀 Pipeline ${weekId} (${label})`);

  const raw = await fetchFeeds();
  const t1 = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`⏱️ Fetch: ${t1}s`);

  if (raw.length === 0) {
    return { weekId, label, generatedAt: new Date().toISOString(), articles: [] };
  }

  const { scored, aiOk } = await scoreArticles(raw);
  const t2 = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`⏱️ Totale: ${t2}s (AI: ${aiOk ? "ok" : "fallback"})`);

  const weekData: WeekData = {
    weekId, label, generatedAt: new Date().toISOString(), articles: scored,
  };

  // Quality gate: non salvare se AI fallita
  if (!aiOk) {
    console.error("🚫 Quality gate: AI fallita, Redis invariato.");
    return weekData;
  }

  try {
    await redis.set(`week:${weekId}`, JSON.stringify(weekData));
    await redis.set("week:latest", weekId);
    console.log(`💾 Redis: week:${weekId} (${scored.length} articoli)`);
  } catch (err) {
    console.error("❌ Redis:", err);
  }
  return weekData;
}

// --- Leggi da Redis ---
export async function getLatestWeek(): Promise<WeekData | null> {
  try {
    const latestId = await redis.get<string>("week:latest");
    if (!latestId) return null;
    const data = await redis.get<string>(`week:${latestId}`);
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : data as unknown as WeekData;
  } catch (err) {
    console.error("Redis getLatestWeek error:", err);
    return null;
  }
}
