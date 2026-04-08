export default function Footer() {
  return (
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
  );
}
