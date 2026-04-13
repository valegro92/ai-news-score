// OpenRouter client — RACE parallelo su modelli gratuiti
// Il primo che risponde vince. Zero attesa su timeout sequenziali.

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Pool ampio di modelli free — li proviamo TUTTI in parallelo
const FREE_MODELS = [
  "openai/gpt-oss-20b:free",
  "openai/gpt-oss-120b:free",
  "google/gemma-3-12b-it:free",
  "google/gemma-3-27b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "openrouter/free",
];
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatResponse {
  choices: { message: { content: string } }[];
}

async function callModel(
  model: string,
  messages: ChatMessage[]
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai-news-score.vercel.app",
        "X-Title": "AI News Score Pipeline",
      },
      body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 2048 }),
    });
    clearTimeout(timer);
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`${model} → ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = (await res.json()) as ChatResponse;
    const content = data.choices[0]?.message?.content?.trim() || "";
    if (!content) throw new Error(`${model}: risposta vuota`);
    return content;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// RACE: lancia tutti i modelli in parallelo, il primo che risponde vince
export async function chat(messages: ChatMessage[]): Promise<string> {
  console.log(`🤖 Racing ${FREE_MODELS.length} modelli in parallelo...`);

  // Promise.any risolve con il primo successo
  try {
    const result = await Promise.any(
      FREE_MODELS.map(async (model) => {
        const r = await callModel(model, messages);
        console.log(`✅ ${model} ha vinto la race (${r.length} chars)`);
        return r;
      })
    );
    return result;
  } catch (aggErr) {
    // Tutti falliti — AggregateError contiene tutti gli errori
    const errors = (aggErr as AggregateError).errors || [];
    const msgs = errors.map((e: Error) => e.message || String(e));
    console.error("❌ Tutti i modelli falliti:", msgs);
    throw new Error(`Tutti i modelli hanno fallito:\n${msgs.join("\n")}`);
  }
}
// Chiede JSON strutturato
export async function chatJSON<T>(messages: ChatMessage[]): Promise<T> {
  const raw = await chat(messages);

  let jsonStr = raw;
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  } else {
    const objMatch = raw.match(/\{[\s\S]*\}/);
    if (objMatch) {
      jsonStr = objMatch[0];
    } else {
      throw new Error(`Nessun JSON trovato: ${raw.slice(0, 300)}`);
    }
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    throw new Error(`JSON non valido: ${jsonStr.slice(0, 300)}`);
  }
}