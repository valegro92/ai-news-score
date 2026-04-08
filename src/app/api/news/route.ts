import { NextResponse } from "next/server";
import { newsItems } from "@/data/news";
import { getVotes } from "@/lib/votes";

export async function GET() {
  const votes = await getVotes();
  const newsWithVotes = newsItems.map((item) => ({
    ...item,
    votes: votes[item.id] || { agree: 0, disagree: 0 },
  }));
  return NextResponse.json(newsWithVotes);
}
