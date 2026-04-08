export default function Officina() {
  const steps = [
    "L\u0027AI cerca le news da 15+ fonti internazionali",
    "Le valuta con 5 criteri pesati (scala 1-10)",
    "Scrive le sintesi e aggiorna il codice del sito",
    "Pusha su GitHub \u2192 Vercel fa il deploy automatico",
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
            {" "}Ogni lunedì mattina un agente AI autonomo cerca le news della settimana,
            le valuta con un sistema a punti calibrato su chi lavora con l&apos;AI nelle PMI,
            scrive le sintesi, aggiorna questo sito e fa il deploy. Tutto senza intervento umano.
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
              Stack: Next.js 16 + Tailwind 4 su Vercel. Pipeline: Claude (Anthropic) come agente autonomo
              con web search, scoring, generazione codice e deploy via GitHub Actions.
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
