#!/usr/bin/env npx tsx
/**
 * validate-news.ts
 * 
 * Guardrail per la pipeline AI: valida tutti i file JSON in src/data/weeks/
 * prima di un commit/push. Se qualcosa non va, esce con codice 1.
 *
 * Uso: npx tsx scripts/validate-news.ts
 * Oppure: npm run validate
 */

import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const WEEKS_DIR = join(__dirname, "..", "src", "data", "weeks");
const REQUIRED_FIELDS = ["id", "titolo", "fonte", "data", "url", "categoria", "sintesi", "score"];
const VALID_CATEGORIES = [
  "Adozione AI",
  "AI e Lavoro",
  "Tool e Automazione",
  "Regolamentazione",
  "Business AI",
  "Modelli e Open Source",
];

let errors = 0;
let warnings = 0;

function err(msg: string) { console.error(`  ❌ ${msg}`); errors++; }
function warn(msg: string) { console.warn(`  ⚠️  ${msg}`); warnings++; }
function ok(msg: string) { console.log(`  ✅ ${msg}`); }

const files = readdirSync(WEEKS_DIR).filter((f) => f.endsWith(".json")).sort();
if (files.length === 0) {
  err("Nessun file JSON trovato in src/data/weeks/");
  process.exit(1);
}

console.log(`\n🔍 Validazione news — ${files.length} settimane trovate\n`);

for (const file of files) {
  console.log(`📄 ${file}`);
  let raw: string;
  try {
    raw = readFileSync(join(WEEKS_DIR, file), "utf-8");
  } catch (e) {
    err(`Impossibile leggere ${file}: ${e}`);
    continue;
  }

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    err(`JSON non valido in ${file}: ${e}`);
    continue;
  }

  // Validate week structure
  if (!data.id) err("Manca 'id' nella settimana");
  if (!data.label) err("Manca 'label' nella settimana");
  if (!data.lastUpdate) err("Manca 'lastUpdate' nella settimana");
  if (!Array.isArray(data.news)) { err("'news' non è un array"); continue; }
  if (data.news.length === 0) err("Array 'news' vuoto");
  if (data.news.length < 5) warn(`Solo ${data.news.length} news — poche per una settimana`);

  // Validate filename matches id
  const expectedFilename = `${data.id}.json`;
  if (file !== expectedFilename) {
    err(`Filename '${file}' non corrisponde a id '${data.id}' (atteso: ${expectedFilename})`);
  }

  // Validate each news item
  const ids = new Set<string>();
  for (const item of data.news) {
    // Check duplicate IDs
    if (ids.has(item.id)) err(`ID duplicato: ${item.id}`);
    ids.add(item.id);

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!(field in item) || item[field] === undefined || item[field] === "") {
        err(`[${item.id || "???"}] Campo mancante: ${field}`);
      }
    }

    // Validate score range
    if (typeof item.score !== "number" || item.score < 1 || item.score > 10) {
      err(`[${item.id}] Score non valido: ${item.score} (deve essere 1-10)`);
    }

    // Validate category
    if (item.categoria && !VALID_CATEGORIES.includes(item.categoria)) {
      warn(`[${item.id}] Categoria sconosciuta: "${item.categoria}"`);
    }

    // Validate URL format
    if (item.url && !item.url.startsWith("http")) {
      err(`[${item.id}] URL non valida: ${item.url}`);
    }

    // Validate title length
    if (item.titolo && item.titolo.length > 150) {
      warn(`[${item.id}] Titolo troppo lungo (${item.titolo.length} chars, max suggerito: 150)`);
    }

    // Validate sintesi length
    if (item.sintesi && item.sintesi.length < 50) {
      warn(`[${item.id}] Sintesi troppo corta (${item.sintesi.length} chars)`);
    }
  }

  ok(`${data.news.length} news validate in ${data.id}`);
}

// Summary
console.log("\n" + "─".repeat(50));
if (errors > 0) {
  console.error(`\n💥 ${errors} errori, ${warnings} warning — FIX REQUIRED prima del deploy\n`);
  process.exit(1);
} else if (warnings > 0) {
  console.warn(`\n⚠️  ${warnings} warning, 0 errori — deploy possibile ma controlla\n`);
  process.exit(0);
} else {
  console.log(`\n🎉 Tutto ok — 0 errori, 0 warning. Pronto per il deploy.\n`);
  process.exit(0);
}
