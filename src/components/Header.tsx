import Image from "next/image";

interface HeaderProps {
  totalNews: number;
  topScore: number;
  avgScore: string;
  weekLabel: string;
  lastUpdate: string;
  showArchiveLink?: boolean;
}

export default function Header({
  totalNews, topScore, avgScore, weekLabel, lastUpdate,
}: HeaderProps) {
  // showArchiveLink not used in header yet — reserved for future nav
  return (
    <header className="relative overflow-hidden border-b border-cassetta-border">
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
          <Image
            src="/logo-120.png"
            alt="La Cassetta degli AI-trezzi"
            width={40}
            height={40}
            className="rounded-lg"
            priority
          />
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
        <div className="mt-8 p-4 rounded-xl bg-cassetta-surface/80 border border-cassetta-border max-w-xl">
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
  );
}
