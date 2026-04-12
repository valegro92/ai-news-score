"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export default function SuggestSource() {
  const [url, setUrl] = useState("");
  const [nota, setNota] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setStatus("sending");
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), nota: nota.trim() }),
      });
      if (res.ok) {
        setStatus("sent");
        setUrl("");
        setNota("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-6 py-8">
      <div className="rounded-xl bg-cassetta-surface border border-cassetta-border p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-cassetta-brand/15 flex items-center justify-center text-sm">
            📡
          </div>
          <div>
            <p className="text-sm font-semibold text-cassetta-text">
              Hai visto qualcosa di interessante?
            </p>
            <p className="text-xs text-cassetta-muted">
              Segnala una fonte — se passa il filtro, finisce nella prossima settimana
            </p>
          </div>
        </div>

        {status === "sent" ? (
          <div className="animate-fade-in p-4 rounded-lg bg-cassetta-brand/10 border border-cassetta-brand/30">
            <p className="text-sm text-cassetta-brand font-semibold">
              Ricevuto! La valuterò con il metodo. Se passa, la trovi qui lunedì.
            </p>
            <button
              onClick={() => setStatus("idle")}
              className="text-xs text-cassetta-muted mt-2 hover:text-cassetta-text transition-colors"
            >
              Segnala un&apos;altra fonte →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://... incolla il link alla notizia"
                required
                className="w-full px-4 py-2.5 rounded-lg bg-cassetta-bg border border-cassetta-border text-sm text-cassetta-text placeholder:text-cassetta-hint focus:outline-none focus:border-cassetta-brand focus:ring-1 focus:ring-cassetta-brand/30 transition-colors"
              />
            </div>
            <div>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Perché è rilevante? (opzionale)"
                rows={2}
                maxLength={500}
                className="w-full px-4 py-2.5 rounded-lg bg-cassetta-bg border border-cassetta-border text-sm text-cassetta-text placeholder:text-cassetta-hint focus:outline-none focus:border-cassetta-brand focus:ring-1 focus:ring-cassetta-brand/30 transition-colors resize-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-cassetta-hint">
                L&apos;AI la valuterà con lo stesso metodo delle 100+ fonti monitorate.
              </p>
              <button
                type="submit"
                disabled={status === "sending" || !url.trim()}
                className="px-5 py-2 rounded-lg bg-cassetta-brand text-[#1A1918] text-sm font-semibold hover:bg-cassetta-brand-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === "sending" ? "Invio..." : "Segnala"}
              </button>
            </div>
            {status === "error" && (
              <p className="text-xs text-cassetta-red">
                Qualcosa è andato storto. Riprova tra poco.
              </p>
            )}
          </form>
        )}
      </div>
    </section>
  );
}
