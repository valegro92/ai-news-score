// Pipeline settimanale: fetch RSS → filtra → score con AI → salva su Redis
import { redis } from "./redis";
import { chatJSON } from "./openrouter";
import Parser from "rss-parser";
import feedList from "@/data/feeds.json";

// --- Tipi ---
export interface RawArticle {
  title: string;
  link: string;
  source: string;
  date: string;
  snippet: string;
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

// --- Fetch RSS (TUTTO in parallelo, timeout aggressivo) ---
const parser = new Parser({ timeout: 3000 });

async function fetchFeeds(): Promise<RawArticle[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Tutti i feed in parallelo — un singolo Promise.allSettled
  const results = await Promise.allSettled(
    feedList.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        return (parsed.items || [])
          .filter((item) => {
            if (!item.title || !item.link) return false;
            const pub = item.pubDate ? new Date(item.pubDate) : null;
            return !pub || pub >= sevenDaysAgo;
          })
          .map((item) => ({
            title: item.title!.trim(),
            link: item.link!,
            source: feed.name,
            date: item.pubDate || new Date().toISOString(),
            snippet: (item.contentSnippet || item.content || "").slice(0, 200),
          }));
      } catch {
        return [];
      }
    })
  );

  const articles: RawArticle[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") articles.push(...r.value);
  }

  // Deduplica per titolo
  const seen = new Set<string>();
  const unique = articles.filter((a) => {
    const key = a.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Ordina per data decrescente, prendi max 30 per AI scoring (1 sola call)
  unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return unique.slice(0, 30);
}

// --- Filtra e Scorea con AI (1 singola call, max 30 articoli) ---
interface AIScoreResponse {
  articles: {
    index: number;
    score: number;
    tags: string[];
    sommario: string;
  }[];
}

async function filterAndScore(
  raw: RawArticle[]
): Promise<{ scored: ScoredArticle[]; aiSuccess: number; aiFailed: number }> {
  const scored: ScoredArticle[] = [];
  const CHUNK = 30; // tutti in una sola call AI
  let aiSuccess = 0;
  let aiFailed = 0;

  for (let i = 0; i < raw.length; i += CHUNK) {
    const chunk = raw.slice(i, i + CHUNK);
    const chunkNum = Math.floor(i / CHUNK) + 1;
    const listing = chunk
      .map(
        (a, idx) =>
          `[${idx}] "${a.title}" — ${a.source}\n    ${a.snippet.slice(0, 120)}`
      )
      .join("\n");

    try {
      console.log(`🧩 Chunk ${chunkNum}: scoring ${chunk.length} articoli...`);
      const result = await chatJSON<AIScoreResponse>([
        {
          role: "system",
          content: `Sei un editor AI che valuta notizie sull'intelligenza artificiale per una newsletter italiana rivolta a PMI e professionisti.
Per ogni articolo rispondi con: score (1-10), tags (max 3), sommario (1 frase in italiano).
Score alto = impatto pratico su aziende, prodotto usabile, regolazione EU/IT.
Score basso = paper teorici, hype senza sostanza.
Rispondi SOLO con JSON: {"articles": [{"index": 0, "score": 7, "tags": ["LLM"], "sommario": "..."}]}`,
        },
        {
          role: "user",
          content: `Valuta:\n\n${listing}`,
        },
      ]);

      console.log(`✅ Chunk ${chunkNum}: ${result.articles.length} scorati`);
      for (const item of result.articles) {
        const article = chunk[item.index];
        if (!article) continue;
        scored.push({
          id: slugify(article.title),
          title: article.title,
          link: article.link,
          source: article.source,
          date: article.date,
          score: Math.min(10, Math.max(1, item.score)),
          tags: (item.tags || []).slice(0, 3),
          sommario: item.sommario || "",
        });
      }
      aiSuccess += chunk.length;

    } catch (err) {
      console.error(`❌ AI scoring fallito chunk ${chunkNum}:`, err);
      aiFailed += chunk.length;
      for (const article of chunk) {
        scored.push({
          id: slugify(article.title),
          title: article.title,
          link: article.link,
          source: article.source,
          date: article.date,
          score: 5,
          tags: [],
          sommario: "",
        });
      }
    }
  }

  return {
    scored: scored.sort((a, b) => b.score - a.score).slice(0, 30),
    aiSuccess,
    aiFailed,
  };
}

// --- Pipeline principale ---
export async function runPipeline(): Promise<WeekData> {
  const weekId = getWeekId();
  const label = getWeekLabel();
  const startTime = Date.now();

  console.log(`🚀 Pipeline avviata per ${weekId} (${label})`);

  // 1. Fetch RSS
  console.log(`📡 Fetch da ${feedList.length} feed...`);
  const raw = await fetchFeeds();
  const fetchTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`📰 ${raw.length} articoli in ${fetchTime}s`);

  if (raw.length === 0) {
    console.warn("⚠️ Nessun articolo trovato.");
    return { weekId, label, generatedAt: new Date().toISOString(), articles: [] };
  }

  // 2. AI scoring
  console.log("🤖 Scoring AI...");
  const { scored: articles, aiSuccess, aiFailed } = await filterAndScore(raw);
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`📊 ${aiSuccess} AI ok, ${aiFailed} fallback — ${totalTime}s totali`);

  // 3. Quality gate
  const aiRatio = aiSuccess / (aiSuccess + aiFailed);
  const weekData: WeekData = {
    weekId, label, generatedAt: new Date().toISOString(), articles,
  };

  if (aiRatio < 0.3) {
    console.error(`🚫 Quality gate: ${Math.round(aiRatio * 100)}% AI. Redis NON aggiornato.`);
    return weekData;
  }

  // 4. Salva su Redis
  try {
    await redis.set(`week:${weekId}`, JSON.stringify(weekData));
    await redis.set("week:latest", weekId);
    console.log(`💾 Salvato: week:${weekId} (${articles.length} articoli)`);
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
