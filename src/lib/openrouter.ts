// OpenRouter client con 5 modelli gratuiti in fallback
// La key è in process.env.OPENROUTER_API_KEY (Vercel env var, MAI nel codice)

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Modelli gratuiti su OpenRouter — ordinati per qualità
const FREE_MODELS = [
  "google/gemma-3-12b-it:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "qwen/qwen3-14b:free",
  "deepseek/deepseek-r1-0528:free",
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
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://ai-news-score.vercel.app",
      "X-Title": "AI News Score Pipeline",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${model} → ${res.status}: ${err}`);
  }

  const data = (await res.json()) as ChatResponse;
  return data.choices[0]?.message?.content?.trim() || "";
}

// Prova i modelli in ordine; se uno fallisce, passa al successivo
export async function chat(messages: ChatMessage[]): Promise<string> {
  const errors: string[] = [];

  for (const model of FREE_MODELS) {
    try {
      const result = await callModel(model, messages);
      if (result) return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      console.warn(`⚠️ Fallback: ${model} fallito → ${msg}`);
    }
  }

  throw new Error(
    `Tutti i modelli hanno fallito:\n${errors.join("\n")}`
  );
}

// Chiede JSON strutturato — riprova se il parse fallisce
export async function chatJSON<T>(
  messages: ChatMessage[]
): Promise<T> {
  const raw = await chat(messages);

  // Estrai il blocco JSON dalla risposta
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Nessun JSON trovato nella risposta: ${raw.slice(0, 200)}`);
  }

  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    throw new Error(`JSON non valido: ${jsonMatch[0].slice(0, 200)}`);
  }
}
