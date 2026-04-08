import { newsItems } from "@/data/news";
import { getVotes } from "@/lib/votes";
import NewsCard from "@/components/NewsCard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const votes = await getVotes();
  const newsWithVotes = newsItems.map((item) => ({
    ...item,
    votes: votes[item.id] || { agree: 0, disagree: 0 },
  }));

  const totalNews = newsWithVotes.length;
  const avgScore = (newsWithVotes.reduce((s, n) => s + n.score, 0) / totalNews).toFixed(1);
  const topScore = Math.max(...newsWithVotes.map((n) => n.score));

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative overflow-hidden border-b border-cassetta-border">
        {/* Background */}
        <div className="absolute inset-0 bg-cassetta-bg" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative max-w-4xl mx-auto px-6 py-12">
          {/* Brand */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-cassetta-brand-dark flex items-center justify-center text-white font-bold text-lg">
              🔧
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-cassetta-brand">
                La Cassetta degli AI-trezzi
              </p>
              <p className="text-[10px] text-cassetta-muted tracking-wide">
                di Valentino Grossi
              </p>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 leading-tight">
            AI News Score
          </h1>
          <p className="text-lg text-cassetta-muted max-w-2xl leading-relaxed">
            Le news AI della settimana, filtrate e valutate con un metodo.
            <br />
            <span className="text-cassetta-text">
              Non tutto quello che esce merita il tuo tempo.
            </span>{" "}
            Qui trovi solo quello che passa il filtro.
          </p>

          {/* Stats */}
          <div className="flex gap-8 mt-8">
            <div>
              <p className="font-mono text-2xl font-bold text-white">{totalNews}</p>
              <p className="text-xs text-cassetta-muted">news valutate</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-bold text-cassetta-brand">{topScore}/10</p>
              <p className="text-xs text-cassetta-muted">score più alto</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-bold text-cassetta-brand-light">{avgScore}</p>
              <p className="text-xs text-cassetta-muted">media settimana</p>
            </div>
          </div>

          {/* How it works */}
          <div className="mt-8 p-4 rounded-xl bg-cassetta-surface border border-cassetta-border max-w-xl">
            <p className="text-sm text-cassetta-muted">
              <span className="text-cassetta-brand font-semibold">Come funziona:</span>{" "}
              Ogni settimana seleziono e valuto le news AI con un metodo a punti.
              Lo score va da 1 a 10 e misura quanto una notizia è rilevante per chi
              lavora davvero con l&apos;AI.{" "}
              <span className="text-cassetta-text">
                Vota se sei d&apos;accordo — o se pensi che mi sbaglio.
              </span>
            </p>
          </div>
        </div>
      </header>

      {/* News Feed */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">
            Settimana 14 — Aprile 2026
          </h2>
          <span className="text-xs font-mono text-cassetta-muted bg-cassetta-surface px-3 py-1.5 rounded-lg border border-cassetta-border">
            Aggiornato: 5 Apr 2026
          </span>
        </div>

        <div className="space-y-4">
          {newsWithVotes
            .sort((a, b) => b.score - a.score)
            .map((item, index) => (
              <NewsCard key={item.id} {...item} index={index} />
            ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-cassetta-border mt-16">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <p className="text-lg font-bold text-white mb-1">
                La Cassetta degli AI-trezzi
              </p>
              <p className="text-sm text-cassetta-muted max-w-md">
                Newsletter sull&apos;adozione AI nelle PMI italiane.
                Prima il processo, poi l&apos;AI. Niente fuffa.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href="https://lacassettadegliaitrezzi.substack.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cassetta-brand text-[#292524] font-semibold text-sm hover:bg-cassetta-brand-light transition-colors"
              >
                Iscriviti alla newsletter
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
                </svg>
              </a>
              <p className="text-xs text-cassetta-muted text-right">
                Curato da{" "}
                <a
                  href="https://valegro92.substack.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cassetta-brand hover:text-cassetta-brand-light transition-colors"
                >
                  Valentino Grossi
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
