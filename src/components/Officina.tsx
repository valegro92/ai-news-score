export default function Officina() {
  const steps = [
    "Ogni lunedì la pipeline scrapa 100+ fonti RSS internazionali e italiane",
    "Un'AI valuta ogni notizia con score 1-10, tag e sommario in italiano",
    "Solo le top 30 passano il filtro e finiscono sul sito",
    "Tutto automatico: Vercel Cron → OpenRouter AI → Redis → deploy",
  ];

  return (
    <section className="max-w-4xl mx-auto px-6 py-12 mt-8">
      <div className="rounded-xl bg-cassetta-surface/80 border border-cassetta-border p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-cassetta-brand-dark/30 flex items-center justify-center text-sm">
            🏭
          </div>
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-cassetta-brand">
              Officina della Cassetta
            </p>
            <p className="text-[10px] text-cassetta-muted">
              Come nasce questo sito
            </p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-cassetta-muted leading-relaxed">
          <p>
            Questo sito è un esperimento dell&apos;
            <span className="text-cassetta-brand font-semibold">Officina della Cassetta degli AI-trezzi</span>
            {" "}&mdash; lo spazio dove mostro cosa si può costruire davvero con l&apos;AI generativa,
            senza fuffa e senza magia.
          </p>

          <p>
            <span className="text-cassetta-text font-semibold">Il metodo è 100% AI-driven.</span>
            {" "}Ogni lunedì mattina una pipeline automatica scrapa oltre 100 feed RSS
            &mdash; da TechCrunch a Wired Italia, da OpenAI Blog a Agenda Digitale, da Ben&apos;s Bites
            a Gary Marcus &mdash; filtra gli ultimi 7 giorni, deduplica e passa tutto a un&apos;AI
            che assegna uno score da 1 a 10 calibrato su chi lavora davvero con l&apos;AI nelle PMI.
            Nessun intervento umano.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
            {steps.map((step, i) => (
              <div key={i} className="p-3 rounded-lg bg-cassetta-bg border border-cassetta-border text-center">
                <p className="text-lg font-bold text-cassetta-brand mb-1">{i + 1}.</p>
                <p className="text-xs text-cassetta-muted">{step}</p>
              </div>
            ))}
          </div>

          <p>
            I criteri di scoring non sono casuali. Misurano cose come: un imprenditore ne parlerebbe
            lunedì mattina? Tocca un problema reale delle PMI? Ci sono dati verificabili? C&apos;è un
            angolo critico non ovvio? Le news che non passano il filtro non arrivano qui.
          </p>

          <p>
            <span className="text-cassetta-text font-semibold">Io non tocco nulla.</span>
            {" "}Ho progettato il metodo, i criteri e la pipeline &mdash; poi l&apos;AI fa il resto.
            Ogni settimana. In autonomia.{" "}
            <span className="text-cassetta-brand">
              È il mio modo di dimostrare che l&apos;AI non è solo chatbot:
              è infrastruttura.
            </span>
          </p>

          <div className="mt-4 pt-4 border-t border-cassetta-border/50">
            <p className="text-xs text-cassetta-hint">
              Stack: Next.js 16 + Tailwind 4 su Vercel. Pipeline: 100+ feed RSS via rss-parser,
              AI scoring con OpenRouter (5 modelli free in fallback), storage Upstash Redis,
              Vercel Cron settimanale.
              Progetto open source:{" "}
              <a
                href="https://github.com/valegro92/ai-news-score"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cassetta-brand hover:text-cassetta-brand-light transition-colors"
              >
                github.com/valegro92/ai-news-score
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
