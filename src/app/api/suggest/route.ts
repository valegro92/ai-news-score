import { NextRequest, NextResponse } from "next/server";
import { addSuggestion, getSuggestions } from "@/lib/suggestions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, nota } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Rate limit: max 500 char nota
    const cleanNota = typeof nota === "string" ? nota.slice(0, 500) : "";

    const suggestion = await addSuggestion(url, cleanNota);
    return NextResponse.json({ ok: true, id: suggestion.id });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** GET — per la pipeline AI: legge le segnalazioni pendenti */
export async function GET() {
  const suggestions = await getSuggestions();
  return NextResponse.json(suggestions);
}
