export interface VoteData {
  [newsId: string]: {
    agree: number;
    disagree: number;
  };
}

// In-memory vote storage (v1)
// Per produzione persistente, sostituire con Vercel KV:
// import { kv } from "@vercel/kv";
const votes: VoteData = {};

export async function getVotes(): Promise<VoteData> {
  return { ...votes };
}

export async function addVote(
  newsId: string,
  type: "agree" | "disagree"
): Promise<{ agree: number; disagree: number }> {
  if (!votes[newsId]) {
    votes[newsId] = { agree: 0, disagree: 0 };
  }
  votes[newsId][type]++;
  return { ...votes[newsId] };
}
