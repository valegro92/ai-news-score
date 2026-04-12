import { NextRequest, NextResponse } from "next/server";
import { addSuggestion, getSuggestions } from "@/lib/suggestions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, nota } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL obbligatorio" },
        { status: 400 }
      );
    }

    const cleanNota = nota ? String(nota).slice(0, 500) : "";
    const id = await addSuggestion(url, cleanNota);

    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const suggestions = await getSuggestions();
    return NextResponse.json(suggestions);
  } catch {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
