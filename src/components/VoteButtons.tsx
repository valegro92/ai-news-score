"use client";

import { useState, useEffect } from "react";

interface VoteButtonsProps {
  newsId: string;
  initialVotes: { agree: number; disagree: number };
}

export default function VoteButtons({ newsId, initialVotes }: VoteButtonsProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState<"agree" | "disagree" | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`vote-${newsId}`);
    if (stored === "agree" || stored === "disagree") {
      setUserVote(stored);
    }
  }, [newsId]);

  const totalVotes = votes.agree + votes.disagree;
  const agreePercent = totalVotes > 0 ? Math.round((votes.agree / totalVotes) * 100) : 50;

  const handleVote = async (type: "agree" | "disagree") => {
    if (userVote || isVoting) return;
    setIsVoting(true);
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsId, type }),
      });
      if (res.ok) {
        const data = await res.json();
        setVotes(data);
        setUserVote(type);
        localStorage.setItem(`vote-${newsId}`, type);
      }
    } catch (e) {
      console.error("Vote failed:", e);
    }
    setIsVoting(false);
  };

  return (
    <div className="mt-4">
      {/* Question */}
      <p className="text-xs text-cassetta-muted mb-2 font-medium tracking-wide uppercase">
        Sei d&apos;accordo con questo score?
      </p>

      {/* Buttons */}
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => handleVote("agree")}
          disabled={!!userVote || isVoting}
          className={`vote-btn flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
            userVote === "agree"
              ? "bg-cassetta-brand/20 border-cassetta-brand text-cassetta-brand"
              : userVote
              ? "bg-cassetta-surface border-cassetta-border/50 text-cassetta-hint/50 cursor-default"
              : "bg-cassetta-surface border-cassetta-border text-cassetta-text hover:border-cassetta-brand hover:text-cassetta-brand cursor-pointer"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
          </svg>
          {userVote ? votes.agree : "Sì"}
        </button>

        <button
          onClick={() => handleVote("disagree")}
          disabled={!!userVote || isVoting}
          className={`vote-btn flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
            userVote === "disagree"
              ? "bg-cassetta-red/20 border-cassetta-red text-cassetta-red"
              : userVote
              ? "bg-cassetta-surface border-cassetta-border/50 text-cassetta-hint/50 cursor-default"
              : "bg-cassetta-surface border-cassetta-border text-cassetta-text hover:border-cassetta-red hover:text-cassetta-red cursor-pointer"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
            <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
          </svg>
          {userVote ? votes.disagree : "No"}
        </button>
      </div>

      {/* Progress bar — only shows after voting */}
      {userVote && totalVotes > 0 && (
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 text-xs text-cassetta-muted">
            <div className="flex-1 h-1.5 bg-cassetta-border rounded-full overflow-hidden">
              <div
                className="h-full bg-cassetta-brand rounded-full transition-all duration-500"
                style={{ width: `${agreePercent}%` }}
              />
            </div>
            <span className="font-mono text-cassetta-text">
              {agreePercent}% d&apos;accordo
            </span>
            <span className="text-cassetta-muted">
              ({totalVotes} vot{totalVotes === 1 ? "o" : "i"})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
