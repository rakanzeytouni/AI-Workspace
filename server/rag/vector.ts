import fs from "fs";
import path from "path";

const DB_DIR = path.join(__dirname, "..", "chroma_db");
const DB_FILE = path.join(DB_DIR, "vectors.json");

type VecEntry = {
  id: string;
  docId: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
};

function ensureDbDir() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
}

function loadDb(): VecEntry[] {
  ensureDbDir();

  try {
    if (!fs.existsSync(DB_FILE)) return [];

    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDb(items: VecEntry[]) {
  ensureDbDir();
  fs.writeFileSync(DB_FILE, JSON.stringify(items), "utf-8");
}

/* ---------------- UPLOAD ---------------- */

export async function upsertDocumentChunks(
  docId: string,
  chunks: string[],
  embeddings: number[][]
) {
  const db = loadDb();
  const filtered = db.filter((e) => e.docId !== docId);

  for (let i = 0; i < chunks.length; i++) {
    const embedding = embeddings[i];
    const text = chunks[i];

    if (!embedding || embedding.length === 0) continue;
    if (!text || text.trim().length === 0) continue;

    filtered.push({
      id: `${docId}-${i}`,
      docId,
      chunkIndex: i,
      text,
      embedding,
    });
  }

  saveDb(filtered);
}

/* ---------------- SIMILARITY ---------------- */

function cosineSimilarity(a: number[], b: number[]) {
  if (!a || !b || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b[i];

    dot += x * y;
    normA += x * x;
    normB += y * y;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;

  return dot / denom;
}

/* ---------------- SEARCH ---------------- */

const MIN_SCORE = 0.7; // أخف شوي حتى ما يصير empty دائما

export function searchByEmbedding(queryEmbedding: number[], topK = 3) {
  const db = loadDb();

  if (!queryEmbedding?.length) return [];

  return db
    .map((e) => ({
      entry: e,
      score: cosineSimilarity(e.embedding, queryEmbedding),
    }))
    .filter((s) => s.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.entry);
}

/* ---------------- UTIL ---------------- */

export function listVectorsCount() {
  return loadDb().length;
}

export default {
  upsertDocumentChunks,
  searchByEmbedding,
  listVectorsCount,
};