import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/lib/pipeline";

// Protezione: solo Vercel Cron o chi ha il secret può triggerare
function isAuthorized(request: NextRequest): boolean {
  // Vercel Cron invia questo header automaticamente
  const cronSecret = request.headers.get("authorization");
  if (cronSecret === `Bearer ${process.env.CRON_SECRET}`) return true;

  // Fallback: query param per test manuali
  const key = request.nextUrl.searchParams.get("key");
  if (key && key === process.env.CRON_SECRET) return true;

  return false;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Non autorizzato" },
      { status: 401 }
    );
  }

  try {
    const result = await runPipeline();
    return NextResponse.json({
      ok: true,
      weekId: result.weekId,
      articlesCount: result.articles.length,
      aiOk: result.aiOk,
      aiError: result.aiError || null,
      hasKey: result.hasKey,
      topArticles: result.articles.slice(0, 5).map((a) => ({
        title: a.title,
        score: a.score,
        sommario: a.sommario,
      })),
    });
  } catch (err) {
    console.error("Pipeline error:", err);
    return NextResponse.json(
      { error: "Pipeline fallita", details: String(err) },
      { status: 500 }
    );
  }
}

// Vercel Cron — max duration 60s (free plan)
export const maxDuration = 60;
