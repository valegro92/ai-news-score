"use client";

import { useState } from "react";
import NewsCard from "./NewsCard";

interface NewsWithVotes {
  id: string;
  titolo: string;
  fonte: string;
  data: string;
  url: string;
  categoria: string;
  sintesi: string;
  score: number;
  settimana: string;
  votes: { agree: number; disagree: number };
}

interface Props {
  news: NewsWithVotes[];
  weekLabel: string;
  lastUpdate: string;
}

export default function CategoryFilter({ news, weekLabel, lastUpdate }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(news.map((n) => n.categoria))).sort();
  const filtered = activeCategory
    ? news.filter((n) => n.categoria === activeCategory)
    : news;
  const sorted = [...filtered].sort((a, b) => b.score - a.score);

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-white">{weekLabel}</h2>
        <span className="text-xs font-mono text-cassetta-muted bg-cassetta-surface px-3 py-1.5 rounded-lg border border-cassetta-border">
          Aggiornato: {lastUpdate}
        </span>
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            activeCategory === null
              ? "bg-cassetta-brand/20 border-cassetta-brand text-cassetta-brand"
              : "bg-cassetta-surface border-cassetta-border text-cassetta-muted hover:border-cassetta-brand/50 hover:text-cassetta-text"
          }`}
        >
          Tutte ({news.length})
        </button>
        {categories.map((cat) => {
          const count = news.filter((n) => n.categoria === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                activeCategory === cat
                  ? "bg-cassetta-brand/20 border-cassetta-brand text-cassetta-brand"
                  : "bg-cassetta-surface border-cassetta-border text-cassetta-muted hover:border-cassetta-brand/50 hover:text-cassetta-text"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* News list */}
      <div className="space-y-4">
        {sorted.map((item, index) => (
          <NewsCard key={item.id} {...item} index={index} />
        ))}
      </div>

      {activeCategory && sorted.length === 0 && (
        <p className="text-center text-cassetta-muted py-12">
          Nessuna news in questa categoria questa settimana.
        </p>
      )}
    </main>
  );
}
