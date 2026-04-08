"use client";

import ScoreRing from "./ScoreRing";
import VoteButtons from "./VoteButtons";

interface NewsCardProps {
  id: string;
  titolo: string;
  fonte: string;
  data: string;
  url: string;
  categoria: string;
  sintesi: string;
  score: number;
  votes: { agree: number; disagree: number };
  index: number;
}

const categoryColors: Record<string, string> = {
  "Adozione AI": "bg-cassetta-blue/15 text-cassetta-blue border-cassetta-blue/30",
  "AI e Lavoro": "bg-cassetta-red/15 text-cassetta-red border-cassetta-red/30",
  "Tool e Automazione": "bg-cassetta-brand/15 text-cassetta-brand border-cassetta-brand/30",
  "Regolamentazione": "bg-cassetta-yellow/15 text-cassetta-yellow border-cassetta-yellow/30",
  "Business AI": "bg-cassetta-violet/15 text-cassetta-violet border-cassetta-violet/30",
  "Modelli e Open Source": "bg-cassetta-green/15 text-cassetta-green border-cassetta-green/30",
};

export default function NewsCard({
  id, titolo, fonte, data, url, categoria, sintesi, score, votes, index,
}: NewsCardProps) {
  const catClass = categoryColors[categoria] || "bg-cassetta-border text-cassetta-muted border-cassetta-border";

  return (
    <article
      className="news-card animate-slide-up bg-cassetta-surface border border-cassetta-border rounded-xl p-6 relative overflow-hidden"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Subtle gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cassetta-brand/50 to-transparent" />

      <div className="flex gap-5">
        {/* Score ring */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <ScoreRing score={score} size={72} />
          <span className="text-[10px] font-mono text-cassetta-muted tracking-wider uppercase">
            score
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Category + meta */}
          <div className="flex items-center gap-3 mb-2">
            <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold border ${catClass}`}>
              {categoria}
            </span>
            <span className="text-xs text-cassetta-muted">{fonte}</span>
            <span className="text-xs text-cassetta-hint">{data}</span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold leading-snug mb-2 text-white">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cassetta-brand transition-colors"
            >
              {titolo}
            </a>
          </h3>

          {/* Summary */}
          <p className="text-sm text-cassetta-muted leading-relaxed mb-1">
            {sintesi}
          </p>

          {/* Source link */}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-cassetta-brand hover:text-cassetta-brand-light transition-colors mt-1"
          >
            Leggi la fonte
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7" /><path d="M7 7h10v10" />
            </svg>
          </a>

          {/* Vote */}
          <VoteButtons newsId={id} initialVotes={votes} />
        </div>
      </div>
    </article>
  );
}
