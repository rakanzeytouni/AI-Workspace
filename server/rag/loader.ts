import "@langchain/community";
// rag/loader.ts
import fs from "fs";

export async function loadDocs() {
  const file = fs.readFileSync("./data/docs.txt", "utf-8");

  const chunks = file
    .split("\n\n")
    .map((t) => t.trim())
    .filter(Boolean);

  return chunks;
}