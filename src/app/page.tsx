import { getLatestWeek } from "@/data/news";
import { getVotes } from "@/lib/votes";
import Header from "@/components/Header";
import CategoryFilter from "@/components/CategoryFilter";
import Officina from "@/components/Officina";
import Footer from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const week = getLatestWeek();
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
      <CategoryFilter
        news={newsWithVotes}
        weekLabel={week.label}
        lastUpdate={week.lastUpdate}
      />
      <Officina />
      <Footer />
    </div>
  );
}
