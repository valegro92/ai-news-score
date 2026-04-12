import { NextResponse } from "next/server";
import { getLatestWeekAsync } from "@/data/news";
import { getVotes } from "@/lib/votes";

export async function GET() {
  const week = await getLatestWeekAsync();
  const votes = await getVotes();
  const newsWithVotes = week.news.map((item) => ({
    ...item,
    votes: votes[item.id] || { agree: 0, disagree: 0 },
  }));
  return NextResponse.json(newsWithVotes);
}
