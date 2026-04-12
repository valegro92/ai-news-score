import { getWeek, getAllWeeks } from "@/data/news";
import { getVotes } from "@/lib/votes";
import Header from "@/components/Header";
import CategoryFilter from "@/components/CategoryFilter";
import SuggestSource from "@/components/SuggestSource";
import Officina from "@/components/Officina";
import Footer from "@/components/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/** Pre-generate pages for all known weeks */
export function generateStaticParams() {
  return getAllWeeks().map((w) => ({ id: w.id }));
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WeekPage({ params }: Props) {
  const { id } = await params;
  const week = getWeek(id);
  if (!week) notFound();

  const allWeeks = getAllWeeks();
  const votes = await getVotes();
  const newsWithVotes = week.news.map((item) => ({
    ...item,
    settimana: week.id,
    votes: votes[item.id] || { agree: 0, disagree: 0 },
  }));

  const totalNews = newsWithVotes.length;
  const avgScore = (newsWithVotes.reduce((s, n) => s + n.score, 0) / totalNews).toFixed(1);
  const topScore = Math.max(...newsWithVotes.map((n) => n.score));

  return (
    <div className="min-h-screen">
      <Header
        totalNews={totalNews}
        topScore={topScore}
        avgScore={avgScore}
        weekLabel={week.label}
        lastUpdate={week.lastUpdate}
      />

      {/* Week navigation */}
      <nav className="max-w-4xl mx-auto px-6 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="text-xs text-cassetta-brand hover:text-cassetta-brand-light transition-colors"
          >
            ← Ultima settimana
          </Link>
          <span className="text-cassetta-border">|</span>
          {allWeeks.map((w) => (
            <Link
              key={w.id}
              href={`/week/${w.id}`}
              className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                w.id === id
                  ? "bg-cassetta-brand/20 text-cassetta-brand border border-cassetta-brand"
                  : "text-cassetta-muted hover:text-cassetta-text border border-cassetta-border hover:border-cassetta-brand/50"
              }`}
            >
              {w.id}
            </Link>
          ))}
        </div>
      </nav>

      <CategoryFilter
        news={newsWithVotes}
        weekLabel={week.label}
        lastUpdate={week.lastUpdate}
      />
      <SuggestSource />
      <Officina />
      <Footer />
    </div>
  );
}
