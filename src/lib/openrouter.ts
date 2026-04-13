// OpenRouter client con modelli gratuiti in fallback
// La key è in process.env.OPENROUTER_API_KEY (Vercel env var, MAI nel codice)

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Modelli gratuiti su OpenRouter — aggiornati aprile 2026
const FREE_MODELS = [
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "minimax/minimax-m2.5:free",
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
      max_tokens: 4096,
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
      console.log(`🤖 Provo modello: ${model}`);
      const result = await callModel(model, messages);
      if (result) {
        console.log(`✅ Risposta da ${model} (${result.length} chars)`);
        return result;
      }
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

  // Estrai il blocco JSON dalla risposta (gestisce anche ```json ... ```)
  let jsonStr = raw;
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  } else {
    const objMatch = raw.match(/\{[\s\S]*\}/);
    if (objMatch) {
      jsonStr = objMatch[0];
    } else {
      throw new Error(`Nessun JSON trovato nella risposta: ${raw.slice(0, 300)}`);
    }
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    throw new Error(`JSON non valido: ${jsonStr.slice(0, 300)}`);
  }
}
