import { NextRequest, NextResponse } from "next/server";
import { addVote } from "@/lib/votes";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newsId, type } = body;

    if (!newsId || !["agree", "disagree"].includes(type)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const result = await addVote(newsId, type);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
