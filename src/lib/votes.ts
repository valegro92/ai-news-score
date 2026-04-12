import { redis } from "./redis";

export interface VoteData {
  [newsId: string]: {
    agree: number;
    disagree: number;
  };
}

const VOTE_PREFIX = "vote:";

export async function getVotes(): Promise<VoteData> {
  try {
    const keys = await redis.keys(`${VOTE_PREFIX}*`);
    if (keys.length === 0) return {};

    const pipeline = redis.pipeline();
    for (const key of keys) {
      pipeline.hgetall(key);
    }
    const results = await pipeline.exec();

    const votes: VoteData = {};
    for (let i = 0; i < keys.length; i++) {
      const newsId = keys[i].replace(VOTE_PREFIX, "");
      const data = results[i] as { agree?: string; disagree?: string } | null;
      votes[newsId] = {
        agree: parseInt(String(data?.agree ?? "0"), 10),
        disagree: parseInt(String(data?.disagree ?? "0"), 10),
      };
    }
    return votes;
  } catch (error) {
    console.error("Redis getVotes error:", error);
    return {};
  }
}

export async function addVote(
  newsId: string,
  type: "agree" | "disagree"
): Promise<void> {
  try {
    await redis.hincrby(`${VOTE_PREFIX}${newsId}`, type, 1);
  } catch (error) {
    console.error("Redis addVote error:", error);
  }
}
