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

// --- Fetch RSS ---
const parser = new Parser({ timeout: 8000 });

async function fetchFeeds(): Promise<RawArticle[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const articles: RawArticle[] = [];
  const BATCH = 10;

  for (let i = 0; i < feedList.length; i += BATCH) {
    const batch = feedList.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(async (feed) => {
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
              snippet: (item.contentSnippet || item.content || "").slice(0, 300),
            }));
        } catch {
          console.warn(`⚠️ Feed fallito: ${feed.name}`);
          return [];
        }
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled") articles.push(...r.value);
    }
  }

  // Deduplica per titolo
  const seen = new Set<string>();
  return articles.filter((a) => {
    const key = a.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// --- Filtra e Scorea con AI ---
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
): Promise<ScoredArticle[]> {
  const scored: ScoredArticle[] = [];
  const CHUNK = 15; // articoli per chiamata AI

  for (let i = 0; i < raw.length; i += CHUNK) {
    const chunk = raw.slice(i, i + CHUNK);
    const listing = chunk
      .map(
        (a, idx) =>
          `[${idx}] "${a.title}" — ${a.source}\n    ${a.snippet.slice(0, 150)}`
      )
      .join("\n");

    try {
      const result = await chatJSON<AIScoreResponse>([
        {
          role: "system",
          content: `Sei un editor AI che valuta notizie settimanali sull'intelligenza artificiale per una newsletter italiana rivolta a PMI, professionisti e decision-maker.
Per ogni articolo assegna:
- score: 1-10 (10 = impatto altissimo su adozione AI in azienda)
- tags: max 3 tag brevi (es. "LLM", "regolazione", "open-source", "PMI", "produttività")
- sommario: 1 frase in italiano che spiega perché conta per chi lavora

Criteri score alto: impatto pratico su aziende, novità di prodotto usabile, regolazione EU/IT, trend di adozione.
Criteri score basso: paper accademici teorici, notizie vecchie riciclate, puro hype senza sostanza.

Rispondi SOLO con JSON valido: {"articles": [{"index": N, "score": N, "tags": [...], "sommario": "..."}]}`,
        },
        {
          role: "user",
          content: `Valuta queste ${chunk.length} notizie AI della settimana:\n\n${listing}`,
        },
      ]);

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
    } catch (err) {
      console.error(`⚠️ AI scoring fallito per chunk ${i}:`, err);
      // Fallback: inserisci senza score AI
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

  // Ordina per score decrescente, prendi top 30
  return scored.sort((a, b) => b.score - a.score).slice(0, 30);
}

// --- Pipeline principale ---
export async function runPipeline(): Promise<WeekData> {
  const weekId = getWeekId();
  const label = getWeekLabel();

  console.log(`🚀 Pipeline avviata per ${weekId} (${label})`);

  // 1. Fetch da tutti i feed RSS
  console.log(`📡 Fetch da ${feedList.length} feed...`);
  const raw = await fetchFeeds();
  console.log(`📰 ${raw.length} articoli trovati (ultimi 7 giorni)`);

  if (raw.length === 0) {
    console.warn("⚠️ Nessun articolo trovato. Pipeline terminata.");
    return { weekId, label, generatedAt: new Date().toISOString(), articles: [] };
  }

  // 2. Filtra e assegna score con AI
  console.log("🤖 Scoring AI in corso...");
  const articles = await filterAndScore(raw);
  console.log(`✅ ${articles.length} articoli scorati e selezionati`);

  // 3. Salva su Redis
  const weekData: WeekData = {
    weekId,
    label,
    generatedAt: new Date().toISOString(),
    articles,
  };

  try {
    await redis.set(`week:${weekId}`, JSON.stringify(weekData));
    await redis.set("week:latest", weekId);
    console.log(`💾 Salvato su Redis: week:${weekId}`);
  } catch (err) {
    console.error("❌ Errore salvataggio Redis:", err);
  }

  return weekData;
}

// --- Leggi risultati da Redis ---
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
